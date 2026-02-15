/**
 * Shared type definitions for the weather system
 * These types are used across both client and server
 */

import { BiomeType, WeatherType } from './biome';

/**
 * Represents a single cell in the weather grid
 */
export interface GridCell {
  x: number;
  y: number;
  weather: WeatherType;
  variant: string | null;
  biome: BiomeType;
}

/**
 * Weather transition information
 */
export interface WeatherTransition {
  currentWeather: WeatherType;
  neighborWeather: WeatherType | null;
  currentVariant: string | null;
  neighborVariant: string | null;
  transitionPercent: number;
  shouldApply: boolean;
}

/**
 * Cell bounds for spatial calculations
 */
export interface CellBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
}

/**
 * Grid dimensions
 */
export interface GridDimensions {
  totalWidth: number;
  totalHeight: number;
  cellWidth: number;
  cellHeight: number;
}
