import { PVTarget, PVZone, onResourceInit } from '@lib/client';
import { Log } from '@lib/client/comms/ui';

import stables from '../shared/data/stables';
import { ZonePrefix } from './config';

const registerTargets = async () => {
  PVTarget.AddTarget({
    id: 'stable::horse_generic',
    type: 'flag',
    group: ['isHorse'],
    data: [
      {
        id: 'horse_drink',
        label: 'Drink',
        icon: 'water',
        event: 'stable:client:drink',
        parameters: {},
      },
      {
        id: 'horse_lead',
        label: 'Lead',
        icon: 'lasso',
        event: 'stable:client:lead',
        parameters: {},
      },
    ],
    options: {
      distance: 3.0,
    },
  });
  PVTarget.AddTarget({
    id: 'stable::stable_horse',
    type: 'flag',
    group: ['isHorse'],
    data: [
      {
        id: 'stable::stable_horse',
        label: 'Stable Horse',
        icon: 'garage',
        event: 'stable:client:stable-horse',
        parameters: {},
      },
    ],
    options: {
      distance: 3.0,
      throttle: 1_000,
      isEnabled(data) {
        const horseId = DecorGetInt(data.entity, 'stable::horse.id');
        if (!horseId) {
          return false;
        }
        for (const stable of stables) {
          if (PVZone.IsEntityInZone(`${ZonePrefix}${stable.identifier}`, data.entity)) {
            return true;
          }
        }
        return false;
      },
    },
  });
};

onResourceInit('target', registerTargets);
