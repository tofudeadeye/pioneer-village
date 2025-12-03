import { exports } from '@lib/client';

import ptfxManager from './managers/ptfx-manager';

export const startPtfxAtCoords: World.StartPtfxAtCoords = async (id, looped, dict, name, coords, rot, scale) => {
  return ptfxManager.startFxAtCoords(id, looped, dict, name, coords, rot, scale);
};

export const stopFx: World.StopPtfx = (id) => {
  ptfxManager.stopFx(id);
};

export const setFxEvolution: World.SetFxEvolution = (id, name, value) => {
  ptfxManager.setFxEvolution(id, name, value);
};

export const setFxEvolutions: World.SetFxEvolutions = (id, evolutions) => {
  ptfxManager.setFxEvolutions(id, evolutions);
};

exports<'world'>('startPtfxAtCoords', startPtfxAtCoords);
exports<'world'>('stopFx', stopFx);
exports<'world'>('setFxEvolution', setFxEvolution);
exports<'world'>('setFxEvolutions', setFxEvolutions);
