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
