import { logInfoC } from '../helpers';
import weatherManager, { toBiomeType, toWeatherType, BiomeType } from '../managers/weather';
import { userNamespace } from '../server';

export default () => {
  weatherManager.initialize();

  // Evolve weather every 5 minutes (if not frozen)
  setInterval(() => {
    if (!weatherManager.isWeatherFrozen() && !weatherManager.getGlobalWeatherOverride()) {
      weatherManager.evolveWeather();
      const grid = weatherManager.getBiomeWeatherGrid().getGrid();
      userNamespace.emit('__client__', 'weather.grid-update', grid);
    }
  }, 5 * 60 * 1000);

  userNamespace.on('connection', (socket) => {
    logInfoC('[Weather]', 'User connected', socket.id, socket.data);

    socket.on('weather.request-grid', (cb = () => {}) => {
      cb({ grid: weatherManager.getBiomeWeatherGrid().getGrid() });
    });

    socket.on('weather.admin.get-grid-state', (cb = () => {}) => {
      cb({
        grid: weatherManager.getBiomeWeatherGrid().getGrid(),
        frozen: weatherManager.isWeatherFrozen(),
        globalOverride: weatherManager.getGlobalWeatherOverride(),
      });
    });

    socket.on('weather.admin.set-biome-weather', (biome: string, weather: string, cb = () => {}) => {
      const biomeType = toBiomeType(biome);
      const weatherType = toWeatherType(weather);

      if (!biomeType) {
        cb({ success: false, error: `Invalid biome type: ${biome}` });
        return;
      }

      if (!weatherType) {
        cb({ success: false, error: `Invalid weather type: ${weather}` });
        return;
      }

      const updatedCount = weatherManager.getBiomeWeatherGrid().overrideBiomeWeather(biomeType, weatherType);

      if (updatedCount > 0) {
        const grid = weatherManager.getBiomeWeatherGrid().getGrid();
        userNamespace.emit('__client__', 'weather.grid-update', grid);
      }

      cb({ success: updatedCount > 0, updatedCount });
    });

    socket.on('weather.admin.regenerate-grid', (seed: number | undefined, cb = () => {}) => {
      if (seed !== undefined && !Number.isFinite(seed)) {
        cb({ success: false, error: 'Seed must be a finite number' });
        return;
      }

      weatherManager.regenerateGrid(seed);

      const grid = weatherManager.getBiomeWeatherGrid().getGrid();
      userNamespace.emit('__client__', 'weather.grid-update', grid);

      cb({ success: true });
    });

    socket.on('weather.admin.freeze-weather', (frozen: boolean, cb = () => {}) => {
      weatherManager.freezeWeather(frozen);

      userNamespace.emit('__client__', 'weather.freeze-state', frozen);

      cb({ success: true });
    });

    socket.on('weather.admin.force-global', (weather: string | null, cb = () => {}) => {
      let weatherType = null;

      if (weather !== null) {
        weatherType = toWeatherType(weather);
        if (!weatherType) {
          cb({ success: false, error: `Invalid weather type: ${weather}` });
          return;
        }
      }

      weatherManager.forceGlobalWeather(weatherType);

      userNamespace.emit('__client__', 'weather.global-override', weatherType);

      cb({ success: true });
    });
  });
};
