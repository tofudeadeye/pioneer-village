import weatherManager from '../shared/weather';
import { toWeatherType, toBiomeType, BiomeType, WeatherType } from '../shared/biome';
import { broadcastGridUpdate } from './server';

/**
 * Admin command: Override weather for a specific biome
 * Usage: /biomeweather <BIOME> <WEATHER_TYPE>
 * Example: /biomeweather GRIZZLIES SNOW
 */
RegisterCommand(
  'biomeweather',
  (source: number, args: string[], rawCommand: string) => {
    if (source === 0 || IsPlayerAceAllowed(source, 'weather.admin')) {
      if (!weatherManager) {
        console.error('Weather manager not initialized');
        return;
      }

      if (args.length < 2) {
        const message = 'Usage: /biomeweather <BIOME> <WEATHER_TYPE>\nExample: /biomeweather GRIZZLIES SNOW';
        if (source !== 0) {
          emitNet('chat:addMessage', source, {
            args: ['Weather System', message],
          });
        } else {
          console.log(message);
        }
        return;
      }

      const biomeStr = args[0].toUpperCase();
      const weatherStr = args[1].toUpperCase();

      // Validate biome type
      const biome = toBiomeType(biomeStr);
      if (!biome) {
        const validBiomes = Object.values(BiomeType).join(', ');
        const message = `Invalid biome: ${biomeStr}\nValid biomes: ${validBiomes}`;
        if (source !== 0) {
          emitNet('chat:addMessage', source, {
            args: ['Weather System', message],
          });
        } else {
          console.log(message);
        }
        return;
      }

      // Validate weather type
      const weather = toWeatherType(weatherStr);
      if (!weather) {
        const validWeathers = Object.values(WeatherType).join(', ');
        const message = `Invalid weather type: ${weatherStr}\nValid weather types: ${validWeathers}`;
        if (source !== 0) {
          emitNet('chat:addMessage', source, {
            args: ['Weather System', message],
          });
        } else {
          console.log(message);
        }
        return;
      }

      // Override biome weather
      const grid = weatherManager.getBiomeWeatherGrid();
      const updatedCount = grid.overrideBiomeWeather(biome, weather);

      if (updatedCount > 0) {
        const message = `Successfully updated ${updatedCount} cells in ${biome} to ${weather}`;
        console.log(message);

        if (source !== 0) {
          emitNet('chat:addMessage', source, {
            args: ['Weather System', message],
          });
        }

        // Broadcast update to all clients
        broadcastGridUpdate();
      } else {
        const message = `Failed to update biome weather. Weather ${weather} may not be allowed in ${biome}.`;
        console.warn(message);

        if (source !== 0) {
          emitNet('chat:addMessage', source, {
            args: ['Weather System', message],
          });
        }
      }
    } else {
      emitNet('chat:addMessage', source, {
        args: ['System', 'You do not have permission to use this command'],
      });
    }
  },
  false
);

/**
 * Admin command: View weather grid
 */
RegisterCommand(
  'weathergrid',
  (source: number, args: string[], rawCommand: string) => {
    if (source === 0 || IsPlayerAceAllowed(source, 'weather.admin')) {
      if (!weatherManager) {
        console.error('Weather manager not initialized');
        return;
      }

      console.log('\n========== WEATHER GRID ==========');
      weatherManager.printState();
      console.log('==================================\n');

      if (source !== 0) {
        emitNet('chat:addMessage', source, {
          args: ['Weather System', 'Weather grid printed to server console'],
        });
      }
    } else {
      emitNet('chat:addMessage', source, {
        args: ['System', 'You do not have permission to use this command'],
      });
    }
  },
  false
);

/**
 * Admin command: View biome grid
 */
RegisterCommand(
  'biomegrid',
  (source: number, args: string[], rawCommand: string) => {
    if (source === 0 || IsPlayerAceAllowed(source, 'weather.admin')) {
      if (!weatherManager) {
        console.error('Weather manager not initialized');
        return;
      }

      console.log('\n========== BIOME GRID ==========');
      const biomeManager = weatherManager.getBiomeManager();
      biomeManager.printBiomeMap(8, 8);
      console.log('================================\n');

      if (source !== 0) {
        emitNet('chat:addMessage', source, {
          args: ['Weather System', 'Biome grid printed to server console'],
        });
      }
    } else {
      emitNet('chat:addMessage', source, {
        args: ['System', 'You do not have permission to use this command'],
      });
    }
  },
  false
);

/**
 * Player command: Check current biome
 */
RegisterCommand(
  'checkbiome',
  (source: number, args: string[], rawCommand: string) => {
    if (source === 0) return;

    if (!weatherManager) {
      emitNet('chat:addMessage', source, {
        args: ['Weather System', 'Weather manager not initialized'],
      });
      return;
    }

    try {
      const playerPed = GetPlayerPed(source);
      const coords = GetEntityCoords(playerPed);
      const [x, y] = coords;

      const biomeManager = weatherManager.getBiomeManager();
      const biome = biomeManager.getBiomeAtPosition(x, y);
      const allowedWeathers = biomeManager.getAllowedWeatherForBiome(biome);

      emitNet('chat:addMessage', source, {
        args: ['Weather System', `Current Biome: ${biome}`],
      });

      emitNet('chat:addMessage', source, {
        args: ['Weather System', `Allowed Weather: ${allowedWeathers.join(', ')}`],
      });
    } catch (error) {
      console.error('Error in checkbiome command:', error);
    }
  },
  false
);

/**
 * Admin command: Show weather statistics
 */
RegisterCommand(
  'weatherstats',
  (source: number, args: string[], rawCommand: string) => {
    if (source === 0 || IsPlayerAceAllowed(source, 'weather.admin')) {
      if (!weatherManager) {
        console.error('Weather manager not initialized');
        return;
      }

      const gridState = weatherManager.getGridState();

      // Count weather types and biomes
      const weatherCounts: Record<string, number> = {};
      const biomeCounts: Record<string, number> = {};
      let total = 0;

      gridState.forEach((row) => {
        row.forEach((cell) => {
          total++;

          // Count weather
          weatherCounts[cell.weather] = (weatherCounts[cell.weather] || 0) + 1;

          // Count biomes
          biomeCounts[cell.biome] = (biomeCounts[cell.biome] || 0) + 1;
        });
      });

      console.log('\n========== WEATHER STATISTICS ==========');
      console.log(`Total cells: ${total}`);
      console.log('\nWeather Distribution:');

      Object.entries(weatherCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([weather, count]) => {
          const percentage = ((count / total) * 100).toFixed(1);
          console.log(`  ${weather}: ${count} cells (${percentage}%)`);
        });

      console.log('\nBiome Distribution:');
      Object.entries(biomeCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([biome, count]) => {
          const percentage = ((count / total) * 100).toFixed(1);
          console.log(`  ${biome}: ${count} cells (${percentage}%)`);
        });
      console.log('========================================\n');

      if (source !== 0) {
        emitNet('chat:addMessage', source, {
          args: ['Weather System', 'Statistics printed to server console'],
        });
      }
    } else {
      emitNet('chat:addMessage', source, {
        args: ['System', 'You do not have permission to use this command'],
      });
    }
  },
  false
);
