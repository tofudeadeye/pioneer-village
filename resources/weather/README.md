# Weather System

A grid-based spatial weather system for RedM that provides smooth, directional weather transitions between cells. Weather state lives on the socket server, is broadcast to clients via the UI bridge, and is rendered client-side using a two-slot transition engine and heading-based targeting.

## Table of Contents

- [Architecture](#architecture)
- [Grid Structure](#grid-structure)
- [Grid Generation](#grid-generation)
- [Weather Compatibility Graph](#weather-compatibility-graph)
- [Smooth Transition Engine](#smooth-transition-engine)
- [Spatial Transition System](#spatial-transition-system)
- [Weather Evolution](#weather-evolution)
- [Client Communication](#client-communication)
- [Client Exports](#client-exports)
- [Biome-Specific Variants](#biome-specific-variants)
- [Debug Commands](#debug-commands)
- [Grid Stats](#grid-stats)
- [Known Limitations / Future Enhancements](#known-limitations--future-enhancements)

## Architecture

The system is split across three layers:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Socket Server                                │
│  socket/src/managers/weather.ts   socket/src/controllers/weather.ts │
│                                                                     │
│  - BiomeWeatherGrid (8x8 grid, biome map, cell bounds)            │
│  - BiomeManager (biome boundaries, weather rules)                  │
│  - Weather evolution (5-minute tick, 10% chance per cell)          │
│  - Admin RPCs (freeze, override, regenerate, set biome weather)    │
│  - Source of truth for all grid state                              │
├─────────────────────────────────────────────────────────────────────┤
│                        UI Controller                                │
│  resources/ui/src/ui/app/controllers/weather.ts                     │
│                                                                     │
│  - Bridges socket server <-> game client                           │
│  - Forwards grid updates, freeze state, global overrides to client │
│  - Forwards client RPCs to socket server (request-grid, admin ops) │
├─────────────────────────────────────────────────────────────────────┤
│                       Client Resource                               │
│  resources/weather/src/client/                                      │
│                                                                     │
│  - ClientWeatherManager (per-player state, spatial transitions)    │
│  - Smooth transition engine (two-slot A/B blending via natives)    │
│  - Heading-based neighbor targeting (anti-flapping)                │
│  - Weather rendering via SetCurrWeatherState native                │
│  - Typed exports for other resources                               │
│  - Debug commands                                                  │
│  - No server code — client only                                    │
└─────────────────────────────────────────────────────────────────────┘
```

**Data flow:**

```
Socket Server                UI Controller              Game Client
     │                            │                          │
     │──── grid-update ──────────>│──── grid-update ────────>│
     │──── freeze-state ─────────>│──── freeze-state ───────>│
     │──── global-override ──────>│──── global-override ────>│
     │                            │                          │
     │<─── request-grid ──────────│<─── request-grid ────────│
     │<─── admin.freeze-weather ──│<─── admin.freeze-weather─│
     │<─── admin.force-global ────│<─── admin.force-global ──│
     │<─── admin.set-biome-weather│<─── admin.set-biome...  ─│
     │<─── admin.regenerate-grid ─│<─── admin.regenerate... ─│
```

## Grid Structure

The world is divided into an 8x8 grid of weather cells. Each cell contains:

- **Weather type** — one of 21 `WeatherType` values (SUNNY, RAIN, SNOW, FOG, etc.)
- **Biome type** — one of 12 `BiomeType` values (HEARTLANDS, GRIZZLIES, etc.)
- **Variant** — biome-specific visual variant string, or null
- **Rain rate** — 0.0 to 1.0, only applies to RAIN, SHOWER, DRIZZLE, THUNDERSTORM

### Transition Zones

Each cell is divided into two zones:

```
┌─────────────────────────────────────┐
│                                     │
│    ┌───────────────────────────┐   │
│    │                           │   │
│    │   SETTLED ZONE (50%)      │   │  No transitions occur
│    │   transitionPercent = 0.0 │   │  Weather is stable
│    │                           │   │
│    │         CENTER            │   │
│    │                           │   │
│    └───────────────────────────┘   │
│                                     │
│      TRANSITION ZONE (50%)          │  Transitions occur here
│      transitionPercent: 0.0 → 0.5   │  Weather blends with neighbor
│                                     │
└─────────────────────────────────────┘
```

- **Inner 50%**: Settled zone — no transitions, stable weather
- **Outer 50%**: Transition zone — weather blends based on distance from center

## Grid Generation

Grid generation runs in two phases when `generateBiomeAwareWeather()` is called.

### Phase 1 — Seeding

For each biome, roughly 30% of its cells are selected as seed points (minimum 1). Each seed cell is assigned a randomly chosen weather type from `BIOME_WEATHER_RULES[biome]`, subject to compatibility with any already-placed seeds nearby. Cells that cannot satisfy constraints are skipped. Successfully seeded cells are added to `assignedCells`.

### Phase 2 — Fill: Greedy Wave Function Collapse

The remaining unassigned cells are filled using a **greedy Wave Function Collapse (WFC)** algorithm. The key property is that exactly **one cell is committed per iteration**, always chosen as the most-constrained frontier cell — the unassigned cell adjacent to at least one assigned cell that has the fewest remaining valid weather options.

```
while frontier cells exist:
  for each unassigned cell adjacent to an assigned cell:
    compute valid options = biome types ∩ compatible with all assigned neighbours
  pick cell with fewest valid options  ← most constrained first
  assign it, add to assignedCells
  repeat
```

#### Why BFS was replaced

The original implementation used a **Breadth-First Search (BFS) wave expansion**. Seeds were placed into a queue and the grid was filled by processing neighbours in wave order. This introduced a systematic race condition:

```
BFS wave 2 — two adjacent cells processed in the same pass:

   Seed A (assigned)
   │
   ├── Cell X  ← queued, assigned RAIN  (sees only A)
   └── Cell Y  ← queued, assigned RAIN  (also sees only A)

   Result: X and Y are adjacent and both RAIN — compatibility violation
```

Because BFS commits multiple cells per wave, cells in the same wave are assigned without seeing each other as constraints. The larger the grid and the more seeds, the more frequently two frontier cells in the same wave ended up adjacent with conflicting or identical weather.

The greedy WFC eliminates this entirely. By committing one cell at a time and immediately adding it to `assignedCells`, every subsequent candidate sees the fully up-to-date constraint state. No two cells are ever assigned in the same step, so the race condition cannot occur.

#### Most-constrained-first heuristic

Choosing the cell with the **fewest remaining valid options** is a standard WFC technique to reduce contradictions. A cell with only one valid option must be assigned that option immediately — deferring it risks adjacent cells consuming that option, leaving it with zero valid choices. Assigning tight cells first keeps the constraint space maximally open for cells that have more flexibility.

#### Fallback handling

If a frontier cell reaches zero valid options (constraint deadlock), the algorithm does not backtrack. Instead it applies a progressive relaxation:

1. **Best partial match** — scores each biome-allowed type by how many of its assigned neighbours it is compatible with, and picks the highest-scoring type(s). This minimises the number of constraint violations rather than picking arbitrarily.
2. **Deadlock fallback** — if all biome types are blocked by same-type constraints (e.g., a desert biome with only 3–4 types whose neighbours already hold all of them), the scoring is repeated allowing same-type candidates, favouring the one most compatible with non-same-type neighbours. This produces at most one same-type adjacency rather than silently leaving the cell at the default placeholder.
3. **Safety net** — immediately before selection, any candidate that would duplicate an assigned neighbour's weather type is removed from the candidate list (if doing so still leaves at least one option). This catches same-type slippage from the fallback path.

Deadlocks only occur in very small biomes at the edge of the map (e.g., RIO_BRAVO with 3 cell types) where the 8-directional neighbourhood can exhaust the entire biome palette. These cases are kept rare by ensuring each biome has enough weather types to satisfy typical neighbourhood configurations.

### `assignedCells` tracking

Both `isCompatibleWithNeighbors` and `getCompatibleWeatherTypes` skip neighbours that are not in `assignedCells`. This means the default `CLOUDS` placeholder that cells hold before assignment is never treated as a constraint. Without this, every unassigned cell would appear to have `CLOUDS` weather and heavily skew the compatibility filtering before any real assignment had taken place.

## Weather Compatibility Graph

A directed graph defines which weather types can transition to each other. The `findWeatherTransitionPath()` function uses BFS to find the shortest path between any two types.

### Chains

```
Extreme Cold:   WHITEOUT <-> BLIZZARD <-> GROUNDBLIZZARD
Cold/Snow:      SNOW <-> SNOWLIGHT <-> HAIL <-> SLEET
Storm:          HURRICANE <-> THUNDER <-> THUNDERSTORM
Wet:            RAIN <-> SHOWER <-> DRIZZLE <-> MISTY <-> FOG
Overcast:       OVERCAST | OVERCASTDARK
Hub:            CLOUDS (connects to SUNNY, OVERCAST, OVERCASTDARK,
                        HIGHPRESSURE, DRIZZLE, SNOWLIGHT, FOG)
Clear:          SUNNY <-> HIGHPRESSURE
Desert:         SANDSTORM
```

CLOUDS acts as the hub node connecting most chains. Cross-chain transitions route through it. For example, SNOW to RAIN goes: SNOW -> SNOWLIGHT -> CLOUDS -> DRIZZLE -> RAIN (4 hops).

The compatibility graph is also used by the smooth transition engine — when the game's current weather slots don't match the target, it walks through intermediate hops.

## Smooth Transition Engine

ALL weather changes go through the smooth transition engine. There are no direct `SetCurrWeatherState` calls outside of it.

### How It Works

The game has two weather "slots" (A and B) with a blend percent between them:

```
SetCurrWeatherState(hashA, hashB, percent, true)
  percent = 0.0  →  fully slot A
  percent = 0.5  →  50/50 blend
  percent = 0.9  →  fully slot B
```

To change weather, the engine:
1. Slides the percent to free a slot (e.g., slide to 0% to free slot B)
2. Swaps the freed slot to the next weather type in the path
3. Slides the percent toward the new type
4. Repeats for each hop in the path

### Key Functions

- **`transitionToWeather(target, rainRate)`** — Transitions to a single settled weather type. Plans a multi-hop path through the compatibility graph, builds a step queue, and starts the tick loop. Used for initial load, global overrides, and when neither game slot matches the spatial target.

- **`transitionToTarget(targetA, targetB, percent, rainRate)`** — Transitions to a specific A/B/percent blend. Used during spatial transitions when the player is between two cells. Figures out which slot needs changing, slides to free it, swaps, then slides to the target percent.

### Timing

- Each hop takes **700ms** (`HOP_DURATION_MS`)
- Maximum path length is 7 hops (worst case in the compatibility graph)
- Longest transition is ~5 seconds
- A `setTick` loop lerps the percent each frame within a hop
- Steps complete instantly if they are no-ops or settle steps (both slots same type)

### Fallback

If no valid transition path exists (should not happen with a connected graph), the engine falls back to `snapToWeather()` which immediately sets both slots.

## Spatial Transition System

The client polls every 5 seconds, calculating the player's grid position and heading to determine if weather should transition.

### State Machine

```
                  ┌──────────────┐
                  │   SETTLED    │
                  │              │
                  │ - No target  │
                  │ - Stable     │
                  └──────┬───────┘
                         │
            Player moves towards edge
            (enters outer 50%)
                         │
                         ↓
                  ┌──────────────┐
           ┌─────→│ APPROACHING  │
           │      │              │
           │      │ - Target set │
  Heading │      │ - 0.0 → 0.5  │
  changed │      └──────┬───────┘
  > 45°   │             │
           │    Player crosses edge
           │             │
           │             ↓
           │      ┌──────────────┐
           └──────│   CROSSED    │
                  │              │
                  │ - Same target│
                  │ - 0.5 → 0.9  │
                  └──────┬───────┘
                         │
            Reached 50% mark (≥0.89)
                         │
                         ↓
                  ┌──────────────┐
                  │   SETTLED    │
                  │              │
                  │ - Weather    │
                  │   updated    │
                  └──────────────┘
```

### Two-Phase Transition

A complete transition across cells follows two phases:

```
Phase 1: APPROACHING          Phase 2: CROSSED
(in Cell A)                   (in Cell B)

     Cell A                        Cell B
┌─────────────────┐           ┌─────────────────┐
│                 │           │                 │
│  ┌──────────┐   │           │   ┌──────────┐  │
│  │ Settled  │   │           │   │ Settled  │  │
│  │          │   │           │   │          │  │
│  │    ■     │   │    Edge   │   │     ■    │  │
│  │          │   │      ↓    │   │          │  │
│  └──────────┘   │      ║    │   │          │  │
│      ↓          │      ║    │   │     ↑    │  │
│   Player        │      ║    │   │  Player  │  │
│   moving →      │      ║    │   │  moving  │  │
│                 │      ║    │   │          │  │
│  0.0 → 0.5 ─────┼──────╬────┼───┼→ 0.5→0.9 │  │
│                 │      ║    │   │          │  │
└─────────────────┘      ║    └───┼──────────┘  │
                         ║        │             │
  Weather: A → B         ║        │  Weather: A → B
  Percent: 0.0 → 0.5 ════╝        │  Percent: 0.5 → 0.9
                                  │
                                  At 0.9:
                                  - Phase = 'settled'
                                  - Weather = B
                                  - Target = null
```

### Heading-Based Targeting

The system uses player heading to determine which neighbor cell to transition towards, preventing "flapping" when moving diagonally.

RDR2 uses counter-clockwise heading angles:

```
              N (0°)
              ↑
              │
    NW        │        NE
  (22.5-67.5) │   (292.5-337.5)
      ↖       │       ↗
         ╲    │    ╱
          ╲   │   ╱
           ╲  │  ╱
W (67.5─────╲ │ ╱─────270°) E
-112.5)      ╲│╱
              ■ Player
             ╱│╲
            ╱ │ ╲
           ╱  │  ╲
          ╱   │   ╲
         ╱    │    ╲
      ↙       │       ↘
    SW        │        SE
(112.5-157.5) │   (202.5-247.5)
              │
              ↓
            S (180°)
```

```
Heading Range    →  Direction  →  Grid Offset
─────────────────────────────────────────────
337.5° - 22.5°   →     N       →  (0, +1)
22.5° - 67.5°    →     NW      →  (-1, +1)
67.5° - 112.5°   →     W       →  (-1, 0)
112.5° - 157.5°  →     SW      →  (-1, -1)
157.5° - 202.5°  →     S       →  (0, -1)
202.5° - 247.5°  →     SE      →  (+1, -1)
247.5° - 292.5°  →     E       →  (+1, 0)
292.5° - 337.5°  →     NE      →  (+1, +1)
```

### Anti-Flapping

Without heading-based targeting:
```
┌─────┬─────┬─────┐
│  A  │  B  │  C  │
├─────┼─────┼─────┤     Player moving diagonally NE
│  D  │  E  │  F  │     Path: E → B → F (flapping!)
├─────┼─────┼─────┤     Transitions: E→B, B→E, E→B, B→F
│  G  │  H  │  I  │
└─────┴─────┴─────┘
```

With heading-based targeting:
```
┌─────┬─────┬─────┐
│  A  │  B  │  C  │
├─────┼─────┼─────┤     Player moving diagonally NE (heading ~315°)
│  D  │  E ╱│  F  │     Path: E → F directly
├─────┼───╱─┼─────┤     Transition: E→F (clean!)
│  G  │ ╱ H │  I  │
└─────┴─────┴─────┘
```

If the player's heading changes by more than 45 degrees during a transition, the target resets and the transition returns to settled state.

## Weather Evolution

The socket server evolves weather every 5 minutes:

- Each of the 64 cells has a **10% chance to change** per tick
- On average ~6 cells change per evolution cycle
- New weather is chosen from the cell's biome-allowed types
- Biome-specific variants are selected when available
- Rain rate is assigned for rain-capable weather types
- Respects **frozen state** — no evolution while frozen
- Respects **global override** — no evolution while overridden
- Grid updates are broadcast to all clients via `weather.grid-update`
- Clients pick up changes on their next 5-second spatial tick (no forced snap)

## Client Communication

### Grid Requests (client-initiated)

```
Client                    UI Controller              Socket Server
  │                            │                          │
  │── awaitUI('weather.       │                          │
  │     request-grid') ──────>│── socket.emit('weather.  │
  │                           │     request-grid', cb) ─>│
  │                           │                          │── reads grid
  │                           │<──── cb({ grid }) ───────│
  │<──── resolve({ grid }) ───│                          │
```

### Grid Updates (server-initiated)

```
Socket Server              UI Controller              Client
  │                            │                          │
  │── userNamespace.emit(     │                          │
  │   '__client__',           │                          │
  │   'weather.grid-update',  │                          │
  │    grid) ────────────────>│── emitClient('weather.   │
  │                           │     grid-update', grid)─>│
  │                           │                          │── updates local grid
```

### Admin RPCs

All admin operations follow the same pattern through the UI controller:

| Event | Direction | Purpose |
|-------|-----------|---------|
| `weather.admin.freeze-weather` | client -> socket | Pause/resume evolution |
| `weather.admin.force-global` | client -> socket | Override all cells to one type (or clear) |
| `weather.admin.set-biome-weather` | client -> socket | Set all cells of a biome to a weather type |
| `weather.admin.regenerate-grid` | client -> socket | Regenerate the entire grid (optional seed) |
| `weather.admin.get-grid-state` | client -> socket | Get grid + frozen + override state |

### Broadcast Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `weather.grid-update` | socket -> client | Full grid data after evolution or admin change |
| `weather.freeze-state` | socket -> client | Freeze state changed |
| `weather.global-override` | socket -> client | Global override set or cleared |

## Client Exports

Other resources can query the weather system using typed exports:

```ts
import { PVWeather } from '@lib/client';

PVWeather.getCurrentWeather()      // WeatherType | null
PVWeather.getTargetWeather()       // WeatherType | null — null if settled
PVWeather.getCurrentBiome()        // BiomeType | null
PVWeather.getTransitionProgress()  // number (0.0 - 0.9)
PVWeather.isTransitioning()        // boolean
PVWeather.getBiomeName(biome)      // string — display name for a BiomeType
```

## Biome-Specific Variants

Each biome has its own set of appropriate weather variants for visual variety:

| Biome | Example Variants |
|-------|-----------------|
| GRIZZLIES | `BLIZZARD_winter2`, `SNOW_Odriscolls1`, `WHITEOUT_winter1` |
| TALL_TREES | `MISTY_train1`, `DRIZZLE_finale1`, `OVERCASTDARK_Gang2` |
| BAYOU | `FOG_guama`, `SHOWER_guama`, `HURRICANE_guama` |
| HEARTLANDS | `MISTY_MP_intro`, `THUNDERSTORM_nativeSon3`, `OVERCASTDARK_STD1` |
| NEW_AUSTIN / RIO_BRAVO | `HIGHPRESSURE_guama`, `Sunny_odriscols4` |
| LEMOYNE | `MISTY_braithwaites3`, `SHOWER_guama`, `THUNDERSTORM_MP_Pred` |
| ROANOKE | `MISTY_MP_Pred`, `OVERCASTDARK_finale2`, `Fog_MP_Pred` |

The socket server automatically selects biome-appropriate variants when generating or evolving weather. If no biome-specific variant exists for a weather type, it falls back to the general variant pool.

## Debug Commands

### `/weather:grid`

Print the full grid to console with biome abbreviation + weather per cell. Marks the player's current cell with `*`.

### `/weather:check`

Display current player weather state details:

```
========================================
WEATHER INFORMATION
========================================
Position: 1234.5, 5678.9, 123.4
Heading: 315.2°
Current Cell: (3, 5)
Current Biome: Heartlands
Current Weather: SUNNY
Target Weather: RAIN
Target Cell: (4, 6)
Transition Phase: approaching
Transition Percent: 35.67%
========================================
```

### `/weather:test`

Generate a checkerboard pattern for visual testing:

```
┌─────┬─────┬─────┬─────┬─────┐
│ ☀️  │ 🌧️  │ ☀️  │ 🌧️  │ ☀️  │
├─────┼─────┼─────┼─────┼─────┤
│ 🌧️  │ ☀️  │ 🌧️  │ ☀️  │ 🌧️  │
├─────┼─────┼─────┼─────┼─────┤
│ ☀️  │ 🌧️  │ ☀️  │ 🌧️  │ ☀️  │
├─────┼─────┼─────┼─────┼─────┤
│ 🌧️  │ ☀️  │ 🌧️  │ ☀️  │ 🌧️  │
├─────┼─────┼─────┼─────┼─────┤
│ ☀️  │ 🌧️  │ ☀️  │ 🌧️  │ ☀️  │
└─────┴─────┴─────┴─────┴─────┘

Pattern: (x + y) % 2 === 0 → SUNNY
         (x + y) % 2 === 1 → RAIN
```

### `/weather:force <TYPE>`

Force all grid cells to a specific weather type locally. Example: `/weather:force SNOW`

### `/weather:sync`

Re-request the weather grid from the socket server, resetting any local overrides.

### `/weather:compat [TYPE]`

Analyze the weather compatibility graph. Reports:
- Isolated types (no outgoing transitions)
- Unreachable pairs (no path between two types)
- Hop distribution (how many pairs at each hop count)
- Max hops and worst-case path
- If a `TYPE` argument is given, prints all paths from that type to every other type

### `/togglegrid`

Visual grid overlay with biome colors (registered outside the weather resource).

### `/gridheight <height>`

Set the Z height of the visual grid overlay.

## Grid Stats

| Metric | Value |
|--------|-------|
| Grid size | 8 x 8 (64 cells) |
| Cell size | ~1,472 x 1,296 world units |
| Map X range | -5,632 to 6,144 |
| Map Y range | -5,760 to 4,608 |
| Weather types | 21 |
| Biomes | 12 |
| Weather types per biome | 3 to 10 |
| Client poll interval | 5 seconds |
| Server evolution interval | 5 minutes |
| Evolution chance per cell | 10% |
| Transition hop duration | 700ms |
| Max transition hops | ~7 |

## Known Limitations / Future Enhancements

- Cell size is large — could benefit from a 16x16 grid for finer resolution
- No weather "fronts" or directional storm movement
- No time-of-day influence on weather selection
- No seasonal variation in biome weather rules
- Evolution rate is uniform across all biomes
- No admin UI — RPCs exist but no in-game panel yet
- Permission system is a placeholder (account system not yet integrated)
- No wind system or wind-influenced weather
- No multi-layer weather (e.g., ground fog + high clouds)
- No forecasting or predictive weather patterns
