# Weather Transition System

A grid-based weather system for RedM that provides smooth, directional weather transitions between cells using heading-based targeting and a three-phase state machine.

## Table of Contents

- [Overview](#overview)
- [Key Concepts](#key-concepts)
- [Spatial Calculations](#spatial-calculations)
- [State Machine](#state-machine)
- [Heading-Based Targeting](#heading-based-targeting)
- [Usage](#usage)
- [Testing](#testing)
- [Debug Commands](#debug-commands)

## Overview

The weather system divides the game world into a grid of cells, where each cell has its own weather type and biome. As players move between cells, the weather transitions smoothly based on their position and heading direction.

**Key Features:**
- **Heading-aware transitions**: Weather transitions target the cell you're moving towards, not intermediate cells
- **Anti-flapping**: Diagonal movement transitions directly to the diagonal cell
- **Smooth progression**: Transitions use a 0.0 → 0.5 → 0.9 scale to blend between weather types
- **Settled zones**: Inner 50% of each cell maintains stable weather without transitions

## Key Concepts

### Grid Structure

The world is divided into a 2D grid of weather cells. Each cell contains:
- Weather type (SUNNY, RAIN, SNOW, FOG, etc.)
- Biome type (HEARTLANDS, GRIZZLIES, etc.)
- Spatial bounds (position and dimensions)

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

- **Inner 50%**: Settled zone - no transitions, stable weather
- **Outer 50%**: Transition zone - weather blends based on distance from center

### Transition Percentage Scale

The system uses `SetCurrWeatherState(hash1, hash2, percentFloat)` which only accepts values from 0.0 to 0.9:

- **0.0**: Fully in first weather type (settled)
- **0.5**: At the boundary between cells (50/50 blend)
- **0.9**: Fully in second weather type (settled in new cell)

## Spatial Calculations

### Single Cell Transition

When approaching a cell boundary, the transition starts at the 50% mark (not the true center):

```
        Cell A                    Cell B
┌─────────────────────┐  ┌─────────────────────┐
│                     │  │                     │
│   ┌─────────────┐   │  │   ┌─────────────┐   │
│   │  Settled    │   │  │   │  Settled    │   │
│   │   Zone      │   │  │   │   Zone      │   │
│   │             │   │  │   │             │   │
│   │ ■ Center    │   │  │   │    Center   │   │
│   │             │   │  │   │             │   │
│   └─────────────┘   │  │   └─────────────┘   │
│    Transition       │  │       Transition    │
│      Zone           │  │         Zone        │
│         │           │  │           │         │
│         ↓           │  │           ↓         │
│    0.0 → 0.5 ───────┼──┼─────→ 0.5 → 0.9    │
│         │           │  │           │         │
└─────────┴───────────┘  └───────────┴─────────┘
               ▲  Edge (0.5)  ▲
               └───────────────┘
```

**Distance Calculation:**

```typescript
// Distance from cell center to edge
halfDistance = distanceBetweenCenters / 2

// Transition zone starts at 50% of the way from edge to center
transitionStartDistance = halfDistance * 0.5

// Transition zone width (outer 50% of cell)
transitionRange = halfDistance - transitionStartDistance
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

### Distance Formulas

**Phase 1 - Approaching (0.0 → 0.5):**

```
Player in current cell, moving towards target cell edge

distanceFromCenter = √[(x - cellCenterX)² + (y - cellCenterY)²]

if distanceFromCenter < transitionStartDistance:
    transitionPercent = 0.0  // In settled zone
else:
    progressInZone = distanceFromCenter - transitionStartDistance
    transitionPercent = (progressInZone / transitionRange) × 0.5
```

**Phase 2 - Crossed (0.5 → 0.9):**

```
Player has crossed into target cell, moving towards its 50% mark

distanceFromCenter = √[(x - newCellCenterX)² + (y - newCellCenterY)²]

if distanceFromCenter > transitionEndDistance:
    distanceFromEdge = halfDistance - distanceFromCenter
    progressInZone = max(0, distanceFromEdge)
    transitionPercent = 0.5 + (progressInZone / transitionRange) × 0.4
else:
    transitionPercent = 0.9  // Reached 50% mark, fully settled
```

## State Machine

The system uses a three-phase state machine to track transitions:

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

### State Transitions

**SETTLED → APPROACHING:**
- Player enters transition zone (outer 50% of cell)
- System determines neighbor based on heading
- Sets target cell and target weather
- Begins transition from 0.0 → 0.5

**APPROACHING → CROSSED:**
- Player crosses cell boundary into target cell
- Keeps same target weather
- Continues transition from 0.5 → 0.9
- Current weather NOT updated yet

**CROSSED → SETTLED:**
- Player reaches 50% mark in new cell (transitionPercent ≥ 0.89)
- Updates current weather to cell's weather
- Clears target cell and target weather
- Returns to stable state

**APPROACHING → SETTLED (heading change):**
- Player changes heading by >45° while transitioning
- Resets transition target
- Returns to settled state
- Prevents "flapping" between multiple targets

## Heading-Based Targeting

The system uses player heading to determine which neighbor cell to transition towards, preventing "flapping" when moving diagonally.

### Heading Directions

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

### Direction Mapping

```typescript
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

### Anti-Flapping Example

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

## Usage

### Initialization

```typescript
import weatherManager from './client/managers/weather';

// Weather grid is automatically initialized
// Grid data is received from server via event

onNet('weather:init', (gridData) => {
  weatherManager.init(gridData);
});
```

### Automatic Updates

The system automatically tracks weather transitions during gameplay:

```typescript
// Called each frame or on a timer
const coords = GetEntityCoords(PlayerPedId(), false);
const heading = GetEntityHeading(PlayerPedId());

weatherManager.calculateIfWeatherShouldTransition(
  coords[0],  // worldX
  coords[1],  // worldY
  heading     // player heading in degrees
);
```

### Weather Application

When transitions occur, the system calls:

```typescript
SetCurrWeatherState(
  currentWeatherHash,   // Weather transitioning FROM
  targetWeatherHash,    // Weather transitioning TO
  transitionPercent,    // 0.0 - 0.9
  true                  // Enable transition
);
```

## Testing

### Test Pattern Command

Generate a checkerboard pattern for visual testing:

```
/weather:test
```

This creates an alternating pattern of SUNNY and RAIN cells:

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

**Testing procedure:**
1. Run `/weather:test` to generate the pattern
2. Move between cells in different directions
3. Observe smooth weather transitions
4. Verify transitions complete to 0.9
5. Check logs for transition phase progression

### Expected Behavior

When moving from SUNNY to RAIN:

```
Phase 1 (Approaching):
[Weather] SUNNY -> RAIN (0.00%) phase: approaching
[Weather] SUNNY -> RAIN (10.25%) phase: approaching
[Weather] SUNNY -> RAIN (25.50%) phase: approaching
[Weather] SUNNY -> RAIN (45.75%) phase: approaching
[Weather] SUNNY -> RAIN (50.00%) phase: approaching  ← Edge crossed

Phase 2 (Crossed):
[Weather] SUNNY -> RAIN (50.00%) phase: crossed
[Weather] SUNNY -> RAIN (62.50%) phase: crossed
[Weather] SUNNY -> RAIN (75.00%) phase: crossed
[Weather] SUNNY -> RAIN (87.50%) phase: crossed
[Weather] SUNNY -> RAIN (89.00%) phase: crossed      ← Reached 50% mark
[Transition] Settled at 50% mark in cell (X, Y). Weather: RAIN

Phase 3 (Settled):
No transitions, stable RAIN weather
```

## Debug Commands

### `/weather:check`

Display current weather state information:

```
========================================
WEATHER INFORMATION
========================================
Position: 1234.5, 5678.9, 123.4
Heading: 315.2°
Current Cell: (12, 34)
Current Biome: Heartlands
Current Weather: SUNNY
Target Weather: RAIN
Target Cell: (13, 35)
Transition Phase: approaching
Transition Percent: 35.67%
========================================
```

### `/weather:test`

Generate alternating SUNNY/RAIN test pattern:

```
========================================
TEST PATTERN GENERATED
========================================
Weather grid set to alternating SUNNY/RAIN pattern
SUNNY cells: even (x+y) positions
RAIN cells: odd (x+y) positions
Move between cells to test transitions!
========================================
```

## Weather Variants

The system supports weather variants that provide visual variety within the same weather type. **Variants are biome-specific** to create authentic regional atmosphere.

### Biome-Specific Variants

Each biome has its own set of appropriate weather variants:

**Snowy Mountains (GRIZZLIES):**
- `BLIZZARD_winter2`, `GROUNDBLIZZARD_winter2`
- `SNOW_Odriscolls1`, `SNOW_Pearson1`
- `SNOWLIGHT_Odriscolls1`, `SNOWLIGHT_Pearson1`
- `WHITEOUT_winter1`

**Swampy Regions (BAYOU, LEMOYNE):**
- `FOG_guama`, `MISTY_guama`, `MISTY_braithwaites3`
- `SHOWER_guama`, `HIGHPRESSURE_guama`
- `HURRICANE_guama` (BAYOU only)

**Plains (HEARTLANDS, GREAT_PLAINS):**
- `MISTY_finale1`, `MISTY_MP_intro`
- `THUNDERSTORM_nativeSon3`
- `OVERCASTDARK_native3`, `OVERCASTDARK_STD1`

**Forests (TALL_TREES, ROANOKE, CUMBERLAND):**
- `MISTY_train1`, `MISTY_MP_Pred`
- `DRIZZLE_finale1`
- `OVERCASTDARK_Gang2`

**Desert (NEW_AUSTIN, RIO_BRAVO):**
- `HIGHPRESSURE_guama`
- `Sunny_odriscols4`

The system automatically selects biome-appropriate variants when generating or evolving weather. If no biome-specific variant exists, it falls back to the general variant pool.

## Implementation Details

### Per-Player State Tracking

The system tracks weather state for each player independently:

```typescript
interface PlayerWeatherState {
  currentCell: { x: number; y: number };
  previousCell: { x: number; y: number } | null;
  targetNeighborCell: { x: number; y: number } | null;
  currentWeather: WeatherType;
  targetWeather: WeatherType | null;
  transitionPercent: number;
  biome: BiomeType;
  lastHeading: number;
  transitionPhase: 'approaching' | 'crossed' | 'settled';
}
```

### Heading Change Detection

Significant heading changes (>45°) during transitions trigger a reset:

```typescript
const headingChanged = Math.abs(
  normalizeHeadingDiff(heading - playerState.lastHeading)
) > HEADING_CHANGE_THRESHOLD;

if (headingChanged && playerState.transitionPhase !== 'settled') {
  resetTransitionTarget(playerState);
}
```

This prevents transitions from continuing when the player changes direction mid-transition.

### Throttled Logging

Debug logs are throttled to 500ms intervals to prevent console spam:

```typescript
const now = GetGameTimer();
if (!this.lastLogTime || now - this.lastLogTime > 500) {
  console.log(transitionInfo);
  this.lastLogTime = now;
}
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Weather System                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────┐      ┌───────────────────┐  │
│  │  BiomeWeatherGrid│      │ ClientWeatherMgr  │  │
│  │                  │      │                   │  │
│  │ - Grid cells     │◄────►│ - Per-player     │  │
│  │ - Coordinates    │      │   state tracking │  │
│  │ - Bounds calc    │      │ - Transition     │  │
│  │                  │      │   calculation    │  │
│  └──────────────────┘      │ - State machine  │  │
│                            │ - Weather apply  │  │
│                            └────────┬──────────┘  │
│                                     │             │
│                                     ↓             │
│                         ┌────────────────────┐    │
│                         │ SetCurrWeatherState│    │
│                         │   (Native API)     │    │
│                         └────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Performance Considerations

- **Update frequency**: Called each frame or on a timer (recommend 100-500ms)
- **Distance calculations**: Square root operations, relatively lightweight
- **State updates**: Only when weather or transition percent changes
- **Logging**: Throttled to 500ms to reduce overhead
- **Grid lookups**: O(1) array access with bounds clamping

## Troubleshooting

### Transitions stop at 0.5

**Cause**: Early exit when current and target weather are the same
**Fix**: Removed weather equality check - transitions now complete even for matching weather types

### Weather "flapping" on diagonal movement

**Cause**: System targeting intermediate cells instead of diagonal target
**Fix**: Heading-based targeting locks onto the cell you're moving towards

### Transitions don't start until at edge

**Cause**: Transition zone calculation using true cell center
**Fix**: Transition zone now starts at 50% of distance from edge to center

### State machine stuck in transition phase

**Cause**: currentWeather updated too early when crossing cells
**Fix**: Weather only updates when reaching 'settled' phase at 0.9

## Future Enhancements

- [ ] Dynamic transition speed based on movement velocity
- [ ] Smooth heading interpolation to reduce reset frequency
- [ ] Biome-specific transition curves (faster in some biomes, slower in others)
- [ ] Weather intensity gradients (light rain → heavy rain)
- [ ] Multi-layer weather (ground fog + high clouds)
- [ ] Forecasting, time based generation of evolving weather 
