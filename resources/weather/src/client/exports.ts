import { exports } from '@lib/client';

import { BiomeNames, BiomeType, WeatherType } from '../shared/biome';
import weatherManager from './managers/weather';

const getCurrentWeather: Weather.getCurrentWeather = (): WeatherType | null => {
  const states = weatherManager['playerWeatherStates'];
  const playerPed = PlayerPedId();
  const state = states.get(playerPed);
  return state?.currentWeather ?? null;
};

const getTargetWeather: Weather.getTargetWeather = (): WeatherType | null => {
  const states = weatherManager['playerWeatherStates'];
  const playerPed = PlayerPedId();
  const state = states.get(playerPed);
  return state?.targetWeather ?? null;
};

const getCurrentBiome: Weather.getCurrentBiome = (): BiomeType | null => {
  const states = weatherManager['playerWeatherStates'];
  const playerPed = PlayerPedId();
  const state = states.get(playerPed);
  return state?.biome ?? null;
};

const getTransitionProgress: Weather.getTransitionProgress = (): number => {
  const states = weatherManager['playerWeatherStates'];
  const playerPed = PlayerPedId();
  const state = states.get(playerPed);
  return state?.transitionPercent ?? 0;
};

const isTransitioning: Weather.isTransitioning = (): boolean => {
  const states = weatherManager['playerWeatherStates'];
  const playerPed = PlayerPedId();
  const state = states.get(playerPed);
  return state?.transitionPhase !== 'settled';
};

const getBiomeName: Weather.getBiomeName = (biome: string): string => {
  return BiomeNames[biome as BiomeType] || biome;
};

exports<'weather'>('getCurrentWeather', getCurrentWeather);
exports<'weather'>('getTargetWeather', getTargetWeather);
exports<'weather'>('getCurrentBiome', getCurrentBiome);
exports<'weather'>('getTransitionProgress', getTransitionProgress);
exports<'weather'>('isTransitioning', isTransitioning);
exports<'weather'>('getBiomeName', getBiomeName);
