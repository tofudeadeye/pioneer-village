import {BiomeWeatherGrid} from './grid'
import type { GridCell } from './grid';
import {BiomeManager, BiomeType, WeatherType} from './biome'

class BiomeWeatherManager {
  protected static instance: BiomeWeatherManager;

  static getInstance(): BiomeWeatherManager {
    if (!BiomeWeatherManager.instance) {
      BiomeWeatherManager.instance = new BiomeWeatherManager();
    }
    return BiomeWeatherManager.instance;
  }

  private weatherGrid: BiomeWeatherGrid;
  private weatherFrozen: boolean = false;
  private globalWeatherOverride: WeatherType | null = null;

  constructor() {
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

  public getBiomeWeatherGrid(): BiomeWeatherGrid {
    return this.weatherGrid;
  }

  /**
   * Regenerate the entire weather grid with optional seed
   * @param seed Optional seed for deterministic generation
   */
  public regenerateGrid(seed?: number): void {
    console.log(`Regenerating weather grid${seed !== undefined ? ` with seed ${seed}` : ''}...`);
    this.weatherGrid.generateBiomeAwareWeather(seed);
    console.log('Weather grid regenerated successfully');
    this.weatherGrid.printGrid();
  }

  /**
   * Freeze or unfreeze weather evolution
   * @param frozen True to freeze, false to unfreeze
   */
  public freezeWeather(frozen: boolean): void {
    this.weatherFrozen = frozen;
    console.log(`Weather evolution ${frozen ? 'frozen' : 'unfrozen'}`);
  }

  /**
   * Check if weather is currently frozen
   * @returns True if frozen, false otherwise
   */
  public isWeatherFrozen(): boolean {
    return this.weatherFrozen;
  }

  /**
   * Force a specific weather type globally (overrides grid)
   * @param weather Weather type to force, or null to disable override
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
   * @returns Current override weather type, or null if none
   */
  public getGlobalWeatherOverride(): WeatherType | null {
    return this.globalWeatherOverride;
  }
}

export { 
  BiomeWeatherGrid, 
  BiomeType, 
  WeatherType,
  BiomeManager 
};

const weatherManager = BiomeWeatherManager.getInstance();

export default weatherManager;