import { BiomeType } from '../shared/biome';
import weatherManager from '../shared/weather';
import { LogToUI } from '@lib/server/comms/client';
import { onClientCall } from '@lib/server';

import './commands';

// Initialize weather system on resource start
on('onResourceStart', (resourceName: string) => {
  if (GetCurrentResourceName() === resourceName) {
    weatherManager.initialize();
  }
});

onClientCall('weather.request-grid', async () => {
  const playerId = global.source;
  LogToUI(`Requested weather grid for player ${playerId}`);
  const grid = weatherManager.getBiomeWeatherGrid().getGrid();
  LogToUI(`Weather grid size: ${grid.length}x${grid[0].length}`);
  LogToUI(`Total Biomes: ${grid.flatMap(row => row.map(cell => cell.biome)).filter((value, index, self) => self.indexOf(value) === index).length}`);

  const biomes = grid.flatMap(row => row.map(cell => cell.biome));
  for (const biome of Object.values(BiomeType)) {
    const count = biomes.filter(b => b === biome).length;
    LogToUI(`  ${biome}: ${count} cells (${((count / biomes.length) * 100).toFixed(1)}%)`);
  }

  console.log(`Player ${playerId} requested weather grid`);
  return grid;
});

/**
 * Broadcast grid update to all clients
 * Called when server-side grid changes need to be synced to all players
 */
export function broadcastGridUpdate(): void {
  const grid = weatherManager.getBiomeWeatherGrid().getGrid();
  console.log('Broadcasting weather grid update to all clients');
  emitNet('weather:grid-update', -1, grid);
}

/**
 * Check if player has weather admin permission
 */
function hasWeatherAdminPermission(source: number): boolean {
  return source === 0 || IsPlayerAceAllowed(source, 'weather.admin');
}

// Weather Admin RPC Handlers

onClientCall('weather.admin.get-grid-state', async () => {
  const playerId = global.source;

  if (!hasWeatherAdminPermission(playerId)) {
    console.warn(`Player ${playerId} attempted to access weather admin without permission`);
    throw new Error('Permission denied');
  }

  return {
    grid: weatherManager.getGridState(),
    frozen: weatherManager.isWeatherFrozen(),
    globalOverride: weatherManager.getGlobalWeatherOverride()
  };
});

onClientCall('weather.admin.set-biome-weather', async (biome: BiomeType, weather: WeatherType) => {
  const playerId = global.source;

  if (!hasWeatherAdminPermission(playerId)) {
    console.warn(`Player ${playerId} attempted to use weather admin without permission`);
    throw new Error('Permission denied');
  }

  console.log(`[Weather Admin] Player ${playerId} setting ${biome} to ${weather}`);
  const grid = weatherManager.getBiomeWeatherGrid();
  const updatedCount = grid.overrideBiomeWeather(biome, weather);

  if (updatedCount > 0) {
    broadcastGridUpdate();
  }

  return { success: updatedCount > 0, updatedCount };
});

onClientCall('weather.admin.regenerate-grid', async (seed?: number) => {
  const playerId = global.source;

  if (!hasWeatherAdminPermission(playerId)) {
    console.warn(`Player ${playerId} attempted to use weather admin without permission`);
    throw new Error('Permission denied');
  }

  console.log(`[Weather Admin] Player ${playerId} regenerating grid${seed ? ` with seed ${seed}` : ''}`);
  weatherManager.regenerateGrid(seed);
  broadcastGridUpdate();

  return { success: true };
});

onClientCall('weather.admin.freeze-weather', async (frozen: boolean) => {
  const playerId = global.source;

  if (!hasWeatherAdminPermission(playerId)) {
    console.warn(`Player ${playerId} attempted to use weather admin without permission`);
    throw new Error('Permission denied');
  }

  console.log(`[Weather Admin] Player ${playerId} ${frozen ? 'froze' : 'unfroze'} weather`);
  weatherManager.freezeWeather(frozen);
  emitNet('weather:freeze-state', -1, frozen);

  return { success: true };
});

onClientCall('weather.admin.force-global', async (weather: WeatherType | null) => {
  const playerId = global.source;

  if (!hasWeatherAdminPermission(playerId)) {
    console.warn(`Player ${playerId} attempted to use weather admin without permission`);
    throw new Error('Permission denied');
  }

  console.log(`[Weather Admin] Player ${playerId} setting global override to ${weather || 'none'}`);
  weatherManager.forceGlobalWeather(weather);
  emitNet('weather:global-override', -1, weather);

  return { success: true };
});
