/**
 * Weather System Manager
 * Self-contained weather grid, biome, and evolution logic for the socket server.
 * Combined from weather resource shared modules (biome, grid, types, weather).
 */

// ============================================================================
// Types
// ============================================================================

export interface GridCell {
  x: number;
  y: number;
  weather: WeatherType;
  variant: string | null;
  biome: BiomeType;
  rainRate: number; // 0.0 - 1.0, only applies to RAIN, SHOWER, DRIZZLE, THUNDERSTORM
}

export interface WeatherTransition {
  currentWeather: WeatherType;
  neighborWeather: WeatherType | null;
  currentVariant: string | null;
  neighborVariant: string | null;
  transitionPercent: number;
  shouldApply: boolean;
}

export interface CellBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
}

export interface GridDimensions {
  totalWidth: number;
  totalHeight: number;
  cellWidth: number;
  cellHeight: number;
}

// ============================================================================
// Enums
// ============================================================================

export enum BiomeType {
  GRIZZLIES = 'GRIZZLIES', // Snowy mountains (north)
  TALL_TREES = 'TALL_TREES', // Dense forests
  BIG_VALLEY = 'BIG_VALLEY', // Valley region
  HEARTLANDS = 'HEARTLANDS', // Central plains
  GREAT_PLAINS = 'GREAT_PLAINS', // Western plains
  BAYOU = 'BAYOU', // Swampy southeast
  LEMOYNE = 'LEMOYNE', // Southern region
  NEW_AUSTIN = 'NEW_AUSTIN', // Desert (southwest)
  RIO_BRAVO = 'RIO_BRAVO', // Arid desert
  ROANOKE = 'ROANOKE', // Eastern forests
  CUMBERLAND = 'CUMBERLAND', // Forest region
  SCARLETT = 'SCARLETT', // Meadows
}

export enum WeatherType {
  BLIZZARD = 'BLIZZARD',
  CLOUDS = 'CLOUDS',
  DRIZZLE = 'DRIZZLE',
  FOG = 'FOG',
  GROUNDBLIZZARD = 'GROUNDBLIZZARD',
  HAIL = 'HAIL',
  HIGHPRESSURE = 'HIGHPRESSURE',
  HURRICANE = 'HURRICANE',
  MISTY = 'MISTY',
  OVERCAST = 'OVERCAST',
  OVERCASTDARK = 'OVERCASTDARK',
  RAIN = 'RAIN',
  SANDSTORM = 'SANDSTORM',
  SHOWER = 'SHOWER',
  SLEET = 'SLEET',
  SNOW = 'SNOW',
  SNOWLIGHT = 'SNOWLIGHT',
  SUNNY = 'SUNNY',
  THUNDER = 'THUNDER',
  THUNDERSTORM = 'THUNDERSTORM',
  WHITEOUT = 'WHITEOUT',
}

// ============================================================================
// Weather Data
// ============================================================================

const WeatherVariants: Record<WeatherType, string[]> = {
  [WeatherType.BLIZZARD]: ['BLIZZARD_winter2'],
  [WeatherType.CLOUDS]: ['CLOUDS_mudtown3B'],
  [WeatherType.DRIZZLE]: ['DRIZZLE_finale1', 'DRIZZLE_finale1B'],
  [WeatherType.FOG]: ['FOG_guama', 'Fog_MP_Pred'],
  [WeatherType.GROUNDBLIZZARD]: ['GROUNDBLIZZARD_odriscols', 'GROUNDBLIZZARD_winter2'],
  [WeatherType.HAIL]: [],
  [WeatherType.HIGHPRESSURE]: ['HIGHPRESSURE_guama'],
  [WeatherType.HURRICANE]: ['HURRICANE_guama'],
  [WeatherType.MISTY]: [
    'MISTY_braithwaites3',
    'MISTY_finale1',
    'MISTY_finale1B',
    'MISTY_finale2',
    'MISTY_guama',
    'MISTY_MP_intro',
    'MISTY_MP_Pred',
    'MISTY_train1',
  ],
  [WeatherType.OVERCAST]: [],
  [WeatherType.OVERCASTDARK]: [
    'OVERCASTDARK_finale2',
    'OVERCASTDARK_Gang2',
    'OVERCASTDARK_native3',
    'OVERCASTDARK_STD1',
  ],
  [WeatherType.RAIN]: [],
  [WeatherType.SANDSTORM]: [],
  [WeatherType.SLEET]: [],
  [WeatherType.SHOWER]: ['SHOWER_finale2', 'SHOWER_guama', 'shower_MP_Pred'],
  [WeatherType.SNOW]: ['SNOW_Odriscolls1', 'SNOW_Pearson1'],
  [WeatherType.SNOWLIGHT]: ['SNOWLIGHT_finale2', 'SNOWLIGHT_Odriscolls1', 'SNOWLIGHT_Pearson1'],
  [WeatherType.SUNNY]: ['Sunny_odriscols4'],
  [WeatherType.THUNDER]: [],
  [WeatherType.THUNDERSTORM]: ['THUNDERSTORM_MP_Pred', 'THUNDERSTORM_nativeSon3'],
  [WeatherType.WHITEOUT]: ['WHITEOUT_winter1'],
};

const BiomeWeatherVariants: Record<BiomeType, Partial<Record<WeatherType, string[]>>> = {
  [BiomeType.GRIZZLIES]: {
    [WeatherType.BLIZZARD]: ['BLIZZARD_winter2'],
    [WeatherType.GROUNDBLIZZARD]: ['GROUNDBLIZZARD_odriscols', 'GROUNDBLIZZARD_winter2'],
    [WeatherType.SNOW]: ['SNOW_Odriscolls1', 'SNOW_Pearson1'],
    [WeatherType.SNOWLIGHT]: ['SNOWLIGHT_Odriscolls1', 'SNOWLIGHT_Pearson1'],
    [WeatherType.WHITEOUT]: ['WHITEOUT_winter1'],
    [WeatherType.MISTY]: ['MISTY_finale2', 'MISTY_MP_Pred'],
    [WeatherType.FOG]: ['Fog_MP_Pred'],
  },
  [BiomeType.TALL_TREES]: {
    [WeatherType.MISTY]: ['MISTY_train1', 'MISTY_MP_Pred'],
    [WeatherType.FOG]: ['Fog_MP_Pred'],
    [WeatherType.DRIZZLE]: ['DRIZZLE_finale1'],
    [WeatherType.OVERCASTDARK]: ['OVERCASTDARK_Gang2'],
  },
  [BiomeType.BIG_VALLEY]: {
    [WeatherType.SNOWLIGHT]: ['SNOWLIGHT_finale2'],
    [WeatherType.MISTY]: ['MISTY_finale1', 'MISTY_finale2'],
    [WeatherType.FOG]: ['Fog_MP_Pred'],
    [WeatherType.DRIZZLE]: ['DRIZZLE_finale1B'],
  },
  [BiomeType.HEARTLANDS]: {
    [WeatherType.SUNNY]: ['Sunny_odriscols4'],
    [WeatherType.MISTY]: ['MISTY_finale1', 'MISTY_MP_intro'],
    [WeatherType.DRIZZLE]: ['DRIZZLE_finale1'],
    [WeatherType.THUNDERSTORM]: ['THUNDERSTORM_nativeSon3'],
    [WeatherType.OVERCASTDARK]: ['OVERCASTDARK_native3', 'OVERCASTDARK_STD1'],
  },
  [BiomeType.GREAT_PLAINS]: {
    [WeatherType.SUNNY]: ['Sunny_odriscols4'],
    [WeatherType.MISTY]: ['MISTY_finale1', 'MISTY_MP_intro'],
    [WeatherType.DRIZZLE]: ['DRIZZLE_finale1B'],
    [WeatherType.THUNDERSTORM]: ['THUNDERSTORM_nativeSon3'],
  },
  [BiomeType.BAYOU]: {
    [WeatherType.FOG]: ['FOG_guama'],
    [WeatherType.MISTY]: ['MISTY_guama', 'MISTY_braithwaites3'],
    [WeatherType.SHOWER]: ['SHOWER_guama'],
    [WeatherType.HIGHPRESSURE]: ['HIGHPRESSURE_guama'],
    [WeatherType.HURRICANE]: ['HURRICANE_guama'],
    [WeatherType.DRIZZLE]: ['DRIZZLE_finale1'],
  },
  [BiomeType.LEMOYNE]: {
    [WeatherType.FOG]: ['FOG_guama'],
    [WeatherType.MISTY]: ['MISTY_guama', 'MISTY_braithwaites3'],
    [WeatherType.SHOWER]: ['SHOWER_guama', 'shower_MP_Pred'],
    [WeatherType.HIGHPRESSURE]: ['HIGHPRESSURE_guama'],
    [WeatherType.DRIZZLE]: ['DRIZZLE_finale1'],
    [WeatherType.THUNDERSTORM]: ['THUNDERSTORM_MP_Pred'],
  },
  [BiomeType.NEW_AUSTIN]: {
    [WeatherType.HIGHPRESSURE]: ['HIGHPRESSURE_guama'],
    [WeatherType.SUNNY]: ['Sunny_odriscols4'],
  },
  [BiomeType.RIO_BRAVO]: {
    [WeatherType.HIGHPRESSURE]: ['HIGHPRESSURE_guama'],
    [WeatherType.SUNNY]: ['Sunny_odriscols4'],
  },
  [BiomeType.ROANOKE]: {
    [WeatherType.FOG]: ['Fog_MP_Pred'],
    [WeatherType.MISTY]: ['MISTY_train1', 'MISTY_MP_Pred', 'MISTY_finale2'],
    [WeatherType.DRIZZLE]: ['DRIZZLE_finale1'],
    [WeatherType.OVERCASTDARK]: ['OVERCASTDARK_Gang2', 'OVERCASTDARK_finale2'],
  },
  [BiomeType.CUMBERLAND]: {
    [WeatherType.MISTY]: ['MISTY_finale1', 'MISTY_MP_Pred'],
    [WeatherType.FOG]: ['Fog_MP_Pred'],
    [WeatherType.DRIZZLE]: ['DRIZZLE_finale1B'],
    [WeatherType.SUNNY]: ['Sunny_odriscols4'],
  },
  [BiomeType.SCARLETT]: {
    [WeatherType.SUNNY]: ['Sunny_odriscols4'],
    [WeatherType.MISTY]: ['MISTY_braithwaites3', 'MISTY_finale1'],
    [WeatherType.DRIZZLE]: ['DRIZZLE_finale1'],
    [WeatherType.SHOWER]: ['SHOWER_finale2'],
  },
};

const BiomeNames: Record<BiomeType, string> = {
  [BiomeType.GRIZZLIES]: 'Grizzly Mountains',
  [BiomeType.TALL_TREES]: 'Tall Trees',
  [BiomeType.BIG_VALLEY]: 'Big Valley',
  [BiomeType.HEARTLANDS]: 'The Heartlands',
  [BiomeType.GREAT_PLAINS]: 'Great Plains',
  [BiomeType.BAYOU]: 'Bayou Nwa',
  [BiomeType.LEMOYNE]: 'Lemoyne',
  [BiomeType.NEW_AUSTIN]: 'New Austin',
  [BiomeType.RIO_BRAVO]: 'Rio Bravo',
  [BiomeType.ROANOKE]: 'Roanoke Ridge',
  [BiomeType.CUMBERLAND]: 'Cumberland Forest',
  [BiomeType.SCARLETT]: 'Scarlett Meadows',
};

const BIOME_WEATHER_RULES: Record<BiomeType, WeatherType[]> = {
  [BiomeType.GRIZZLIES]: [
    WeatherType.SNOW,
    WeatherType.BLIZZARD,
    WeatherType.GROUNDBLIZZARD,
    WeatherType.SNOWLIGHT,
    WeatherType.OVERCAST,
    WeatherType.CLOUDS,
    WeatherType.FOG,
    WeatherType.SUNNY,
    WeatherType.WHITEOUT,
    WeatherType.MISTY,
  ],
  [BiomeType.TALL_TREES]: [
    WeatherType.RAIN,
    WeatherType.DRIZZLE,
    WeatherType.OVERCAST,
    WeatherType.OVERCASTDARK,
    WeatherType.CLOUDS,
    WeatherType.FOG,
    WeatherType.MISTY,
  ],
  [BiomeType.BIG_VALLEY]: [
    WeatherType.SUNNY,
    WeatherType.CLOUDS,
    WeatherType.OVERCAST,
    WeatherType.RAIN,
    WeatherType.DRIZZLE,
    WeatherType.FOG,
    WeatherType.SNOWLIGHT,
    WeatherType.MISTY,
  ],
  [BiomeType.HEARTLANDS]: [
    WeatherType.SUNNY,
    WeatherType.HIGHPRESSURE,
    WeatherType.CLOUDS,
    WeatherType.OVERCAST,
    WeatherType.OVERCASTDARK,
    WeatherType.RAIN,
    WeatherType.DRIZZLE,
    WeatherType.THUNDER,
    WeatherType.MISTY,
    WeatherType.THUNDERSTORM,
  ],
  [BiomeType.GREAT_PLAINS]: [
    WeatherType.SUNNY,
    WeatherType.HIGHPRESSURE,
    WeatherType.CLOUDS,
    WeatherType.OVERCAST,
    WeatherType.RAIN,
    WeatherType.DRIZZLE,
    WeatherType.MISTY,
    WeatherType.THUNDERSTORM,
  ],
  [BiomeType.BAYOU]: [
    WeatherType.FOG,
    WeatherType.OVERCAST,
    WeatherType.DRIZZLE,
    WeatherType.RAIN,
    WeatherType.THUNDER,
    WeatherType.CLOUDS,
    WeatherType.SHOWER,
    WeatherType.MISTY,
    WeatherType.HIGHPRESSURE,
    WeatherType.HURRICANE,
  ],
  [BiomeType.LEMOYNE]: [
    WeatherType.SUNNY,
    WeatherType.CLOUDS,
    WeatherType.OVERCAST,
    WeatherType.RAIN,
    WeatherType.DRIZZLE,
    WeatherType.THUNDER,
    WeatherType.THUNDERSTORM,
    WeatherType.FOG,
    WeatherType.MISTY,
    WeatherType.SHOWER,
    WeatherType.HIGHPRESSURE,
  ],
  [BiomeType.NEW_AUSTIN]: [
    WeatherType.SUNNY,
    WeatherType.HIGHPRESSURE,
    WeatherType.CLOUDS,
    WeatherType.OVERCAST,
  ],
  [BiomeType.RIO_BRAVO]: [WeatherType.SUNNY, WeatherType.HIGHPRESSURE, WeatherType.CLOUDS],
  [BiomeType.ROANOKE]: [
    WeatherType.FOG,
    WeatherType.OVERCAST,
    WeatherType.OVERCASTDARK,
    WeatherType.RAIN,
    WeatherType.DRIZZLE,
    WeatherType.CLOUDS,
    WeatherType.SUNNY,
    WeatherType.MISTY,
  ],
  [BiomeType.CUMBERLAND]: [
    WeatherType.SUNNY,
    WeatherType.CLOUDS,
    WeatherType.OVERCAST,
    WeatherType.RAIN,
    WeatherType.DRIZZLE,
    WeatherType.FOG,
    WeatherType.MISTY,
  ],
  [BiomeType.SCARLETT]: [
    WeatherType.SUNNY,
    WeatherType.CLOUDS,
    WeatherType.OVERCAST,
    WeatherType.RAIN,
    WeatherType.DRIZZLE,
    WeatherType.MISTY,
    WeatherType.SHOWER,
  ],
};

// Weather compatibility — directed graph of allowed transitions.
// Chains: WHITEOUT <-> BLIZZARD <-> GROUNDBLIZZARD
//         SNOW <-> SNOWLIGHT <-> HAIL <-> SLEET
//         HURRICANE <-> THUNDER <-> THUNDERSTORM
//         RAIN <-> SHOWER <-> DRIZZLE <-> MISTY <-> FOG
//         OVERCAST | OVERCASTDARK
//         CLOUDS (hub)
//         SUNNY <-> HIGHPRESSURE
//         SANDSTORM
const WEATHER_COMPATIBILITY: Record<WeatherType, WeatherType[]> = {
  // Extreme cold chain
  [WeatherType.WHITEOUT]: [WeatherType.BLIZZARD, WeatherType.SNOW],
  [WeatherType.BLIZZARD]: [WeatherType.WHITEOUT, WeatherType.SNOW, WeatherType.GROUNDBLIZZARD, WeatherType.OVERCAST],
  [WeatherType.GROUNDBLIZZARD]: [WeatherType.BLIZZARD],

  // Cold/snow chain
  [WeatherType.SNOW]: [WeatherType.SNOWLIGHT, WeatherType.OVERCAST, WeatherType.BLIZZARD, WeatherType.WHITEOUT],
  [WeatherType.SNOWLIGHT]: [WeatherType.SNOW, WeatherType.HAIL, WeatherType.CLOUDS, WeatherType.OVERCAST],
  [WeatherType.HAIL]: [WeatherType.SLEET, WeatherType.SNOWLIGHT, WeatherType.SNOW],
  [WeatherType.SLEET]: [WeatherType.HAIL, WeatherType.SNOW, WeatherType.RAIN, WeatherType.OVERCAST],

  // Storm chain
  [WeatherType.HURRICANE]: [WeatherType.THUNDERSTORM, WeatherType.THUNDER, WeatherType.RAIN],
  [WeatherType.THUNDER]: [WeatherType.THUNDERSTORM, WeatherType.HURRICANE, WeatherType.RAIN, WeatherType.OVERCAST],
  [WeatherType.THUNDERSTORM]: [WeatherType.HURRICANE, WeatherType.THUNDER, WeatherType.RAIN, WeatherType.OVERCAST],

  // Wet chain
  [WeatherType.RAIN]: [WeatherType.SHOWER, WeatherType.DRIZZLE, WeatherType.OVERCAST, WeatherType.THUNDER],
  [WeatherType.SHOWER]: [WeatherType.RAIN, WeatherType.DRIZZLE],
  [WeatherType.DRIZZLE]: [WeatherType.SHOWER, WeatherType.MISTY, WeatherType.CLOUDS, WeatherType.OVERCAST, WeatherType.RAIN],
  [WeatherType.MISTY]: [WeatherType.DRIZZLE, WeatherType.FOG],
  [WeatherType.FOG]: [WeatherType.MISTY, WeatherType.OVERCAST, WeatherType.CLOUDS],

  // Overcast
  [WeatherType.OVERCAST]: [WeatherType.OVERCASTDARK, WeatherType.CLOUDS, WeatherType.DRIZZLE, WeatherType.RAIN, WeatherType.FOG],
  [WeatherType.OVERCASTDARK]: [WeatherType.OVERCAST, WeatherType.CLOUDS],

  // Hub
  [WeatherType.CLOUDS]: [WeatherType.SUNNY, WeatherType.OVERCAST, WeatherType.OVERCASTDARK, WeatherType.HIGHPRESSURE, WeatherType.DRIZZLE, WeatherType.SNOWLIGHT, WeatherType.FOG],

  // Clear chain
  [WeatherType.SUNNY]: [WeatherType.HIGHPRESSURE, WeatherType.CLOUDS],
  [WeatherType.HIGHPRESSURE]: [WeatherType.SUNNY, WeatherType.CLOUDS, WeatherType.SANDSTORM],

  // Desert
  [WeatherType.SANDSTORM]: [WeatherType.HIGHPRESSURE, WeatherType.SUNNY],
};

// ============================================================================
// Biome Boundaries
// ============================================================================

interface BiomeBoundary {
  biome: BiomeType;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  priority: number;
}

const BIOME_BOUNDARIES: BiomeBoundary[] = [
  { biome: BiomeType.GRIZZLIES, minX: -2100, maxX: 1500, minY: 1500, maxY: 4608, priority: 10 },
  { biome: BiomeType.RIO_BRAVO, minX: -5632, maxX: -3500, minY: -5760, maxY: -3500, priority: 9 },
  { biome: BiomeType.NEW_AUSTIN, minX: -5632, maxX: -2000, minY: -3500, maxY: -1000, priority: 8 },
  { biome: BiomeType.BAYOU, minX: 1800, maxX: 6144, minY: -5760, maxY: -800, priority: 9 },
  { biome: BiomeType.LEMOYNE, minX: 600, maxX: 2400, minY: -2500, maxY: -200, priority: 7 },
  { biome: BiomeType.ROANOKE, minX: 1500, maxX: 6144, minY: 800, maxY: 4608, priority: 8 },
  { biome: BiomeType.TALL_TREES, minX: -2800, maxX: -1400, minY: -800, maxY: 1200, priority: 7 },
  { biome: BiomeType.BIG_VALLEY, minX: -2200, maxX: -800, minY: 200, maxY: 1600, priority: 6 },
  { biome: BiomeType.CUMBERLAND, minX: 400, maxX: 1800, minY: 600, maxY: 1800, priority: 6 },
  { biome: BiomeType.SCARLETT, minX: 800, maxX: 2200, minY: -1500, maxY: 200, priority: 5 },
  { biome: BiomeType.GREAT_PLAINS, minX: -2000, maxX: -400, minY: -2000, maxY: 200, priority: 5 },
  { biome: BiomeType.HEARTLANDS, minX: -800, maxX: 1500, minY: -1000, maxY: 1000, priority: 4 },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Weather types that support rain
 */
const RAIN_WEATHER_TYPES = [
  WeatherType.RAIN,
  WeatherType.SHOWER,
  WeatherType.DRIZZLE,
  WeatherType.THUNDERSTORM,
] as const;

/**
 * Type guard to check if a string is a valid WeatherType
 */
export function isWeatherType(value: string): value is WeatherType {
  return Object.values(WeatherType).includes(value as WeatherType);
}

/**
 * Type guard to check if a string is a valid BiomeType
 */
export function isBiomeType(value: string): value is BiomeType {
  return Object.values(BiomeType).includes(value as BiomeType);
}

/**
 * Safely convert string to WeatherType, returns null if invalid
 */
export function toWeatherType(value: string): WeatherType | null {
  return isWeatherType(value) ? (value as WeatherType) : null;
}

/**
 * Safely convert string to BiomeType, returns null if invalid
 */
export function toBiomeType(value: string): BiomeType | null {
  return isBiomeType(value) ? (value as BiomeType) : null;
}

/**
 * Get rain rate for a weather type
 */
export function getRainRate(weatherType: WeatherType, random: () => number = Math.random): number {
  switch (weatherType) {
    case WeatherType.DRIZZLE:
      return 0.2 + random() * 0.2;
    case WeatherType.SHOWER:
      return 0.4 + random() * 0.3;
    case WeatherType.RAIN:
      return 0.6 + random() * 0.3;
    case WeatherType.THUNDERSTORM:
      return 0.8 + random() * 0.2;
    default:
      return 0.0;
  }
}

/**
 * Check if a weather type supports rain
 */
export function isRainWeather(weatherType: WeatherType): boolean {
  return (RAIN_WEATHER_TYPES as readonly WeatherType[]).includes(weatherType);
}

/**
 * Find the shortest transition path between two weather types using BFS.
 * Uses WEATHER_COMPATIBILITY as a directed graph.
 * Returns the path as an array of WeatherTypes (including start and end),
 * or null if no path exists.
 */
export function findWeatherTransitionPath(from: WeatherType, to: WeatherType): WeatherType[] | null {
  if (from === to) return [from];

  const visited = new Set<WeatherType>([from]);
  const queue: Array<{ type: WeatherType; path: WeatherType[] }> = [{ type: from, path: [from] }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = WEATHER_COMPATIBILITY[current.type] || [];

    for (const neighbor of neighbors) {
      if (neighbor === current.type) continue; // skip self-references
      if (neighbor === to) return [...current.path, neighbor];

      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ type: neighbor, path: [...current.path, neighbor] });
      }
    }
  }

  return null;
}

// ============================================================================
// BiomeManager
// ============================================================================

export class BiomeManager {
  private biomeCache: Map<string, BiomeType> = new Map();

  /**
   * Get the biome at a specific world coordinate
   */
  public getBiomeAtPosition(worldX: number, worldY: number): BiomeType {
    const cacheKey = `${Math.floor(worldX / 100)},${Math.floor(worldY / 100)}`;

    if (this.biomeCache.has(cacheKey)) {
      return this.biomeCache.get(cacheKey)!;
    }

    const matchingBiomes = BIOME_BOUNDARIES.filter(
      (boundary) =>
        worldX >= boundary.minX && worldX <= boundary.maxX && worldY >= boundary.minY && worldY <= boundary.maxY,
    );

    let selectedBiome = BiomeType.HEARTLANDS;

    if (matchingBiomes.length > 0) {
      matchingBiomes.sort((a, b) => b.priority - a.priority);
      selectedBiome = matchingBiomes[0].biome;
    }

    this.biomeCache.set(cacheKey, selectedBiome);
    return selectedBiome;
  }

  /**
   * Check if a weather type is allowed in a specific biome
   */
  public isWeatherAllowedInBiome(weather: WeatherType, biome: BiomeType): boolean {
    const allowedWeathers = BIOME_WEATHER_RULES[biome];
    return allowedWeathers.includes(weather);
  }

  /**
   * Get all weather types allowed in a biome
   */
  public getAllowedWeatherForBiome(biome: BiomeType): WeatherType[] {
    return [...BIOME_WEATHER_RULES[biome]];
  }

  /**
   * Get compatible weather types that are valid in a specific biome
   */
  public getCompatibleWeatherInBiome(currentWeather: WeatherType, biome: BiomeType): WeatherType[] {
    const compatible = WEATHER_COMPATIBILITY[currentWeather];
    const allowed = BIOME_WEATHER_RULES[biome];
    return compatible.filter((w) => allowed.includes(w));
  }

  /**
   * Find the nearest allowed weather type for a biome
   */
  public findNearestAllowedWeather(currentWeather: WeatherType, targetBiome: BiomeType): WeatherType {
    if (this.isWeatherAllowedInBiome(currentWeather, targetBiome)) {
      return currentWeather;
    }

    const compatible = this.getCompatibleWeatherInBiome(currentWeather, targetBiome);
    if (compatible.length > 0) {
      return compatible[0];
    }

    const allowed = BIOME_WEATHER_RULES[targetBiome];
    if (allowed.includes(WeatherType.CLOUDS)) return WeatherType.CLOUDS;
    if (allowed.includes(WeatherType.OVERCAST)) return WeatherType.OVERCAST;
    return allowed[0];
  }

  /**
   * Get biome transition zones (where two biomes meet)
   */
  public getNearbyBiomes(worldX: number, worldY: number, radius: number = 500): BiomeType[] {
    const biomes = new Set<BiomeType>();
    const samples = 8;

    for (let i = 0; i < samples; i++) {
      const angle = (i / samples) * Math.PI * 2;
      const sampleX = worldX + Math.cos(angle) * radius;
      const sampleY = worldY + Math.sin(angle) * radius;
      biomes.add(this.getBiomeAtPosition(sampleX, sampleY));
    }

    return Array.from(biomes);
  }

  /**
   * Check if a position is in a biome transition zone
   */
  public isInTransitionZone(worldX: number, worldY: number): boolean {
    const nearbyBiomes = this.getNearbyBiomes(worldX, worldY, 300);
    return nearbyBiomes.length > 1;
  }

  /**
   * Get a visual representation of biomes (for debugging/admin tools)
   */
  public getBiomeMap(gridWidth: number, gridHeight: number): BiomeType[][] {
    const MAP_MIN_X = -5632.0;
    const MAP_MAX_X = 6144.0;
    const MAP_MIN_Y = -5760.0;
    const MAP_MAX_Y = 4608.0;

    const biomeMap: BiomeType[][] = [];

    for (let y = 0; y < gridHeight; y++) {
      const row: BiomeType[] = [];
      for (let x = 0; x < gridWidth; x++) {
        const worldX = MAP_MIN_X + ((x + 0.5) / gridWidth) * (MAP_MAX_X - MAP_MIN_X);
        const worldY = MAP_MIN_Y + ((y + 0.5) / gridHeight) * (MAP_MAX_Y - MAP_MIN_Y);
        row.push(this.getBiomeAtPosition(worldX, worldY));
      }
      biomeMap.push(row);
    }

    return biomeMap;
  }

  /**
   * Print biome map for debugging
   */
  public printBiomeMap(gridWidth: number = 8, gridHeight: number = 8): void {
    const biomeMap = this.getBiomeMap(gridWidth, gridHeight);

    console.log('\n=== Biome Map ===');
    for (let y = 0; y < gridHeight; y++) {
      const row = biomeMap[y]
        .map((biome) => {
          const abbrev: Record<string, string> = {
            GRIZZLIES: 'GRIZ',
            TALL_TREES: 'TREE',
            BIG_VALLEY: 'BVAL',
            HEARTLANDS: 'HEAR',
            GREAT_PLAINS: 'PLNS',
            BAYOU: 'BAYO',
            LEMOYNE: 'LEMO',
            NEW_AUSTIN: 'NAUS',
            RIO_BRAVO: 'RBRA',
            ROANOKE: 'ROAN',
            CUMBERLAND: 'CUMB',
            SCARLETT: 'SCAR',
          };
          return (abbrev[biome] || biome.substring(0, 4)).padEnd(4);
        })
        .join(' | ');

      console.log(row);
      if (y < gridHeight - 1) {
        console.log('-'.repeat(row.length));
      }
    }
    console.log('=================\n');
  }

  /**
   * Clear the biome cache
   */
  public clearCache(): void {
    this.biomeCache.clear();
  }
}

// ============================================================================
// BiomeWeatherGrid
// ============================================================================

interface Neighbor {
  x: number;
  y: number;
  direction: string;
}

export class BiomeWeatherGrid {
  private grid: GridCell[][];
  private width: number;
  private height: number;
  private biomeManager: BiomeManager;
  private assignedCells: Set<string> = new Set();

  private readonly MAP_MIN_X = -5632.0;
  private readonly MAP_MAX_X = 6144.0;
  private readonly MAP_MIN_Y = -5760.0;
  private readonly MAP_MAX_Y = 4608.0;

  constructor(gridWidth: number = 8, gridHeight: number = 8) {
    this.width = gridWidth;
    this.height = gridHeight;
    this.biomeManager = new BiomeManager();
    this.grid = this.initializeGrid();
  }

  /**
   * Initialize the grid with biome information
   */
  private initializeGrid(): GridCell[][] {
    const grid: GridCell[][] = [];

    for (let y = 0; y < this.height; y++) {
      const row: GridCell[] = [];
      for (let x = 0; x < this.width; x++) {
        const { worldX, worldY } = this.gridToWorld(x, y);
        const biome = this.biomeManager.getBiomeAtPosition(worldX, worldY);
        row.push({
          x,
          y,
          weather: WeatherType.CLOUDS,
          variant: null,
          biome,
          rainRate: 0.0,
        });
      }
      grid.push(row);
    }

    return grid;
  }

  /**
   * Convert grid coordinates to world coordinates (center of cell)
   */
  public gridToWorld(gridX: number, gridY: number): { worldX: number; worldY: number } {
    const worldX = this.MAP_MIN_X + ((gridX + 0.5) / this.width) * (this.MAP_MAX_X - this.MAP_MIN_X);
    const worldY = this.MAP_MIN_Y + ((gridY + 0.5) / this.height) * (this.MAP_MAX_Y - this.MAP_MIN_Y);
    return { worldX, worldY };
  }

  /**
   * Convert world coordinates to grid coordinates
   */
  public worldToGrid(worldX: number, worldY: number): { x: number; y: number } {
    const gridX = Math.floor(
      ((worldX - this.MAP_MIN_X) / (this.MAP_MAX_X - this.MAP_MIN_X)) * this.width,
    );
    const gridY = Math.floor(
      ((worldY - this.MAP_MIN_Y) / (this.MAP_MAX_Y - this.MAP_MIN_Y)) * this.height,
    );

    return {
      x: Math.max(0, Math.min(this.width - 1, gridX)),
      y: Math.max(0, Math.min(this.height - 1, gridY)),
    };
  }

  /**
   * Get all neighbors of a grid cell
   */
  private getNeighbors(x: number, y: number): Neighbor[] {
    const neighbors: Neighbor[] = [];

    if (y > 0) neighbors.push({ x, y: y - 1, direction: 'N' });
    if (y < this.height - 1) neighbors.push({ x, y: y + 1, direction: 'S' });
    if (x > 0) neighbors.push({ x: x - 1, y, direction: 'W' });
    if (x < this.width - 1) neighbors.push({ x: x + 1, y, direction: 'E' });

    if (x > 0 && y > 0) neighbors.push({ x: x - 1, y: y - 1, direction: 'NW' });
    if (x < this.width - 1 && y > 0) neighbors.push({ x: x + 1, y: y - 1, direction: 'NE' });
    if (x > 0 && y < this.height - 1) neighbors.push({ x: x - 1, y: y + 1, direction: 'SW' });
    if (x < this.width - 1 && y < this.height - 1) neighbors.push({ x: x + 1, y: y + 1, direction: 'SE' });

    return neighbors;
  }

  /**
   * Check if a weather type is compatible with all neighbors AND valid for the biome
   */
  private isCompatibleWithNeighbors(x: number, y: number, weatherType: WeatherType): boolean {
    const cell = this.grid[y][x];

    if (!this.biomeManager.isWeatherAllowedInBiome(weatherType, cell.biome)) {
      return false;
    }

    const neighbors = this.getNeighbors(x, y);
    const compatibleWeathers = WEATHER_COMPATIBILITY[weatherType];

    for (const neighbor of neighbors) {
      const neighborCell = this.grid[neighbor.y][neighbor.x];
      if (!this.assignedCells.has(`${neighbor.x},${neighbor.y}`)) {
        continue;
      }

      const neighborWeather = neighborCell.weather;
      if (weatherType === neighborWeather) {
        return false;
      }

      if (compatibleWeathers.length === 0) {
        return false;
      }

      const neighborCompatible = WEATHER_COMPATIBILITY[neighborWeather];
      if (neighborCompatible.length === 0) {
        continue;
      }

      if (!compatibleWeathers.includes(neighborWeather)) {
        return false;
      }

      if (!neighborCompatible.includes(weatherType)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get compatible weather types for a grid position (respecting biome rules)
   */
  public getCompatibleWeatherTypes(x: number, y: number): WeatherType[] {
    const cell = this.grid[y][x];
    const neighbors = this.getNeighbors(x, y);

    let compatible = new Set<WeatherType>(BIOME_WEATHER_RULES[cell.biome]);

    if (neighbors.length === 0) {
      return Array.from(compatible);
    }

    for (const neighbor of neighbors) {
      const neighborCell = this.grid[neighbor.y][neighbor.x];
      if (!this.assignedCells.has(`${neighbor.x},${neighbor.y}`)) {
        continue;
      }

      const neighborWeather = neighborCell.weather;
      const neighborCompatible = WEATHER_COMPATIBILITY[neighborWeather];

      compatible = new Set(
        Array.from(compatible).filter((w) => {
          // Adjacent cells cannot share the same weather type
          if (w === neighborWeather) {
            return false;
          }
          // Exclude isolated types (empty compatibility) — they can't validly neighbour anything assigned
          if (WEATHER_COMPATIBILITY[w].length === 0) {
            return false;
          }
          // If the neighbor is an isolated type, only the same-type check matters
          if (neighborCompatible.length === 0) {
            return true;
          }
          const isInNeighborCompatible = neighborCompatible.includes(w);
          const neighborIsInWeatherCompatible = WEATHER_COMPATIBILITY[w].includes(neighborWeather);
          return isInNeighborCompatible && neighborIsInWeatherCompatible;
        }),
      );
    }

    return Array.from(compatible);
  }

  /**
   * Set weather for a specific grid cell
   */
  public setWeather(x: number, y: number, weatherType: WeatherType): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      console.error(`Grid position out of bounds: (${x}, ${y})`);
      return false;
    }

    const cell = this.grid[y][x];

    if (!this.biomeManager.isWeatherAllowedInBiome(weatherType, cell.biome)) {
      console.warn(`Weather type ${weatherType} is not allowed in biome ${cell.biome} at (${x}, ${y})`);
      return false;
    }

    if (!this.isCompatibleWithNeighbors(x, y, weatherType)) {
      console.warn(`Weather type ${weatherType} is not compatible with neighbors at (${x}, ${y})`);
      return false;
    }

    cell.weather = weatherType;
    cell.variant = this.getRandomVariant(weatherType, cell.biome);
    cell.rainRate = getRainRate(weatherType);
    this.assignedCells.add(`${x},${y}`);
    return true;
  }

  /**
   * Initialize the grid with biome-appropriate random weather
   */
  public generateBiomeAwareWeather(seed?: number): void {
    let random = seed !== undefined ? this.seededRandom(seed) : Math.random;
    this.assignedCells.clear();

    const biomeGroups = new Map<BiomeType, GridCell[]>();

    this.grid.forEach((row) => {
      row.forEach((cell) => {
        if (!biomeGroups.has(cell.biome)) {
          biomeGroups.set(cell.biome, []);
        }
        biomeGroups.get(cell.biome)!.push(cell);
      });
    });

    biomeGroups.forEach((cells, biome) => {
      const allowedWeathers = BIOME_WEATHER_RULES[biome];
      const seedCount = Math.max(1, Math.ceil(cells.length * 0.3));

      const shuffledCells = [...cells].sort(() => random() - 0.5);

      let placedSeeds = 0;
      let attemptIndex = 0;

      while (placedSeeds < seedCount && attemptIndex < shuffledCells.length) {
        const seedCell = shuffledCells[attemptIndex];
        attemptIndex++;

        const shuffledWeathers = [...allowedWeathers].sort(() => random() - 0.5);

        for (const weatherType of shuffledWeathers) {
          const originalWeather = seedCell.weather;
          seedCell.weather = weatherType;

          if (this.isCompatibleWithNeighbors(seedCell.x, seedCell.y, weatherType)) {
            seedCell.variant = this.getRandomVariant(weatherType, biome, random);
            seedCell.rainRate = getRainRate(weatherType, random);
            this.assignedCells.add(`${seedCell.x},${seedCell.y}`);
            placedSeeds++;
            break;
          } else {
            seedCell.weather = originalWeather;
          }
        }
      }
    });

    // Greedy WFC fill: assign one cell per iteration — always the frontier cell with
    // the fewest valid options (most constrained first). Because each assignment is
    // committed to assignedCells before the next candidate is selected, every
    // subsequent assignment sees the complete current constraint state. This eliminates
    // the race condition with previous BFS implementation where two adjacent cells could
    // be assigned in the same "wave" without seeing each other as constraints.
    while (true) {
      let bestX = -1, bestY = -1;
      let bestCompatible: WeatherType[] = [];
      let fewestOptions = Infinity;
      let hasFrontierCell = false;

      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          if (this.assignedCells.has(`${x},${y}`)) continue;
          if (!this.getNeighbors(x, y).some(n => this.assignedCells.has(`${n.x},${n.y}`))) continue;

          hasFrontierCell = true;
          const compatible = this.getCompatibleWeatherTypes(x, y);

          // Prefer cells with the fewest positive options (most constrained).
          // Cells with 0 options are tracked separately and only used as fallback.
          if (compatible.length > 0 && compatible.length < fewestOptions) {
            fewestOptions = compatible.length;
            bestX = x;
            bestY = y;
            bestCompatible = compatible;
          }
        }
      }

      if (!hasFrontierCell) break; // All cells assigned or unreachable

      // If every frontier cell has 0 strict options, pick the first one for fallback
      if (bestX === -1) {
        outer: for (let y = 0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
            if (this.assignedCells.has(`${x},${y}`)) continue;
            if (!this.getNeighbors(x, y).some(n => this.assignedCells.has(`${n.x},${n.y}`))) continue;
            bestX = x; bestY = y;
            break outer;
          }
        }
      }

      const key = `${bestX},${bestY}`;
      const cell = this.grid[bestY][bestX];
      let compatible = bestCompatible;

      // Fallback: strict WFC found no valid option — relax constraints progressively.
      // Rather than ignoring compatibility entirely, pick the type most compatible with
      // the most assigned neighbours (best partial match), which minimises violations.
      if (compatible.length === 0) {
        const assignedNeighbors = this.getNeighbors(bestX, bestY)
          .filter(n => this.assignedCells.has(`${n.x},${n.y}`));
        const assignedNeighborWeathers = assignedNeighbors.map(n => this.grid[n.y][n.x].weather);
        const assignedSet = new Set(assignedNeighborWeathers);

        const biomeWeathers = BIOME_WEATHER_RULES[cell.biome].filter(w => !assignedSet.has(w));

        // Score each candidate by how many assigned neighbours it is compatible with
        const scored = biomeWeathers.map(w => {
          const score = assignedNeighborWeathers.filter(nw =>
            WEATHER_COMPATIBILITY[w].includes(nw) && WEATHER_COMPATIBILITY[nw].includes(w)
          ).length;
          return { w, score };
        });

        if (scored.length > 0) {
          const maxScore = Math.max(...scored.map(s => s.score));
          compatible = scored.filter(s => s.score === maxScore).map(s => s.w);
        }

        // Deadlock: all biome types are blocked by same-type constraints.
        // Re-score including same-type types, picking whichever is most compatible
        // with non-same-type neighbours. This produces at most one same-type
        // violation rather than silently leaving the cell at the default CLOUDS.
        if (compatible.length === 0) {
          const allBiomeTypes = BIOME_WEATHER_RULES[cell.biome];
          const deadlockScored = allBiomeTypes.map(w => {
            const score = assignedNeighborWeathers.filter(nw =>
              nw !== w &&
              WEATHER_COMPATIBILITY[w].includes(nw) &&
              WEATHER_COMPATIBILITY[nw].includes(w)
            ).length;
            return { w, score };
          });
          const maxDeadlockScore = Math.max(...deadlockScored.map(s => s.score));
          compatible = deadlockScored.filter(s => s.score === maxDeadlockScore).map(s => s.w);
          if (compatible.length === 0) compatible = allBiomeTypes;
        }
      }

      if (compatible.length > 0) {
        // Safety net: remove any types that would duplicate an assigned neighbour's weather
        // (only if doing so still leaves valid candidates — avoids leaving cell unassigned).
        const assignedNeighbourSet = new Set<WeatherType>(
          this.getNeighbors(bestX, bestY)
            .filter(n => this.assignedCells.has(`${n.x},${n.y}`))
            .map(n => this.grid[n.y][n.x].weather)
        );
        const safeCompatible = compatible.filter(w => !assignedNeighbourSet.has(w));
        const finalCompatible = safeCompatible.length > 0 ? safeCompatible : compatible;

        const selectedWeather = this.selectDiverseWeather(bestX, bestY, finalCompatible, random);
        cell.weather = selectedWeather;
        cell.variant = this.getRandomVariant(selectedWeather, cell.biome, random);
        cell.rainRate = getRainRate(selectedWeather, random);
      }
      this.assignedCells.add(key); // Always mark assigned to advance the frontier
    }
  }

  /**
   * Select weather type with diversity constraints to prevent uniformity
   */
  private selectDiverseWeather(
    x: number,
    y: number,
    compatible: WeatherType[],
    random: () => number,
  ): WeatherType {
    if (compatible.length === 1) {
      return compatible[0];
    }

    const neighbors = this.getNeighbors(x, y);
    const neighborWeatherCounts = new Map<WeatherType, number>();

    for (const neighbor of neighbors) {
      const neighborWeather = this.grid[neighbor.y][neighbor.x].weather;
      neighborWeatherCounts.set(neighborWeather, (neighborWeatherCounts.get(neighborWeather) || 0) + 1);
    }

    const weights: number[] = compatible.map((weather) => {
      const neighborCount = neighborWeatherCounts.get(weather) || 0;
      return 1.0 / (1 + neighborCount * 3);
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = weights.map((w) => w / totalWeight);

    const randomValue = random();
    let cumulativeWeight = 0;

    for (let i = 0; i < compatible.length; i++) {
      cumulativeWeight += normalizedWeights[i];
      if (randomValue <= cumulativeWeight) {
        return compatible[i];
      }
    }

    return compatible[compatible.length - 1];
  }

  /**
   * Simple seeded random number generator
   */
  private seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  }

  /**
   * Get a random variant for a weather type in a specific biome
   */
  private getRandomVariant(
    weatherType: WeatherType,
    biome: BiomeType,
    random: () => number = Math.random,
  ): string | null {
    const biomeVariants = BiomeWeatherVariants[biome]?.[weatherType];

    if (biomeVariants && biomeVariants.length > 0) {
      return biomeVariants[Math.floor(random() * biomeVariants.length)];
    }

    const variants = WeatherVariants[weatherType];

    if (!variants || variants.length === 0) {
      return null;
    }

    return variants[Math.floor(random() * variants.length)];
  }

  /**
   * Get weather at world coordinates
   */
  public getWeatherAtPosition(worldX: number, worldY: number): WeatherType {
    const { x, y } = this.worldToGrid(worldX, worldY);
    return this.grid[y][x].weather;
  }

  /**
   * Get biome at world coordinates
   */
  public getBiomeAtPosition(worldX: number, worldY: number): BiomeType {
    const { x, y } = this.worldToGrid(worldX, worldY);
    return this.grid[y][x].biome;
  }

  /**
   * Get full cell info at world coordinates
   */
  public getCellAtPosition(worldX: number, worldY: number): GridCell {
    const { x, y } = this.worldToGrid(worldX, worldY);
    return this.grid[y][x];
  }

  /**
   * Evolve weather system (biome-aware)
   */
  public evolveWeather(): void {
    const changes: Array<{ x: number; y: number; weather: WeatherType; variant: string | null; rainRate: number }> = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (Math.random() < 0.1) {
          const compatible = this.getCompatibleWeatherTypes(x, y);

          if (compatible.length > 1) {
            const currentWeather = this.grid[y][x].weather;
            const otherWeathers = compatible.filter((w) => w !== currentWeather);

            if (otherWeathers.length > 0) {
              const newWeather = otherWeathers[Math.floor(Math.random() * otherWeathers.length)];
              const newVariant = this.getRandomVariant(newWeather, this.grid[y][x].biome);
              const newRainRate = getRainRate(newWeather);
              changes.push({ x, y, weather: newWeather, variant: newVariant, rainRate: newRainRate });
            }
          }
        }
      }
    }

    changes.forEach((change) => {
      this.grid[change.y][change.x].weather = change.weather;
      this.grid[change.y][change.x].variant = change.variant;
      this.grid[change.y][change.x].rainRate = change.rainRate;
    });

    console.log(`Weather evolved: ${changes.length} cells changed`);
  }

  /**
   * Override weather for all cells in a specific biome
   */
  public overrideBiomeWeather(biome: BiomeType, weatherType: WeatherType): number {
    let updatedCount = 0;

    if (!this.biomeManager.isWeatherAllowedInBiome(weatherType, biome)) {
      console.warn(`Weather type ${weatherType} is not allowed in biome ${biome}. Override aborted.`);
      return 0;
    }

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x];
        if (cell.biome === biome) {
          cell.weather = weatherType;
          cell.variant = this.getRandomVariant(weatherType, biome);
          cell.rainRate = getRainRate(weatherType);
          updatedCount++;
        }
      }
    }

    console.log(`Biome weather override: ${updatedCount} cells in ${biome} set to ${weatherType}`);
    return updatedCount;
  }

  /**
   * Print grid showing both weather and biome
   */
  public printGrid(): void {
    console.log('\n=== Weather Grid (with Biomes) ===');
    for (let y = 0; y < this.height; y++) {
      const row = this.grid[y]
        .map((cell) => {
          const weatherShort = cell.weather.substring(0, 4).padEnd(4);
          return weatherShort;
        })
        .join(' | ');

      console.log(row);
      if (y < this.height - 1) {
        console.log('-'.repeat(row.length));
      }
    }
    console.log('===================================\n');
  }

  /**
   * Print biome distribution
   */
  public printBiomeGrid(): void {
    console.log('\n=== Biome Grid ===');
    for (let y = 0; y < this.height; y++) {
      const row = this.grid[y]
        .map((cell) => {
          const biomeAbbrev: Record<string, string> = {
            GRIZZLIES: 'GRIZ',
            TALL_TREES: 'TREE',
            BIG_VALLEY: 'BVAL',
            HEARTLANDS: 'HEAR',
            GREAT_PLAINS: 'PLNS',
            BAYOU: 'BAYO',
            LEMOYNE: 'LEMO',
            NEW_AUSTIN: 'NAUS',
            RIO_BRAVO: 'RBRA',
            ROANOKE: 'ROAN',
            CUMBERLAND: 'CUMB',
            SCARLETT: 'SCAR',
          };
          return (biomeAbbrev[cell.biome] || cell.biome.substring(0, 4)).padEnd(4);
        })
        .join(' | ');

      console.log(row);
      if (y < this.height - 1) {
        console.log('-'.repeat(row.length));
      }
    }
    console.log('==================\n');
  }

  /**
   * Get the entire grid
   */
  public getGrid(): GridCell[][] {
    return this.grid;
  }

  /**
   * Set the entire grid
   */
  public setGrid(newGrid: GridCell[][]): void {
    if (newGrid.length !== this.height || newGrid.some((row) => row.length !== this.width)) {
      console.error('Invalid grid dimensions');
      console.error(`Expected ${this.width}x${this.height}, got ${newGrid[0].length}x${newGrid.length}`);
      return;
    }

    this.grid = newGrid;
  }

  /**
   * Get biome manager instance
   */
  public getBiomeManager(): BiomeManager {
    return this.biomeManager;
  }

  /**
   * Calculate the world coordinate bounds of a grid cell
   */
  public getCellBounds(gridX: number, gridY: number): CellBounds | null {
    if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
      console.error(`Grid position out of bounds: (${gridX}, ${gridY})`);
      return null;
    }

    const cellWidth = (this.MAP_MAX_X - this.MAP_MIN_X) / this.width;
    const cellHeight = (this.MAP_MAX_Y - this.MAP_MIN_Y) / this.height;

    const minX = this.MAP_MIN_X + gridX * cellWidth;
    const maxX = this.MAP_MIN_X + (gridX + 1) * cellWidth;
    const minY = this.MAP_MIN_Y + gridY * cellHeight;
    const maxY = this.MAP_MIN_Y + (gridY + 1) * cellHeight;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return { minX, maxX, minY, maxY, centerX, centerY };
  }

  /**
   * Get bounds for all grid cells
   */
  public getAllCellBounds(): Array<{
    gridX: number;
    gridY: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    centerX: number;
    centerY: number;
    weather: WeatherType;
    biome: BiomeType;
  }> {
    const allBounds = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const bounds = this.getCellBounds(x, y);
        if (bounds) {
          allBounds.push({
            gridX: x,
            gridY: y,
            ...bounds,
            weather: this.grid[y][x].weather,
            biome: this.grid[y][x].biome,
          });
        }
      }
    }

    return allBounds;
  }

  /**
   * Get the four corner coordinates of a grid cell
   */
  public getCellCorners(
    gridX: number,
    gridY: number,
  ): {
    nw: { x: number; y: number };
    ne: { x: number; y: number };
    se: { x: number; y: number };
    sw: { x: number; y: number };
  } | null {
    const bounds = this.getCellBounds(gridX, gridY);

    if (!bounds) {
      return null;
    }

    return {
      nw: { x: bounds.minX, y: bounds.maxY },
      ne: { x: bounds.maxX, y: bounds.maxY },
      se: { x: bounds.maxX, y: bounds.minY },
      sw: { x: bounds.minX, y: bounds.minY },
    };
  }

  /**
   * Get the grid cell dimensions in world units
   */
  public getCellDimensions(): GridDimensions {
    const cellWidth = (this.MAP_MAX_X - this.MAP_MIN_X) / this.width;
    const cellHeight = (this.MAP_MAX_Y - this.MAP_MIN_Y) / this.height;

    return {
      cellWidth,
      cellHeight,
      totalWidth: this.MAP_MAX_X - this.MAP_MIN_X,
      totalHeight: this.MAP_MAX_Y - this.MAP_MIN_Y,
    };
  }
}

// ============================================================================
// WeatherManager (top-level singleton)
// ============================================================================

class WeatherManager {
  static readonly instance: WeatherManager = new WeatherManager();

  private weatherGrid: BiomeWeatherGrid;
  private weatherFrozen: boolean = false;
  private globalWeatherOverride: WeatherType | null = null;

  constructor() {
    if (WeatherManager.instance) {
      throw new Error('Error: Instantiation failed: Use WeatherManager.instance instead of new.');
    }
    this.weatherGrid = new BiomeWeatherGrid();
  }

  /**
   * Initialize the weather system
   */
  public initialize(): void {
    console.log('Initializing RedM Biome-Aware Weather System...');
    this.weatherGrid.generateBiomeAwareWeather();

    console.log('\nBiome Distribution:');
    this.weatherGrid.printBiomeGrid();

    console.log('Initial Weather Pattern:');
    this.weatherGrid.printGrid();
  }

  /**
   * Get current grid state
   */
  public getGridState(): GridCell[][] {
    return this.weatherGrid.getGrid();
  }

  /**
   * Manually set weather at a grid position
   */
  public setGridWeather(gridX: number, gridY: number, weather: WeatherType): boolean {
    return this.weatherGrid.setWeather(gridX, gridY, weather);
  }

  /**
   * Get biome manager for additional operations
   */
  public getBiomeManager(): BiomeManager {
    return this.weatherGrid.getBiomeManager();
  }

  /**
   * Trigger weather evolution
   */
  public evolveWeather(): void {
    this.weatherGrid.evolveWeather();
  }

  /**
   * Print current state
   */
  public printState(): void {
    this.weatherGrid.printBiomeGrid();
    this.weatherGrid.printGrid();
  }

  /**
   * Get the BiomeWeatherGrid instance
   */
  public getBiomeWeatherGrid(): BiomeWeatherGrid {
    return this.weatherGrid;
  }

  /**
   * Regenerate the entire weather grid with optional seed
   */
  public regenerateGrid(seed?: number): void {
    console.log(`Regenerating weather grid${seed !== undefined ? ` with seed ${seed}` : ''}...`);
    this.weatherGrid.generateBiomeAwareWeather(seed);
    console.log('Weather grid regenerated successfully');
    this.weatherGrid.printGrid();
  }

  /**
   * Freeze or unfreeze weather evolution
   */
  public freezeWeather(frozen: boolean): void {
    this.weatherFrozen = frozen;
    console.log(`Weather evolution ${frozen ? 'frozen' : 'unfrozen'}`);
  }

  /**
   * Check if weather is currently frozen
   */
  public isWeatherFrozen(): boolean {
    return this.weatherFrozen;
  }

  /**
   * Force a specific weather type globally (overrides grid)
   */
  public forceGlobalWeather(weather: WeatherType | null): void {
    this.globalWeatherOverride = weather;
    if (weather) {
      console.log(`Global weather override set to ${weather}`);
    } else {
      console.log('Global weather override removed');
    }
  }

  /**
   * Get the current global weather override
   */
  public getGlobalWeatherOverride(): WeatherType | null {
    return this.globalWeatherOverride;
  }
}

export default WeatherManager.instance;
