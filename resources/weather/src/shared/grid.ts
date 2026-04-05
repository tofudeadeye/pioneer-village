import { BiomeType, WeatherType, BiomeManager, WEATHER_COMPATIBILITY, BIOME_WEATHER_RULES, WeatherVariants, BiomeWeatherVariants, getRainRate} from './biome'
import { Log } from '@lib/client/comms/ui';
import type { GridCell } from './types';

interface Neighbor {
  x: number;
  y: number;
  direction: string;
}

class BiomeWeatherGrid {
  private grid: GridCell[][];
  private width: number;
  private height: number;
  private biomeManager: BiomeManager;
  
  // RDR2 map boundaries, feel free to adjust if you want to focus on a specific region or use a different grid size
  private readonly MAP_MIN_X = -5632.0;
  private readonly MAP_MAX_X = 6144.0;
  private readonly MAP_MIN_Y = -5760.0;
  private readonly MAP_MAX_Y = 4608.0;
  
  // Default grid size of 8x8, can be adjusted as needed
  constructor(gridWidth: number = 8, gridHeight: number = 8) {
    this.width = gridWidth;
    this.height = gridHeight;
    this.biomeManager = new BiomeManager();
    
    // Initialize grid with biomes
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
        const {worldX, worldY} = this.gridToWorld(x, y);
        const biome = this.biomeManager.getBiomeAtPosition(worldX, worldY);
        row.push({
          x,
          y,
          weather: WeatherType.CLOUDS, // Default, will be set during generation
          variant: null,
          biome,
          rainRate: 0.0 // Default, will be set during generation
        });
      }
      
      grid.push(row);
    }
    
    return grid;
  }
  
  /**
   * Convert grid coordinates to world coordinates (center of cell)
   */
  public gridToWorld(gridX: number, gridY: number): {worldX: number, worldY: number} {
    const worldX = this.MAP_MIN_X + ((gridX + 0.5) / this.width) * (this.MAP_MAX_X - this.MAP_MIN_X);
    const worldY = this.MAP_MIN_Y + ((gridY + 0.5) / this.height) * (this.MAP_MAX_Y - this.MAP_MIN_Y);
    return {worldX, worldY};
  }

  /**
   * Convert world coordinates to grid coordinates
   */
  public worldToGrid(worldX: number, worldY: number): {x: number, y: number} {
    const gridX = Math.floor(
      ((worldX - this.MAP_MIN_X) / (this.MAP_MAX_X - this.MAP_MIN_X)) * this.width
    );
    const gridY = Math.floor(
      ((worldY - this.MAP_MIN_Y) / (this.MAP_MAX_Y - this.MAP_MIN_Y)) * this.height
    );

    return {
      x: Math.max(0, Math.min(this.width - 1, gridX)),
      y: Math.max(0, Math.min(this.height - 1, gridY))
    };
  }
  
  /**
   * Get all neighbors of a grid cell
   */
  private getNeighbors(x: number, y: number): Neighbor[] {
    const neighbors: Neighbor[] = [];
    
    // Cardinal directions
    if (y > 0) neighbors.push({ x, y: y - 1, direction: 'N' });
    if (y < this.height - 1) neighbors.push({ x, y: y + 1, direction: 'S' });
    if (x > 0) neighbors.push({ x: x - 1, y, direction: 'W' });
    if (x < this.width - 1) neighbors.push({ x: x + 1, y, direction: 'E' });
    
    // Diagonal directions
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
    
    // First check: Is this weather allowed in this biome?
    if (!this.biomeManager.isWeatherAllowedInBiome(weatherType, cell.biome)) {
      return false;
    }
    
    const neighbors = this.getNeighbors(x, y);
    const compatibleWeathers = WEATHER_COMPATIBILITY[weatherType];
    
    for (const neighbor of neighbors) {
      const neighborCell = this.grid[neighbor.y][neighbor.x];
      const neighborWeather = neighborCell.weather;
      
      // Check if the proposed weather is compatible with this neighbor
      if (!compatibleWeathers.includes(neighborWeather)) {
        return false;
      }
      
      // Also check if the neighbor is compatible with the proposed weather
      const neighborCompatible = WEATHER_COMPATIBILITY[neighborWeather];
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
    
    // Start with weather types allowed in this biome
    let compatible = new Set<WeatherType>(BIOME_WEATHER_RULES[cell.biome]);
    
    if (neighbors.length === 0) {
      return Array.from(compatible);
    }
    
    // Filter based on each neighbor's weather compatibility
    for (const neighbor of neighbors) {
      const neighborWeather = this.grid[neighbor.y][neighbor.x].weather;
      const neighborCompatible = WEATHER_COMPATIBILITY[neighborWeather];
      
      // Keep only weather types compatible with this neighbor
      compatible = new Set(
        Array.from(compatible).filter(w => {
          const isInNeighborCompatible = neighborCompatible.includes(w);
          const neighborIsInWeatherCompatible = WEATHER_COMPATIBILITY[w].includes(neighborWeather);
          return isInNeighborCompatible && neighborIsInWeatherCompatible;
        })
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
    
    // Check biome compatibility
    if (!this.biomeManager.isWeatherAllowedInBiome(weatherType, cell.biome)) {
      console.warn(
        `Weather type ${weatherType} is not allowed in biome ${cell.biome} at (${x}, ${y})`
      );
      return false;
    }
    
    // Check neighbor compatibility
    if (!this.isCompatibleWithNeighbors(x, y, weatherType)) {
      console.warn(
        `Weather type ${weatherType} is not compatible with neighbors at (${x}, ${y})`
      );
      return false;
    }
    
    cell.weather = weatherType;
    cell.variant = this.getRandomVariant(weatherType, cell.biome);
    cell.rainRate = getRainRate(weatherType);
    return true;
  }
  
  /**
   * Initialize the grid with biome-appropriate random weather
   */
  public generateBiomeAwareWeather(seed?: number): void {
    let random = seed !== undefined ? this.seededRandom(seed) : Math.random;

    // Group cells by biome for more realistic weather patterns
    const biomeGroups = new Map<BiomeType, GridCell[]>();

    this.grid.forEach(row => {
      row.forEach(cell => {
        if (!biomeGroups.has(cell.biome)) {
          biomeGroups.set(cell.biome, []);
        }
        biomeGroups.get(cell.biome)!.push(cell);
      });
    });

    // Create multiple seed points per biome for better variation
    // Use 30% of cells in each biome as seed points (or at least 1)
    biomeGroups.forEach((cells, biome) => {
      const allowedWeathers = BIOME_WEATHER_RULES[biome];
      const seedCount = Math.max(1, Math.ceil(cells.length * 0.3));

      // Shuffle cells to get random seed positions
      const shuffledCells = [...cells].sort(() => random() - 0.5);

      let placedSeeds = 0;
      let attemptIndex = 0;

      // Try to place seeds with compatibility checking
      while (placedSeeds < seedCount && attemptIndex < shuffledCells.length) {
        const seedCell = shuffledCells[attemptIndex];
        attemptIndex++;

        // Try each allowed weather type for this cell, starting with random order
        const shuffledWeathers = [...allowedWeathers].sort(() => random() - 0.5);

        for (const weatherType of shuffledWeathers) {
          // Temporarily set the weather to check compatibility
          const originalWeather = seedCell.weather;
          seedCell.weather = weatherType;

          // Check if this weather is compatible with already-placed neighbors
          if (this.isCompatibleWithNeighbors(seedCell.x, seedCell.y, weatherType)) {
            // Compatible! Keep this weather and set variant and rain rate
            seedCell.variant = this.getRandomVariant(weatherType, biome, random);
            seedCell.rainRate = getRainRate(weatherType, random);
            placedSeeds++;
            break;
          } else {
            // Not compatible, restore original and try next weather type
            seedCell.weather = originalWeather;
          }
        }
      }
    });

    // BFS to fill remaining cells with compatible weather
    const queue: GridCell[] = [];
    const visited = new Set<string>();

    // Add all cells with assigned weather to queue
    this.grid.forEach(row => {
      row.forEach(cell => {
        if (cell.weather !== WeatherType.CLOUDS ||
            this.biomeManager.isWeatherAllowedInBiome(WeatherType.CLOUDS, cell.biome)) {
          queue.push(cell);
          visited.add(`${cell.x},${cell.y}`);
        }
      });
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = this.getNeighbors(current.x, current.y);

      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;

        if (!visited.has(key)) {
          visited.add(key);
          const neighborCell = this.grid[neighbor.y][neighbor.x];

          // Get compatible weather types for this position (including biome rules)
          let compatible = this.getCompatibleWeatherTypes(neighbor.x, neighbor.y);

          if (compatible.length > 0) {
            // Apply diversity constraints: reduce weight of weather types that neighbors already have
            const selectedWeather = this.selectDiverseWeather(
              neighbor.x,
              neighbor.y,
              compatible,
              random
            );

            neighborCell.weather = selectedWeather;
            neighborCell.variant = this.getRandomVariant(selectedWeather, neighborCell.biome, random);
            neighborCell.rainRate = getRainRate(selectedWeather, random);
          }

          queue.push(neighborCell);
        }
      }
    }
  }

  /**
   * Select weather type with diversity constraints to prevent uniformity
   * Weights selection away from weather types that neighbors already have
   */
  private selectDiverseWeather(
    x: number,
    y: number,
    compatible: WeatherType[],
    random: () => number
  ): WeatherType {
    if (compatible.length === 1) {
      return compatible[0];
    }

    // Count how many neighbors have each weather type
    const neighbors = this.getNeighbors(x, y);
    const neighborWeatherCounts = new Map<WeatherType, number>();

    for (const neighbor of neighbors) {
      const neighborWeather = this.grid[neighbor.y][neighbor.x].weather;
      neighborWeatherCounts.set(
        neighborWeather,
        (neighborWeatherCounts.get(neighborWeather) || 0) + 1
      );
    }

    // Create weighted selection: penalize weather types that neighbors already have
    // Weight = 1.0 / (1 + neighborCount * 2)
    const weights: number[] = compatible.map(weather => {
      const neighborCount = neighborWeatherCounts.get(weather) || 0;
      // Heavy penalty for weather types that neighbors have
      return 1.0 / (1 + neighborCount * 3);
    });

    // Normalize weights
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = weights.map(w => w / totalWeight);

    // Weighted random selection
    const randomValue = random();
    let cumulativeWeight = 0;

    for (let i = 0; i < compatible.length; i++) {
      cumulativeWeight += normalizedWeights[i];
      if (randomValue <= cumulativeWeight) {
        return compatible[i];
      }
    }

    // Fallback (should never reach here)
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
   * Returns null if no variants exist for this weather type
   * Prioritizes biome-specific variants, falls back to general variants
   */
  private getRandomVariant(weatherType: WeatherType, biome: BiomeType, random: () => number = Math.random): string | null {
    // First try to get biome-specific variants
    const biomeVariants = BiomeWeatherVariants[biome]?.[weatherType];

    if (biomeVariants && biomeVariants.length > 0) {
      return biomeVariants[Math.floor(random() * biomeVariants.length)];
    }

    // Fall back to general variants
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
    const {x, y} = this.worldToGrid(worldX, worldY);
    return this.grid[y][x].weather;
  }
  
  /**
   * Get biome at world coordinates
   */
  public getBiomeAtPosition(worldX: number, worldY: number): BiomeType {
    const {x, y} = this.worldToGrid(worldX, worldY);
    return this.grid[y][x].biome;
  }
  
  /**
   * Get full cell info at world coordinates
   */
  public getCellAtPosition(worldX: number, worldY: number): GridCell {
    const {x, y} = this.worldToGrid(worldX, worldY);
    return this.grid[y][x];
  }
  
  /**
   * Evolve weather system (biome-aware)
   */
  public evolveWeather(): void {
    const changes: Array<{x: number, y: number, weather: WeatherType, variant: string | null, rainRate: number}> = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // 10% chance to try changing weather at each cell
        if (Math.random() < 0.1) {
          const compatible = this.getCompatibleWeatherTypes(x, y);

          if (compatible.length > 1) {
            const currentWeather = this.grid[y][x].weather;
            const otherWeathers = compatible.filter(w => w !== currentWeather);

            if (otherWeathers.length > 0) {
              const newWeather = otherWeathers[Math.floor(Math.random() * otherWeathers.length)];
              const newVariant = this.getRandomVariant(newWeather, this.grid[y][x].biome);
              const newRainRate = getRainRate(newWeather);
              changes.push({x, y, weather: newWeather, variant: newVariant, rainRate: newRainRate});
            }
          }
        }
      }
    }

    // Apply all changes
    changes.forEach(change => {
      this.grid[change.y][change.x].weather = change.weather;
      this.grid[change.y][change.x].variant = change.variant;
      this.grid[change.y][change.x].rainRate = change.rainRate;
    });
    
    console.log(`Weather evolved: ${changes.length} cells changed`);
  }

  /**
   * Override weather for all cells in a specific biome
   * @param biome The biome type to target
   * @param weatherType The weather type to set
   * @returns Number of cells updated
   */
  public overrideBiomeWeather(biome: BiomeType, weatherType: WeatherType): number {
    let updatedCount = 0;

    // Check if weather is allowed in this biome
    if (!this.biomeManager.isWeatherAllowedInBiome(weatherType, biome)) {
      console.warn(
        `Weather type ${weatherType} is not allowed in biome ${biome}. Override aborted.`
      );
      return 0;
    }

    // Update all cells that match the biome
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

    console.log(
      `Biome weather override: ${updatedCount} cells in ${biome} set to ${weatherType}`
    );
    return updatedCount;
  }

  /**
   * Print grid showing both weather and biome
   */
  public printGrid(): void {
    console.log('\n=== Weather Grid (with Biomes) ===');
    for (let y = 0; y < this.height; y++) {
      const row = this.grid[y].map(cell => {
        const weatherShort = cell.weather.substring(0, 4).padEnd(4);
        // return weatherShort + ` (${cell.x},${cell.y})`;
        return weatherShort;
      }).join(' | ');
      
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
      const row = this.grid[y].map(cell => {
        const biomeAbbrev: Record<string, string> = {
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
        // return (biomeAbbrev[cell.biome] || cell.biome.substring(0, 4)).padEnd(4) + ` (${cell.x},${cell.y})`;
        return (biomeAbbrev[cell.biome] || cell.biome.substring(0, 4)).padEnd(4);
      }).join(' | ');
      
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

  public setGrid(newGrid: GridCell[][]): void {
    if (newGrid.length !== this.height || newGrid.some(row => row.length !== this.width)) {
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
   * Useful for drawing debug lines/boxes in the game
   */
  public getCellBounds(gridX: number, gridY: number): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    centerX: number;
    centerY: number;
  } | null {
    // Validate grid coordinates
    if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
      console.error(`Grid position out of bounds: (${gridX}, ${gridY})`);
      return null;
    }
    
    // Calculate cell width and height in world coordinates
    const cellWidth = (this.MAP_MAX_X - this.MAP_MIN_X) / this.width;
    const cellHeight = (this.MAP_MAX_Y - this.MAP_MIN_Y) / this.height;
    
    // Calculate bounds
    const minX = this.MAP_MIN_X + (gridX * cellWidth);
    const maxX = this.MAP_MIN_X + ((gridX + 1) * cellWidth);
    const minY = this.MAP_MIN_Y + (gridY * cellHeight);
    const maxY = this.MAP_MIN_Y + ((gridY + 1) * cellHeight);
    
    // Calculate center
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    return {
      minX,
      maxX,
      minY,
      maxY,
      centerX,
      centerY
    };
  }
  
  /**
   * Get bounds for all grid cells
   * Useful for drawing the entire grid overlay
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
            biome: this.grid[y][x].biome
          });
        }
      }
    }
    
    return allBounds;
  }
  
  /**
   * Get the four corner coordinates of a grid cell
   * Returns corners in clockwise order: NW, NE, SE, SW
   */
  public getCellCorners(gridX: number, gridY: number): {
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
      nw: { x: bounds.minX, y: bounds.maxY }, // North-West (top-left)
      ne: { x: bounds.maxX, y: bounds.maxY }, // North-East (top-right)
      se: { x: bounds.maxX, y: bounds.minY }, // South-East (bottom-right)
      sw: { x: bounds.minX, y: bounds.minY }  // South-West (bottom-left)
    };
  }
  
  /**
   * Get the grid cell dimensions in world units
   */
  public getCellDimensions(): {
    cellWidth: number;
    cellHeight: number;
    totalWidth: number;
    totalHeight: number;
  } {
    const cellWidth = (this.MAP_MAX_X - this.MAP_MIN_X) / this.width;
    const cellHeight = (this.MAP_MAX_Y - this.MAP_MIN_Y) / this.height;
    
    return {
      cellWidth,
      cellHeight,
      totalWidth: this.MAP_MAX_X - this.MAP_MIN_X,
      totalHeight: this.MAP_MAX_Y - this.MAP_MIN_Y
    };
  }
  
  /**
   * Get weather transition info with smoothing for diagonal movement
   * Considers all neighboring cells for more accurate transitions
   */
  public getWeatherTransitionInfoAdvanced(worldX: number, worldY: number, heading: number): {
    currentWeather: WeatherType;
    neighborWeather: WeatherType | null;
    transitionPercent: number;
    currentCell: { x: number; y: number };
    neighborCell: { x: number; y: number } | null;
    direction: string | null;
  } {
    const gridPos = this.worldToGrid(worldX, worldY);
    const currentCell = this.grid[gridPos.y][gridPos.x];
    const cellBounds = this.getCellBounds(gridPos.x, gridPos.y);
    
    if (!cellBounds) {
      return {
        currentWeather: currentCell.weather,
        neighborWeather: null,
        transitionPercent: 0.1,
        currentCell: gridPos,
        neighborCell: null,
        direction: '??'
      };
    }
    
    const centerX = cellBounds.centerX;
    const centerY = cellBounds.centerY;
    
    // Calculate distances
    const cellHalfWidth = (cellBounds.maxX - cellBounds.minX) / 2;
    const cellHalfHeight = (cellBounds.maxY - cellBounds.minY) / 2;
    
    const normalizedDistX = Math.abs(worldX - centerX) / cellHalfWidth;
    const normalizedDistY = Math.abs(worldY - centerY) / cellHalfHeight;
    
    // Calculate actual distance from center for smoother transitions
    const distanceFromCenter = Math.sqrt(
      Math.pow(normalizedDistX, 2) + Math.pow(normalizedDistY, 2)
    );
    
    // Normalize to 0-1 (diagonal corner would be ~1.414, so clamp)
    const normalizedDistance = Math.min(1.0, distanceFromCenter / Math.sqrt(2));
    
    // Map to 0.1-0.9 range
    const transitionPercent = 0.1 + (normalizedDistance * 0.8);
    
    // Find closest neighbor
    let dirX = worldX > centerX ? 1 : worldX < centerX ? -1 : 0;
    let dirY = worldY > centerY ? 1 : worldY < centerY ? -1 : 0;
    let direction = null;

    // if (heading >= 337.5 && heading < 22.5) {
    //   dirX = 0; dirY = -1; // N
    // } else if (heading >= 22.5 && heading < 67.5) {
    //   dirX = 1; dirY = -1; // NE
    // } else if (heading >= 67.5 && heading < 112.5) {
    //   dirX = 1; dirY = 0; // E
    // } else if (heading >= 112.5 && heading < 157.5) {
    //   dirX = 1; dirY = 1; // SE
    // } else if (heading >= 157.5 && heading < 202.5) {
    //   dirX = 0; dirY = 1; // S
    // } else if (heading >= 202.5 && heading < 247.5) {
    //   dirX = -1; dirY = 1; // SW
    // } else if (heading >= 247.5 && heading < 292.5) {
    //   dirX = -1; dirY = 0; // W
    // } else if (heading >= 292.5 && heading < 337.5) {
    //   dirX = -1; dirY = -1; // NW
    // }

    // heading is CCW rotation (wtf!) 0 <- 360, instead of the usual CW 0 -> 360, so we need to reverse the logic

    if (heading >= 337.5 || (heading > 0 && heading < 22.5)) {
      dirX = 0; dirY = 1; // N
      direction = 'N';
      console.log(`Heading ${heading} is N (${dirX}, ${dirY})`);
      Log(`Heading ${heading} is N (${dirX}, ${dirY})`);
    } else if ((heading >= 22.5 && heading < 67.5)) {
      dirX = -1; dirY = 1; // NW
      direction = 'NW';
      console.log(`Heading ${heading} is NW (${dirX}, ${dirY})`);
      Log(`Heading ${heading} is NW (${dirX}, ${dirY})`);
    } else if ((heading >= 67.5 && heading < 112.5)) {
      dirX = -1; dirY = 0; // W
      direction = 'W';
      console.log(`Heading ${heading} is W (${dirX}, ${dirY})`);
      Log(`Heading ${heading} is W (${dirX}, ${dirY})`);
    } else if ((heading >= 112.5 && heading < 157.5)) {
      dirX = -1; dirY = 1; // SW
      direction = 'SW';
      console.log(`Heading ${heading} is SW (${dirX}, ${dirY})`);
      Log(`Heading ${heading} is SW (${dirX}, ${dirY})`);
    } else if ((heading >= 157.5 && heading < 202.5)) {
      dirX = 0; dirY = -1; // S
      direction = 'S';
      console.log(`Heading ${heading} is S (${dirX}, ${dirY})`);
      Log(`Heading ${heading} is S (${dirX}, ${dirY})`);
    } else if ((heading >= 202.5 && heading < 247.5)) {
      dirX = 1; dirY = -1; // SE
      direction = 'SE';
      console.log(`Heading ${heading} is SE (${dirX}, ${dirY})`);
      Log(`Heading ${heading} is SE (${dirX}, ${dirY})`);
    } else if ((heading >= 247.5 && heading < 292.5)) {
      dirX = 1; dirY = 0; // E
      direction = 'E';
      console.log(`Heading ${heading} is E (${dirX}, ${dirY})`);
      Log(`Heading ${heading} is E (${dirX}, ${dirY})`);
    } else if ((heading >= 292.5 && heading < 337.5)) {
      dirX = 1; dirY = 1; // NE
      direction = 'NE';
      console.log(`Heading ${heading} is NE (${dirX}, ${dirY})`);
      Log(`Heading ${heading} is NE (${dirX}, ${dirY})`);
    } else {
      direction = 'unknown';
      console.log(`Heading ${heading} is unknown, defaulting to N (${dirX}, ${dirY})`);
      Log(`Heading ${heading} is unknown, defaulting to N (${dirX}, ${dirY})`);
      Log(`Heading ${heading} is unknown, defaulting to N (${dirX}, ${dirY})`);
    }
    
    const neighborGridX = gridPos.x + dirX;
    const neighborGridY = gridPos.y + dirY;
    
    let neighborWeather: WeatherType | null = null;
    let neighborCell: { x: number; y: number } | null = null;
    
    if (
      neighborGridX >= 0 && 
      neighborGridX < this.width && 
      neighborGridY >= 0 && 
      neighborGridY < this.height
    ) {
      neighborWeather = this.grid[neighborGridY][neighborGridX].weather;
      neighborCell = { x: neighborGridX, y: neighborGridY };
    }
    
    return {
      currentWeather: currentCell.weather,
      neighborWeather,
      transitionPercent,
      currentCell: gridPos,
      neighborCell,
      direction
    };
  }
}

export { BiomeWeatherGrid };
