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

// Create a checkerboard test pattern for debugging, alternating between two weather types
// SUNNY and RAINY. Useful when running in conjunction with the 'togglegrid' command to verify grid updates and transitions.
RegisterCommand('weather:test', () => {
  weatherManager.generateTestPattern();
}, false);

// Show the current weather grid in the console for debugging purposes
RegisterCommand('weather:check', () => {
  weatherManager.checkWeather();
}, false);

// Set all grid cells to a specific weather type for testing purposes. Usage: /weather:force SUNNY
RegisterCommand('weather:force', (args: string[]) => {
  const weatherType = args[0]?.toUpperCase();
  if (weatherType && Object.values(WeatherType).includes(weatherType as WeatherType)) {
    weatherManager.setAllCellsToWeatherType(weatherType as WeatherType);
    SetOverrideWeather(weatherType);
  }
}, false);

// Request the current weather grid from the server.
RegisterCommand('weather:sync', () => {
  weatherManager.requestWeatherGrid();
}, false);
