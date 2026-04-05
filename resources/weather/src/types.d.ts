declare interface ClientExports {
  weather: Weather.ClientExports;
}

declare namespace Weather {
  type getCurrentWeather = () => string | null;
  type getTargetWeather = () => string | null;
  type getCurrentBiome = () => string | null;
  type getTransitionProgress = () => number;
  type isTransitioning = () => boolean;
  type getBiomeName = (biome: string) => string;

  type ClientExports = {
    getCurrentWeather: getCurrentWeather;
    getTargetWeather: getTargetWeather;
    getCurrentBiome: getCurrentBiome;
    getTransitionProgress: getTransitionProgress;
    isTransitioning: isTransitioning;
    getBiomeName: getBiomeName;
  };
}
