/**
 * RDR2 Biome System
 * Defines geographical regions and their compatible weather types
 */

export enum BiomeType {
  GRIZZLIES = 'GRIZZLIES',           // Snowy mountains (north)
  TALL_TREES = 'TALL_TREES',         // Dense forests
  BIG_VALLEY = 'BIG_VALLEY',         // Valley region
  HEARTLANDS = 'HEARTLANDS',         // Central plains
  GREAT_PLAINS = 'GREAT_PLAINS',     // Western plains
  BAYOU = 'BAYOU',                   // Swampy southeast
  LEMOYNE = 'LEMOYNE',               // Southern region
  NEW_AUSTIN = 'NEW_AUSTIN',         // Desert (southwest)
  RIO_BRAVO = 'RIO_BRAVO',           // Arid desert
  ROANOKE = 'ROANOKE',               // Eastern forests
  CUMBERLAND = 'CUMBERLAND',         // Forest region
  SCARLETT = 'SCARLETT',             // Meadows
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

export const WeatherHashes: Record<WeatherType, number> = {
  [WeatherType.BLIZZARD]: GetHashKey('blizzard'),
  [WeatherType.CLOUDS]: GetHashKey('clouds'),
  [WeatherType.DRIZZLE]: GetHashKey('drizzle'),
  [WeatherType.FOG]: GetHashKey('fog'),
  [WeatherType.GROUNDBLIZZARD]: GetHashKey('groundblizzard'),
  [WeatherType.HAIL]: GetHashKey('hail'),
  [WeatherType.HIGHPRESSURE]: GetHashKey('highpressure'),
  [WeatherType.HURRICANE]: GetHashKey('hurricane'),
  [WeatherType.MISTY]: GetHashKey('misty'),
  [WeatherType.OVERCAST]: GetHashKey('overcast'),
  [WeatherType.OVERCASTDARK]: GetHashKey('overcastdark'),
  [WeatherType.RAIN]: GetHashKey('rain'),
  [WeatherType.SANDSTORM]: GetHashKey('sandstorm'),
  [WeatherType.SHOWER]: GetHashKey('shower'),
  [WeatherType.SLEET]: GetHashKey('sleet'),
  [WeatherType.SNOW]: GetHashKey('snow'),
  [WeatherType.SNOWLIGHT]: GetHashKey('snowlight'),
  [WeatherType.SUNNY]: GetHashKey('sunny'),
  [WeatherType.THUNDER]: GetHashKey('thunder'),
  [WeatherType.THUNDERSTORM]: GetHashKey('thunderstorm'),
  [WeatherType.WHITEOUT]: GetHashKey('whiteout'),
};

// All available weather variants (used as fallback)
export const WeatherVariants: Record<WeatherType, string[]> = {
  [WeatherType.BLIZZARD]: ["BLIZZARD_winter2"],
  [WeatherType.CLOUDS]: ["CLOUDS_mudtown3B"],
  [WeatherType.DRIZZLE]: ["DRIZZLE_finale1", "DRIZZLE_finale1B"],
  [WeatherType.FOG]: ["FOG_guama", "Fog_MP_Pred"],
  [WeatherType.GROUNDBLIZZARD]: ["GROUNDBLIZZARD_odriscols", "GROUNDBLIZZARD_winter2"],
  [WeatherType.HAIL]: [],
  [WeatherType.HIGHPRESSURE]: ["HIGHPRESSURE_guama"],
  [WeatherType.HURRICANE]: ["HURRICANE_guama"],
  [WeatherType.MISTY]: [
    "MISTY_braithwaites3",
    "MISTY_finale1",
    "MISTY_finale1B",
    "MISTY_finale2",
    "MISTY_guama",
    "MISTY_MP_intro",
    "MISTY_MP_Pred",
    "MISTY_train1",
  ],
  [WeatherType.OVERCAST]: [],
  [WeatherType.OVERCASTDARK]: ["OVERCASTDARK_finale2", "OVERCASTDARK_Gang2", "OVERCASTDARK_native3", "OVERCASTDARK_STD1"],
  [WeatherType.RAIN]: [],
  [WeatherType.SANDSTORM]: [],
  [WeatherType.SLEET]: [],
  [WeatherType.SHOWER]: ["SHOWER_finale2", "SHOWER_guama", "shower_MP_Pred"],
  [WeatherType.SNOW]: ["SNOW_Odriscolls1", "SNOW_Pearson1"],
  [WeatherType.SNOWLIGHT]: ["SNOWLIGHT_finale2", "SNOWLIGHT_Odriscolls1", "SNOWLIGHT_Pearson1"],
  [WeatherType.SUNNY]: ["Sunny_odriscols4"],
  [WeatherType.THUNDER]: [],
  [WeatherType.THUNDERSTORM]: ["THUNDERSTORM_MP_Pred", "THUNDERSTORM_nativeSon3"],
  [WeatherType.WHITEOUT]: ["WHITEOUT_winter1"],
  // -- ONLY SINGLEPLAYER:
  // [WeatherType.SNOWCLEARING]: ["SNOWCLEARING_mud1", "SNOWCLEARING_winter4"],
};

/**
 * Biome-specific weather variants
 * Maps each biome to its appropriate weather variants for enhanced regional atmosphere
 */
export const BiomeWeatherVariants: Record<BiomeType, Partial<Record<WeatherType, string[]>>> = {
  [BiomeType.GRIZZLIES]: {
    // Snowy mountain variants
    [WeatherType.BLIZZARD]: ["BLIZZARD_winter2"],
    [WeatherType.GROUNDBLIZZARD]: ["GROUNDBLIZZARD_odriscols", "GROUNDBLIZZARD_winter2"],
    [WeatherType.SNOW]: ["SNOW_Odriscolls1", "SNOW_Pearson1"],
    [WeatherType.SNOWLIGHT]: ["SNOWLIGHT_Odriscolls1", "SNOWLIGHT_Pearson1"],
    [WeatherType.WHITEOUT]: ["WHITEOUT_winter1"],
    [WeatherType.MISTY]: ["MISTY_finale2", "MISTY_MP_Pred"],
    [WeatherType.FOG]: ["Fog_MP_Pred"],
  },

  [BiomeType.TALL_TREES]: {
    // Dense forest variants
    [WeatherType.MISTY]: ["MISTY_train1", "MISTY_MP_Pred"],
    [WeatherType.FOG]: ["Fog_MP_Pred"],
    [WeatherType.DRIZZLE]: ["DRIZZLE_finale1"],
    [WeatherType.OVERCASTDARK]: ["OVERCASTDARK_Gang2"],
  },

  [BiomeType.BIG_VALLEY]: {
    // Valley with occasional snow
    [WeatherType.SNOWLIGHT]: ["SNOWLIGHT_finale2"],
    [WeatherType.MISTY]: ["MISTY_finale1", "MISTY_finale2"],
    [WeatherType.FOG]: ["Fog_MP_Pred"],
    [WeatherType.DRIZZLE]: ["DRIZZLE_finale1B"],
  },

  [BiomeType.HEARTLANDS]: {
    // Central plains variants
    [WeatherType.SUNNY]: ["Sunny_odriscols4"],
    [WeatherType.MISTY]: ["MISTY_finale1", "MISTY_MP_intro"],
    [WeatherType.DRIZZLE]: ["DRIZZLE_finale1"],
    [WeatherType.THUNDERSTORM]: ["THUNDERSTORM_nativeSon3"],
    [WeatherType.OVERCASTDARK]: ["OVERCASTDARK_native3", "OVERCASTDARK_STD1"],
  },

  [BiomeType.GREAT_PLAINS]: {
    // Western plains variants
    [WeatherType.SUNNY]: ["Sunny_odriscols4"],
    [WeatherType.MISTY]: ["MISTY_finale1", "MISTY_MP_intro"],
    [WeatherType.DRIZZLE]: ["DRIZZLE_finale1B"],
    [WeatherType.THUNDERSTORM]: ["THUNDERSTORM_nativeSon3"],
  },

  [BiomeType.BAYOU]: {
    // Swampy southeast variants
    [WeatherType.FOG]: ["FOG_guama"],
    [WeatherType.MISTY]: ["MISTY_guama", "MISTY_braithwaites3"],
    [WeatherType.SHOWER]: ["SHOWER_guama"],
    [WeatherType.HIGHPRESSURE]: ["HIGHPRESSURE_guama"],
    [WeatherType.HURRICANE]: ["HURRICANE_guama"],
    [WeatherType.DRIZZLE]: ["DRIZZLE_finale1"],
  },

  [BiomeType.LEMOYNE]: {
    // Southern region variants
    [WeatherType.FOG]: ["FOG_guama"],
    [WeatherType.MISTY]: ["MISTY_guama", "MISTY_braithwaites3"],
    [WeatherType.SHOWER]: ["SHOWER_guama", "shower_MP_Pred"],
    [WeatherType.HIGHPRESSURE]: ["HIGHPRESSURE_guama"],
    [WeatherType.DRIZZLE]: ["DRIZZLE_finale1"],
    [WeatherType.THUNDERSTORM]: ["THUNDERSTORM_MP_Pred"],
  },

  [BiomeType.NEW_AUSTIN]: {
    // Desert variants (minimal variants due to arid climate)
    [WeatherType.HIGHPRESSURE]: ["HIGHPRESSURE_guama"],
    [WeatherType.SUNNY]: ["Sunny_odriscols4"],
  },

  [BiomeType.RIO_BRAVO]: {
    // Arid desert variants (minimal)
    [WeatherType.HIGHPRESSURE]: ["HIGHPRESSURE_guama"],
    [WeatherType.SUNNY]: ["Sunny_odriscols4"],
  },

  [BiomeType.ROANOKE]: {
    // Eastern forests variants
    [WeatherType.FOG]: ["Fog_MP_Pred"],
    [WeatherType.MISTY]: ["MISTY_train1", "MISTY_MP_Pred", "MISTY_finale2"],
    [WeatherType.DRIZZLE]: ["DRIZZLE_finale1"],
    [WeatherType.OVERCASTDARK]: ["OVERCASTDARK_Gang2", "OVERCASTDARK_finale2"],
  },

  [BiomeType.CUMBERLAND]: {
    // Forest region variants
    [WeatherType.MISTY]: ["MISTY_finale1", "MISTY_MP_Pred"],
    [WeatherType.FOG]: ["Fog_MP_Pred"],
    [WeatherType.DRIZZLE]: ["DRIZZLE_finale1B"],
    [WeatherType.SUNNY]: ["Sunny_odriscols4"],
  },

  [BiomeType.SCARLETT]: {
    // Meadows variants
    [WeatherType.SUNNY]: ["Sunny_odriscols4"],
    [WeatherType.MISTY]: ["MISTY_braithwaites3", "MISTY_finale1"],
    [WeatherType.DRIZZLE]: ["DRIZZLE_finale1"],
    [WeatherType.SHOWER]: ["SHOWER_finale2"],
  },
};

/**
 * Human-readable biome names for display
 */
export const BiomeNames: Record<BiomeType, string> = {
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

// Define which weather types are allowed in each biome
export const BIOME_WEATHER_RULES: Record<BiomeType, WeatherType[]> = {
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
    WeatherType.SNOWLIGHT, // Occasional light snow in winter
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
    WeatherType.OVERCAST // Rare
  ],
  [BiomeType.RIO_BRAVO]: [
    WeatherType.SUNNY,
    WeatherType.HIGHPRESSURE,
    WeatherType.CLOUDS
  ],
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
  ]
};

// Weather compatibility (same as before)
export const WEATHER_COMPATIBILITY: Record<WeatherType, WeatherType[]> = {
  [WeatherType.BLIZZARD]: [WeatherType.BLIZZARD, WeatherType.SNOW, WeatherType.OVERCAST],
  [WeatherType.CLOUDS]: [WeatherType.CLOUDS, WeatherType.SUNNY, WeatherType.OVERCAST, WeatherType.HIGHPRESSURE, WeatherType.DRIZZLE],
  [WeatherType.DRIZZLE]: [WeatherType.DRIZZLE, WeatherType.CLOUDS, WeatherType.OVERCAST, WeatherType.RAIN],
  [WeatherType.FOG]: [WeatherType.FOG, WeatherType.OVERCAST, WeatherType.CLOUDS],
  [WeatherType.GROUNDBLIZZARD]: [],
  [WeatherType.HAIL]: [],
  [WeatherType.HIGHPRESSURE]: [WeatherType.HIGHPRESSURE, WeatherType.SUNNY, WeatherType.CLOUDS],
  [WeatherType.HURRICANE]: [],
  [WeatherType.MISTY]: [],
  [WeatherType.OVERCAST]: [WeatherType.OVERCAST, WeatherType.CLOUDS, WeatherType.DRIZZLE, WeatherType.RAIN, WeatherType.FOG],
  [WeatherType.OVERCASTDARK]: [],
  [WeatherType.RAIN]: [WeatherType.RAIN, WeatherType.DRIZZLE, WeatherType.OVERCAST, WeatherType.THUNDER],
  [WeatherType.SANDSTORM]: [],
  [WeatherType.SHOWER]: [],
  [WeatherType.SLEET]: [],
  [WeatherType.SNOW]: [WeatherType.SNOW, WeatherType.SNOWLIGHT, WeatherType.OVERCAST, WeatherType.BLIZZARD],
  [WeatherType.SNOWLIGHT]: [WeatherType.SNOWLIGHT, WeatherType.SNOW, WeatherType.CLOUDS, WeatherType.OVERCAST],
  [WeatherType.SUNNY]: [WeatherType.SUNNY, WeatherType.HIGHPRESSURE, WeatherType.CLOUDS],
  [WeatherType.THUNDER]: [WeatherType.THUNDER, WeatherType.RAIN, WeatherType.OVERCAST],
  [WeatherType.THUNDERSTORM]: [WeatherType.THUNDERSTORM, WeatherType.RAIN, WeatherType.OVERCAST],
  [WeatherType.WHITEOUT]: [WeatherType.WHITEOUT, WeatherType.BLIZZARD, WeatherType.SNOW]
};

/**
 * Biome boundary definitions using world coordinates
 * These are approximate boundaries based on RDR2's map
 */
interface BiomeBoundary {
  biome: BiomeType;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  priority: number; // Higher priority biomes override lower ones in overlaps
}

export const BIOME_BOUNDARIES: BiomeBoundary[] = [
  // Northern snowy regions (highest priority - most specific)
  {
    biome: BiomeType.GRIZZLIES,
    minX: -2100,
    maxX: 1500,
    minY: 1500,
    maxY: 4608,
    priority: 10
  },
  
  // Desert regions (southwest)
  {
    biome: BiomeType.RIO_BRAVO,
    minX: -5632,
    maxX: -3500,
    minY: -5760,
    maxY: -3500,
    priority: 9
  },
  {
    biome: BiomeType.NEW_AUSTIN,
    minX: -5632,
    maxX: -2000,
    minY: -3500,
    maxY: -1000,
    priority: 8
  },
  
  // Bayou (southeast swamp)
  {
    biome: BiomeType.BAYOU,
    minX: 1800,
    maxX: 6144,
    minY: -5760,
    maxY: -800,
    priority: 9
  },
  
  // Lemoyne (southern region)
  {
    biome: BiomeType.LEMOYNE,
    minX: 600,
    maxX: 2400,
    minY: -2500,
    maxY: -200,
    priority: 7
  },
  
  // Roanoke Ridge (northeast)
  {
    biome: BiomeType.ROANOKE,
    minX: 1500,
    maxX: 6144,
    minY: 800,
    maxY: 4608,
    priority: 8
  },
  
  // Tall Trees (northwest forest)
  {
    biome: BiomeType.TALL_TREES,
    minX: -2800,
    maxX: -1400,
    minY: -800,
    maxY: 1200,
    priority: 7
  },
  
  // Big Valley
  {
    biome: BiomeType.BIG_VALLEY,
    minX: -2200,
    maxX: -800,
    minY: 200,
    maxY: 1600,
    priority: 6
  },
  
  // Cumberland Forest
  {
    biome: BiomeType.CUMBERLAND,
    minX: 400,
    maxX: 1800,
    minY: 600,
    maxY: 1800,
    priority: 6
  },
  
  // Scarlett Meadows
  {
    biome: BiomeType.SCARLETT,
    minX: 800,
    maxX: 2200,
    minY: -1500,
    maxY: 200,
    priority: 5
  },
  
  // Great Plains (west)
  {
    biome: BiomeType.GREAT_PLAINS,
    minX: -2000,
    maxX: -400,
    minY: -2000,
    maxY: 200,
    priority: 5
  },
  
  // Heartlands (central - lowest priority, default)
  {
    biome: BiomeType.HEARTLANDS,
    minX: -800,
    maxX: 1500,
    minY: -1000,
    maxY: 1000,
    priority: 4
  }
];

/**
 * Biome Manager - handles biome detection and weather validation
 */
export class BiomeManager {
  private biomeCache: Map<string, BiomeType> = new Map();
  
  /**
   * Get the biome at a specific world coordinate
   */
  public getBiomeAtPosition(worldX: number, worldY: number): BiomeType {
    const cacheKey = `${Math.floor(worldX / 100)},${Math.floor(worldY / 100)}`;
    
    // Check cache first (cache by 100-unit squares for performance)
    if (this.biomeCache.has(cacheKey)) {
      return this.biomeCache.get(cacheKey)!;
    }
    
    // Find all biomes that contain this point
    const matchingBiomes = BIOME_BOUNDARIES.filter(boundary => 
      worldX >= boundary.minX &&
      worldX <= boundary.maxX &&
      worldY >= boundary.minY &&
      worldY <= boundary.maxY
    );
    
    // If multiple biomes match, use the one with highest priority
    let selectedBiome = BiomeType.HEARTLANDS; // Default fallback
    
    if (matchingBiomes.length > 0) {
      matchingBiomes.sort((a, b) => b.priority - a.priority);
      selectedBiome = matchingBiomes[0].biome;
    }
    
    // Cache the result
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
  public getCompatibleWeatherInBiome(
    currentWeather: WeatherType,
    biome: BiomeType
  ): WeatherType[] {
    const compatible = WEATHER_COMPATIBILITY[currentWeather];
    const allowed = BIOME_WEATHER_RULES[biome];
    
    // Return intersection of compatible and allowed
    return compatible.filter(w => allowed.includes(w));
  }
  
  /**
   * Find the nearest allowed weather type for a biome
   * Used when weather needs to transition into a new biome
   */
  public findNearestAllowedWeather(
    currentWeather: WeatherType,
    targetBiome: BiomeType
  ): WeatherType {
    // If current weather is already allowed, keep it
    if (this.isWeatherAllowedInBiome(currentWeather, targetBiome)) {
      return currentWeather;
    }
    
    // Try to find a compatible weather that's allowed
    const compatible = this.getCompatibleWeatherInBiome(currentWeather, targetBiome);
    
    if (compatible.length > 0) {
      return compatible[0];
    }
    
    // If no compatible weather, return the most neutral weather for the biome
    const allowed = BIOME_WEATHER_RULES[targetBiome];
    
    // Prefer CLEAR or CLOUDS as neutral options
    // if (allowed.includes(WeatherType.SUNNY)) return WeatherType.SUNNY;
    if (allowed.includes(WeatherType.CLOUDS)) return WeatherType.CLOUDS;
    if (allowed.includes(WeatherType.OVERCAST)) return WeatherType.OVERCAST;
    
    // Otherwise return first allowed weather
    return allowed[0];
  }
  
  /**
   * Get biome transition zones (where two biomes meet)
   * Returns list of biomes within a certain distance
   */
  public getNearbyBiomes(worldX: number, worldY: number, radius: number = 500): BiomeType[] {
    const biomes = new Set<BiomeType>();
    
    // Sample points in a circle around the position
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
        // Convert grid position to world coordinates (center of cell)
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
      const row = biomeMap[y].map(biome => {
        // Abbreviate biome names
        const abbrev: Record<string, string> = {
          'GRIZZLIES': 'GRIZ',
          'TALL_TREES': 'TREE',
          'BIG_VALLEY': 'BVAL',
          'HEARTLANDS': 'HEAR',
          'GREAT_PLAINS': 'PLNS',
          'BAYOU': 'BAYO',
          'LEMOYNE': 'LEMO',
          'NEW_AUSTIN': 'NAUS',
          'RIO_BRAVO': 'RBRA',
          'ROANOKE': 'ROAN',
          'CUMBERLAND': 'CUMB',
          'SCARLETT': 'SCAR'
        };
        return (abbrev[biome] || biome.substring(0, 4)).padEnd(4);
      }).join(' | ');
      
      console.log(row);
      if (y < gridHeight - 1) {
        console.log('-'.repeat(row.length));
      }
    }
    console.log('=================\n');
  }
  
  /**
   * Clear the biome cache (useful if biome boundaries are modified)
   */
  public clearCache(): void {
    this.biomeCache.clear();
  }
}

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
 * Weather types that support rain
 */
const RAIN_WEATHER_TYPES = [
  WeatherType.RAIN,
  WeatherType.SHOWER,
  WeatherType.DRIZZLE,
  WeatherType.THUNDERSTORM,
] as const;

/**
 * Get rain rate for a weather type
 * @param weatherType The weather type
 * @param random Optional random function for variation (defaults to Math.random)
 * @returns Rain rate between 0.0 and 1.0
 */
export function getRainRate(weatherType: WeatherType, random: () => number = Math.random): number {
  switch (weatherType) {
    case WeatherType.DRIZZLE:
      // Light rain: 0.2 - 0.4
      return 0.2 + random() * 0.2;

    case WeatherType.SHOWER:
      // Moderate rain: 0.4 - 0.7
      return 0.4 + random() * 0.3;

    case WeatherType.RAIN:
      // Heavy rain: 0.6 - 0.9
      return 0.6 + random() * 0.3;

    case WeatherType.THUNDERSTORM:
      // Very heavy rain: 0.8 - 1.0
      return 0.8 + random() * 0.2;

    default:
      // No rain for other weather types
      return 0.0;
  }
}

/**
 * Check if a weather type supports rain
 */
export function isRainWeather(weatherType: WeatherType): boolean {
  return RAIN_WEATHER_TYPES.includes(weatherType as any);
}

export default BiomeManager;