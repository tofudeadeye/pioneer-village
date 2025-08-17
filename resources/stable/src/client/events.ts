import { PVGame, PVZone } from '@lib/client';

import stables from '../shared/data/stables';
import { ZonePrefix } from './config';
import stableController from './controllers/stable-controller';

on('stable:client:lead', (pEntity: number, pArgs: Record<string, any>) => {
  console.log('stable:client:lead', pEntity, pArgs);
  TaskLeadHorse(PVGame.playerPed(), pEntity);
});

on('stable:client:stable-horse', (pEntity: number, pArgs: Record<string, any>) => {
  console.log('stable:client:stable-horse', pEntity, pArgs);
  const horseId = DecorGetInt(pEntity, 'stable::horse.id');
  if (!horseId) {
    return;
  }

  for (const stable of stables) {
    if (PVZone.IsEntityInZone(`${ZonePrefix}${stable.identifier}`, pEntity)) {
      stableController.stableHorse(horseId, stable.identifier);
      break;
    }
  }
});
