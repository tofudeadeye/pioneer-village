import './test'
import weatherManager from './managers/weather';
import { WeatherType } from '../shared/biome';
import { Vector3 } from '@lib/math';

const oldCoords = Vector3.fromArray([0, 0, 0])

setInterval(() => {
  const playerPed = PlayerPedId();
  if (playerPed && playerPed !== 0) {
    const [cX, cY, cZ] = GetEntityCoords(playerPed, false);
    const heading = GetEntityHeading(playerPed);
    const coords = Vector3.fromArray([cX, cY, cZ]);
    const distance = Vector3.fromObject(oldCoords).getDistance(coords);

    // arbitrary distance threshold to prevent excessive updates - adjust as needed
    if (distance > 5) {
      oldCoords.setFromObject(coords);
      weatherManager.calculateIfWeatherShouldTransition(coords.x, coords.y, heading);
    }

    // todo: should we periodically check for weather grid updates from server?
  }
}, 1000); // Check every 1 second

// Create a checkerboard test pattern for debugging, alternating between two weather types SUNNY & RAIN
// Useful when running in conjunction with the 'togglegrid' command to verify grid updates and transitions.
RegisterCommand('weather:test', () => {
  weatherManager.generateTestPattern();
}, false);

// Show the current weather grid in the console for debugging purposes
RegisterCommand('weather:check', () => {
  weatherManager.checkWeather();
}, false);

RegisterCommand('weather:force', async (source: number, args: any[], rawCommand: string) => {
  const wType = args[0]?.toUpperCase();
  if (typeof wType !== 'string') {
    console.log('Invalid weather type. Usage: /weather:force2 <WEATHER_TYPE>');
    return;
  }

  console.log(`Forcing all grid cells to weather type: ${wType}`);
  weatherManager.setAllCellsToWeatherType(wType as WeatherType);
  SetOverrideWeather(wType);
}, false);

// Request the current weather grid from the server, resetting any forced weather
RegisterCommand('weather:sync', () => {
  weatherManager.requestWeatherGrid();
}, false);
