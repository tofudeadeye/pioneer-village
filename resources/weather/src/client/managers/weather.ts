import { WeatherType, BiomeType, WeatherVariants, BiomeWeatherVariants, BiomeNames } from "../../shared/biome";
import { BiomeWeatherGrid } from "../../shared/grid";
import type { GridCell } from "../../shared/types";
import { awaitServer } from '@lib/client';
import { Log } from '@lib/client/comms/ui';
import { WeatherHashes } from '../../shared/biome';

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

export class ClientWeatherManager {
  protected static instance: ClientWeatherManager;

  private initialized = false;

  private weatherGrid: BiomeWeatherGrid;

  // Per-player weather state tracking
  private playerWeatherStates: Map<number, PlayerWeatherState> = new Map();

  // Heading change threshold to reset transition target (degrees)
  private readonly HEADING_CHANGE_THRESHOLD = 45;

  // Debug logging throttle
  private lastLogTime: number = 0;

  // Legacy state for compatibility
  private currentWeather: WeatherType = WeatherType.SUNNY;
  private neighborWeather: WeatherType | null = null;
  private lastTransitionPercent: number = 0.1;

  static getInstance(): ClientWeatherManager {
    if (!ClientWeatherManager.instance) {
      ClientWeatherManager.instance = new ClientWeatherManager();
    }
    return ClientWeatherManager.instance;
  }

  constructor() {
    on('onResourceStop', (resourceName: string) => {
      if (resourceName === GetCurrentResourceName()) {
        // do any necessary cleanup here
      }
    });

    this.weatherGrid = new BiomeWeatherGrid();

    if (!this.initialized) {
        this.requestWeatherGrid();
        this.initialized = true;
    }
  }

  public async requestWeatherGrid(): Promise<void> {
    if (!this.weatherGrid) {
      return;
    }

    const g = await awaitServer('weather.request-grid');
    this.weatherGrid.setGrid(g);
    this.forceWeatherFromGrid();
  }

  /**
   * Force apply weather from the current grid position
   * Called when grid is synced to immediately update weather without waiting for movement
   */
  private forceWeatherFromGrid(): void {
    if (!this.weatherGrid) {
      console.warn('Cannot force weather: grid not initialized');
      return;
    }

    const playerPed = PlayerPedId();
    const coords = GetEntityCoords(playerPed, false);
    const [worldX, worldY] = coords;
    const heading = GetEntityHeading(playerPed);

    const currentGridPos = this.weatherGrid.worldToGrid(worldX, worldY);
    const currentCell = this.weatherGrid.getCellAtPosition(worldX, worldY);

    // Initialize or update player state
    const playerState: PlayerWeatherState = {
      currentCell: currentGridPos,
      previousCell: null,
      targetNeighborCell: null,
      currentWeather: currentCell.weather,
      targetWeather: null,
      transitionPercent: 0.0,
      biome: currentCell.biome,
      lastHeading: heading,
      transitionPhase: 'settled'
    };
    this.playerWeatherStates.set(playerPed, playerState);

    // Update internal state
    this.currentWeather = currentCell.weather;
    this.neighborWeather = null;
    this.lastTransitionPercent = 0.0;

    // Apply weather immediately
    if (WeatherHashes[currentCell.weather] !== undefined) {
      const weatherHash = WeatherHashes[currentCell.weather];
      const biomeName = BiomeNames[currentCell.biome] || currentCell.biome;

      console.log(
        `[Weather] Force applying grid weather: ${currentCell.weather} ` +
        `in ${biomeName} at cell (${currentGridPos.x}, ${currentGridPos.y})`
      );

      SetWeatherOwnedByNetwork(false);
      // Set weather to fully settled (0.9)
      SetCurrWeatherState(weatherHash, weatherHash, 0.9, true);

      // Apply variant if available
      if (currentCell.variant) {
        SetWeatherVariation(currentCell.weather, currentCell.variant);
        console.log(`[Weather] Applied variant: ${currentCell.variant}`);
      }
    }
  }

  public calculateIfWeatherShouldTransition(worldX: number, worldY: number, heading: number): void {
    if (!this.initialized || !this.weatherGrid) {
      return;
    }

    const playerId = PlayerPedId();
    const currentGridPos = this.weatherGrid.worldToGrid(worldX, worldY);
    const currentCell = this.weatherGrid.getCellAtPosition(worldX, worldY);

    // Get or initialize player state
    let playerState = this.playerWeatherStates.get(playerId);

    if (!playerState) {
      // First time seeing this player
      playerState = {
        currentCell: currentGridPos,
        previousCell: null,
        targetNeighborCell: null,
        currentWeather: currentCell.weather,
        targetWeather: null,
        transitionPercent: 0.0,
        biome: currentCell.biome,
        lastHeading: heading,
        transitionPhase: 'settled'
      };
      this.playerWeatherStates.set(playerId, playerState);
    }

    // Detect cell change
    const cellChanged =
      playerState.currentCell.x !== currentGridPos.x ||
      playerState.currentCell.y !== currentGridPos.y;

    // Check if heading changed significantly
    const headingChanged = Math.abs(this.normalizeHeadingDiff(heading - playerState.lastHeading)) > this.HEADING_CHANGE_THRESHOLD;

    if (cellChanged) {
      // Player crossed into a new cell
      this.handleCellCrossing(playerState, currentGridPos, currentCell);
    } else if (headingChanged && playerState.transitionPhase !== 'settled') {
      // Heading changed significantly during transition - reset target
      this.resetTransitionTarget(playerState);
    }

    // Calculate current transition state
    const transitionInfo = this.calculateTransition(worldX, worldY, heading, playerState, currentCell);

    // Update player state
    playerState.transitionPercent = transitionInfo.transitionPercent;
    playerState.lastHeading = heading;
    playerState.biome = currentCell.biome;

    // Apply weather if there's an active transition
    if (transitionInfo.shouldApply) {
      this.applyWeatherToPlayer({
        currentWeather: transitionInfo.currentWeather,
        neighborWeather: transitionInfo.neighborWeather,
        currentVariant: transitionInfo.currentVariant,
        neighborVariant: transitionInfo.neighborVariant,
        transitionPercent: transitionInfo.transitionPercent,
        biome: currentCell.biome,
      });

      // Log the update (throttle to avoid spam)
      const now = GetGameTimer();
      if (!this.lastLogTime || now - this.lastLogTime > 500) {
        console.log(
          `[Weather] ${transitionInfo.currentWeather} -> ${transitionInfo.neighborWeather || 'none'} ` +
          `(${(transitionInfo.transitionPercent * 100).toFixed(2)}%) ` +
          `phase: ${playerState.transitionPhase} | ` +
          `cell: (${playerState.currentCell.x},${playerState.currentCell.y}) -> (${playerState.targetNeighborCell?.x || '?'},${playerState.targetNeighborCell?.y || '?'})`
        );
        this.lastLogTime = now;
      }
    }
  }

  /**
   * Normalize heading difference to -180 to 180 range
   */
  private normalizeHeadingDiff(diff: number): number {
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
  }

  /**
   * Handle player crossing from one cell to another
   */
  private handleCellCrossing(
    playerState: PlayerWeatherState,
    newGridPos: { x: number; y: number },
    newCell: GridCell,
  ): void {
    // Check if we crossed into our target neighbor cell
    const crossedIntoTarget =
      playerState.targetNeighborCell &&
      playerState.targetNeighborCell.x === newGridPos.x &&
      playerState.targetNeighborCell.y === newGridPos.y;

    if (crossedIntoTarget) {
      // We crossed into the cell we were transitioning towards
      playerState.previousCell = { ...playerState.currentCell };
      playerState.currentCell = newGridPos;
      // DON'T update currentWeather yet - we're still transitioning!
      // currentWeather stays as the OLD weather until we reach 'settled' phase
      playerState.transitionPhase = 'crossed';

      console.log(
        `[Transition] Crossed into target cell (${newGridPos.x}, ${newGridPos.y}). ` +
        `Continuing transition from ${playerState.currentWeather} -> ${playerState.targetWeather}`
      );
      // Keep the same target to continue the transition to 0.9
    } else {
      // We crossed into a different cell (e.g., diagonal movement or unexpected path)
      // Reset the transition
      playerState.previousCell = { ...playerState.currentCell };
      playerState.currentCell = newGridPos;
      playerState.currentWeather = newCell.weather;
      playerState.targetNeighborCell = null;
      playerState.targetWeather = null;
      playerState.transitionPhase = 'settled';
      playerState.transitionPercent = 0.0;

      console.log(
        `[Transition] Crossed into non-target cell (${newGridPos.x}, ${newGridPos.y}). ` +
        `Resetting transition. New weather: ${newCell.weather}`
      );
    }
  }

  /**
   * Reset transition target when heading changes significantly
   */
  private resetTransitionTarget(
    playerState: PlayerWeatherState,
  ): void {
    playerState.targetNeighborCell = null;
    playerState.targetWeather = null;
    playerState.transitionPhase = 'settled';
    playerState.transitionPercent = 0.0;
  }

  /**
   * Calculate transition percentage and target based on player position and heading
   * Returns 0.0 (50% from edge to center) -> 0.5 (edge) -> 0.9 (50% from edge to center in neighbor)
   * This creates a transition zone in the outer 50% of each cell, leaving the inner 50% as "settled"
   */
  private calculateTransition(
    worldX: number,
    worldY: number,
    heading: number,
    playerState: PlayerWeatherState,
    currentCell: GridCell
  ): {
    currentWeather: WeatherType;
    neighborWeather: WeatherType | null;
    currentVariant: string | null;
    neighborVariant: string | null;
    transitionPercent: number;
    shouldApply: boolean;
  } {
    const cellBounds = this.weatherGrid.getCellBounds(playerState.currentCell.x, playerState.currentCell.y);

    if (!cellBounds) {
      return {
        currentWeather: currentCell.weather,
        neighborWeather: null,
        currentVariant: currentCell.variant,
        neighborVariant: null,
        transitionPercent: 0.0,
        shouldApply: false
      };
    }

    // Determine which neighbor we're heading towards based on heading
    const targetNeighbor = this.getNeighborFromHeading(playerState.currentCell, heading);

    // If no valid neighbor or we're settled, no transition
    if (!targetNeighbor) {
      playerState.transitionPhase = 'settled';
      return {
        currentWeather: currentCell.weather,
        neighborWeather: null,
        currentVariant: currentCell.variant,
        neighborVariant: null,
        transitionPercent: 0.0,
        shouldApply: false
      };
    }

    // Update target if not set or if we're in settled phase
    if (!playerState.targetNeighborCell || playerState.transitionPhase === 'settled') {
      playerState.targetNeighborCell = { x: targetNeighbor.x, y: targetNeighbor.y };
      playerState.targetWeather = targetNeighbor.weather;
      playerState.transitionPhase = 'approaching';
    }

    // Get target neighbor cell bounds
    const targetBounds = this.weatherGrid.getCellBounds(
      playerState.targetNeighborCell.x,
      playerState.targetNeighborCell.y
    );

    if (!targetBounds) {
      return {
        currentWeather: currentCell.weather,
        neighborWeather: null,
        currentVariant: currentCell.variant,
        neighborVariant: null,
        transitionPercent: 0.0,
        shouldApply: false
      };
    }

    // Get the target neighbor cell for variant access
    const targetNeighborCell = this.weatherGrid.getCellAtPosition(targetBounds.centerX, targetBounds.centerY);

    let transitionPercent: number;

    if (playerState.transitionPhase === 'approaching') {
      // Phase 1: Moving from 50% mark towards edge (0.0 -> 0.5)
      // Transition starts at 50% of distance from edge to center, not at true center
      const distanceFromCurrentCenter = Math.sqrt(
        Math.pow(worldX - cellBounds.centerX, 2) +
        Math.pow(worldY - cellBounds.centerY, 2)
      );

      const distanceBetweenCenters = Math.sqrt(
        Math.pow(targetBounds.centerX - cellBounds.centerX, 2) +
        Math.pow(targetBounds.centerY - cellBounds.centerY, 2)
      );

      const halfDistance = distanceBetweenCenters / 2;  // Distance from center to edge
      const transitionStartDistance = halfDistance * 0.5;  // Start at 50% of way from edge to center
      const transitionRange = halfDistance - transitionStartDistance;  // Transition zone width

      if (distanceFromCurrentCenter < transitionStartDistance) {
        // Player is in the "settled zone" - no transition yet
        transitionPercent = 0.0;
      } else {
        // Player is in the transition zone (50% mark to edge)
        const progressInZone = distanceFromCurrentCenter - transitionStartDistance;
        transitionPercent = Math.min(0.5, (progressInZone / transitionRange) * 0.5);
      }

    } else if (playerState.transitionPhase === 'crossed') {
      // Phase 2: Moving from edge to 50% mark (0.5 -> 0.9)
      // Transition ends at 50% of distance from edge to center, not at true center
      const distanceFromCurrentCenter = Math.sqrt(
        Math.pow(worldX - cellBounds.centerX, 2) +
        Math.pow(worldY - cellBounds.centerY, 2)
      );

      // Get previous cell bounds to calculate the distance between centers
      const prevBounds = playerState.previousCell
        ? this.weatherGrid.getCellBounds(playerState.previousCell.x, playerState.previousCell.y)
        : null;

      if (!prevBounds) {
        // Fallback if we can't get previous cell bounds
        transitionPercent = 0.9;
      } else {
        const distanceBetweenCenters = Math.sqrt(
          Math.pow(cellBounds.centerX - prevBounds.centerX, 2) +
          Math.pow(cellBounds.centerY - prevBounds.centerY, 2)
        );

        const halfDistance = distanceBetweenCenters / 2;  // Distance from center to edge
        const transitionEndDistance = halfDistance * 0.5;  // End at 50% of way from edge to center
        const transitionRange = halfDistance - transitionEndDistance;  // Transition zone width

        if (distanceFromCurrentCenter > transitionEndDistance) {
          // Still in transition zone (between edge and 50% mark)
          const distanceFromEdge = halfDistance - distanceFromCurrentCenter;
          const progressInZone = Math.max(0, distanceFromEdge);
          transitionPercent = 0.5 + (progressInZone / transitionRange) * 0.4;
          transitionPercent = Math.min(0.9, Math.max(0.5, transitionPercent));
        } else {
          // Reached the 50% mark - fully settled
          transitionPercent = 0.9;
        }
      }

      // Check if we've reached the 50% mark (settled)
      if (transitionPercent >= 0.89) {
        playerState.transitionPhase = 'settled';
        playerState.currentWeather = currentCell.weather;
        playerState.previousCell = null;
        playerState.targetNeighborCell = null;
        playerState.targetWeather = null;

        console.log(
          `[Transition] Settled at 50% mark in cell (${playerState.currentCell.x}, ${playerState.currentCell.y}). ` +
          `Weather: ${playerState.currentWeather}`
        );

        return {
          currentWeather: playerState.currentWeather,
          neighborWeather: null,
          currentVariant: currentCell.variant,
          neighborVariant: null,
          transitionPercent: 0.0,
          shouldApply: false
        };
      }
    } else {
      // Settled - no transition
      return {
        currentWeather: currentCell.weather,
        neighborWeather: null,
        currentVariant: currentCell.variant,
        neighborVariant: null,
        transitionPercent: 0.0,
        shouldApply: false
      };
    }

    return {
      currentWeather: playerState.currentWeather,
      neighborWeather: playerState.targetWeather,
      currentVariant: currentCell.variant,
      neighborVariant: targetNeighborCell.variant,
      transitionPercent: transitionPercent,
      shouldApply: true
    };
  }

  /**
   * Get the neighbor cell based on heading direction
   */
  private getNeighborFromHeading(
    currentCell: { x: number; y: number },
    heading: number
  ): { x: number; y: number; weather: WeatherType } | null {
    let dirX = 0;
    let dirY = 0;

    // Convert heading to direction (RDR2 uses CCW heading: 0 = North, 90 = West, 180 = South, 270 = East)
    if (heading >= 337.5 || heading < 22.5) {
      dirX = 0; dirY = 1; // N
    } else if (heading >= 22.5 && heading < 67.5) {
      dirX = -1; dirY = 1; // NW
    } else if (heading >= 67.5 && heading < 112.5) {
      dirX = -1; dirY = 0; // W
    } else if (heading >= 112.5 && heading < 157.5) {
      dirX = -1; dirY = -1; // SW
    } else if (heading >= 157.5 && heading < 202.5) {
      dirX = 0; dirY = -1; // S
    } else if (heading >= 202.5 && heading < 247.5) {
      dirX = 1; dirY = -1; // SE
    } else if (heading >= 247.5 && heading < 292.5) {
      dirX = 1; dirY = 0; // E
    } else if (heading >= 292.5 && heading < 337.5) {
      dirX = 1; dirY = 1; // NE
    }

    const neighborX = currentCell.x + dirX;
    const neighborY = currentCell.y + dirY;

    // Check if neighbor is within grid bounds
    const gridDimensions = this.weatherGrid.getCellDimensions();
    const gridWidth = Math.round(gridDimensions.totalWidth / gridDimensions.cellWidth);
    const gridHeight = Math.round(gridDimensions.totalHeight / gridDimensions.cellHeight);

    if (neighborX < 0 || neighborX >= gridWidth || neighborY < 0 || neighborY >= gridHeight) {
      return null; // No neighbor in this direction
    }

    // Get neighbor cell bounds to find center, then get weather at that position
    const neighborBounds = this.weatherGrid.getCellBounds(neighborX, neighborY);
    if (!neighborBounds) {
      return null;
    }

    const neighborCell = this.weatherGrid.getCellAtPosition(neighborBounds.centerX, neighborBounds.centerY);

    return {
      x: neighborX,
      y: neighborY,
      weather: neighborCell.weather
    };
  }

  private applyWeatherToPlayer(weatherInfo: {
    currentWeather: WeatherType;
    neighborWeather: WeatherType | null;
    currentVariant: string | null;
    neighborVariant: string | null;
    transitionPercent: number;
    biome: BiomeType;
  }): void {
    const { currentWeather: newCurrent, neighborWeather: newNeighbor, currentVariant, neighborVariant, transitionPercent, biome } = weatherInfo;
    
    // Check if this is a meaningful update
    const weatherChanged = newCurrent !== this.currentWeather || newNeighbor !== this.neighborWeather;
    const percentChanged = Math.abs(transitionPercent - this.lastTransitionPercent) > 0.00000001; // 0.000001% threshold

    // If same weather on both sides, treat as 0.9 (fully in current weather)
    let effectivePercent = transitionPercent;
    if (newCurrent === newNeighbor || newNeighbor === null) {
      // effectivePercent = 0.9; // Fully transitioned to current weather
      return;
    }
    
    // Only update if something changed
    if (weatherChanged || percentChanged) {
      const biomeName = BiomeNames[biome] || biome;
      
      console.log(
        `Weather update: ${newCurrent} -> ${newNeighbor || 'none'} ` +
        `(${(effectivePercent * 100).toFixed(8)}%) in ${biomeName}`
      );
      Log(`Weather update: ${newCurrent} -> ${newNeighbor || 'none'} ` +
        `(${effectivePercent} :=> ${(effectivePercent * 100).toFixed(8)}%) in ${biomeName}`)
      
      // Update state
      this.currentWeather = newCurrent;
      this.neighborWeather = newNeighbor;
      this.lastTransitionPercent = transitionPercent;

      // Apply weather transition using SetCurrWeatherState
      if (WeatherHashes[this.currentWeather] !== undefined) {
        const oldWeatherHash = WeatherHashes[this.currentWeather];
        const newWeatherHash = this.neighborWeather && WeatherHashes[this.neighborWeather] !== undefined
          ? WeatherHashes[this.neighborWeather]
          : oldWeatherHash;
        
        // Use SetCurrWeatherState for smooth transitions
        // SetCurrWeatherState(oldWeather, newWeather, percent, useTransition)
        SetWeatherOwnedByNetwork(false);
        SetCurrWeatherState(oldWeatherHash, newWeatherHash, effectivePercent, true);

        // Apply weather variants if they exist
        if (currentVariant) {
          SetWeatherVariation(this.currentWeather, currentVariant);
        }
        if (neighborVariant && this.neighborWeather) {
          SetWeatherVariation(this.neighborWeather, neighborVariant);
        }
      }
    }
  }

  public checkWeather(): void {
    const playerPed = PlayerPedId();
    const coords = GetEntityCoords(playerPed, false);
    const [x, y, z] = coords;
    const heading = GetEntityHeading(playerPed);

    const playerState = this.playerWeatherStates.get(playerPed);

    if (!playerState) {
      console.log('No weather state tracked for player yet');
      return;
    }

    const biomeName = BiomeNames[playerState.biome] || playerState.biome;

    console.log('========================================');
    console.log('WEATHER INFORMATION');
    console.log('========================================');
    console.log(`Position: ${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}`);
    console.log(`Heading: ${heading.toFixed(1)}°`);
    console.log(`Current Cell: (${playerState.currentCell.x}, ${playerState.currentCell.y})`);
    console.log(`Current Biome: ${biomeName}`);
    console.log(`Current Weather: ${playerState.currentWeather}`);
    console.log(`Target Weather: ${playerState.targetWeather || 'None'}`);
    console.log(`Target Cell: ${playerState.targetNeighborCell ? `(${playerState.targetNeighborCell.x}, ${playerState.targetNeighborCell.y})` : 'None'}`);
    console.log(`Transition Phase: ${playerState.transitionPhase}`);
    console.log(`Transition Percent: ${(playerState.transitionPercent * 100).toFixed(2)}%`);
    console.log('========================================');
  }

  /**
   * Generate an alternating checkerboard pattern of SUNNY and RAIN for testing
   * This creates high contrast weather transitions for visual verification
   */
  public generateTestPattern(): void {
    if (!this.weatherGrid) {
      console.error('Weather grid not initialized');
      return;
    }

    const grid = this.weatherGrid.getGrid();

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        // Checkerboard pattern: alternating based on (x + y) % 2
        const isEven = (x + y) % 2 === 0;
        const weatherType = isEven ? WeatherType.SUNNY : WeatherType.RAIN;
        const cellBiome = grid[y][x].biome;
        grid[y][x].weather = weatherType;

        // Assign a biome-appropriate variant if available
        const biomeVariants = BiomeWeatherVariants[cellBiome]?.[weatherType];
        let selectedVariant: string | null = null;

        if (biomeVariants && biomeVariants.length > 0) {
          selectedVariant = biomeVariants[Math.floor(Math.random() * biomeVariants.length)];
        } else {
          // Fall back to general variants
          const variants = WeatherVariants[weatherType];
          if (variants && variants.length > 0) {
            selectedVariant = variants[Math.floor(Math.random() * variants.length)];
          }
        }

        grid[y][x].variant = selectedVariant;
      }
    }

    // Update the grid
    this.weatherGrid.setGrid(grid);

    console.log('========================================');
    console.log('TEST PATTERN GENERATED');
    console.log('========================================');
    console.log('Weather grid set to alternating SUNNY/RAIN pattern');
    console.log('SUNNY cells: even (x+y) positions');
    console.log('RAIN cells: odd (x+y) positions');
    console.log('Move between cells to test transitions!');
    console.log('========================================');
  }

  public getWeatherGrid(): BiomeWeatherGrid {
    return this.weatherGrid;
  }

  public setAllCellsToWeatherType(weatherType: WeatherType): void {
    if (!this.weatherGrid) {
      console.error('Weather grid not initialized');
      return;
    }

    if (!WeatherHashes[weatherType]) {
      console.error(`Invalid weather type: ${weatherType}`);
      return;
    }
    
    const grid = this.weatherGrid.getGrid();
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        grid[y][x].weather = weatherType;
      }
    }
    this.weatherGrid.setGrid(grid);
    console.log(`All cells set to weather type: ${weatherType}`);
  }
}

const weatherManager = ClientWeatherManager.getInstance();

export default weatherManager;