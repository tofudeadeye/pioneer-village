import './test'
import weatherManager from './managers/weather';
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

/**
 * Debug command to check current weather and biome
 */
RegisterCommand(
  'checkweather',
  () => {
    weatherManager.checkWeather();
  },
  false
);
