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
}

export { 
  BiomeWeatherGrid, 
  BiomeType, 
  WeatherType,
  BiomeManager 
};

const weatherManager = BiomeWeatherManager.getInstance();

export default weatherManager;