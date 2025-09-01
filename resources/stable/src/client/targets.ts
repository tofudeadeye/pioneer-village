import { PVGame, PVTarget, PVZone, onResourceInit } from '@lib/client';
import { Log } from '@lib/client/comms/ui';

import StableData from '../shared/data/stableData';
import { ZonePrefix } from './config';
import stableController from './controllers/stable-controller';

const registerTargets = async () => {
  // Generic horse actions
  PVTarget.AddTarget({
    id: 'stable::horse_generic',
    type: 'flag',
    group: ['isHorse'],
    data: [
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
      throttle: 1_000,
      isEnabled(data) {
        const horseId = DecorGetInt(data.entity, 'stable::horse.id');
        if (horseId) {
          return !stableController.isStabled(horseId);
        }
        return !IsPedLeadingHorse(data.playerPed) && GetVehicleDraftHorseIsAttachedTo(data.entity) === 0;
      },
    },
  });
  PVTarget.AddTarget({
    id: 'stable::horse_drink',
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
    ],
    options: {
      distance: 3.0,
      throttle: 1_000,
      isEnabled(data) {
        return GetVehicleDraftHorseIsAttachedTo(data.entity) === 0 && IsEntityInWater(data.entity);
      },
    },
  });

  // Actions for horses in a stable zone.
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
        if (!stableController.currentStable) {
          return false;
        }
        const horseId = DecorGetInt(data.entity, 'stable::horse.id');
        if (!horseId) {
          return false;
        }
        if (stableController.isStabled(horseId)) {
          return false;
        }
        for (const stable of StableData) {
          if (PVZone.IsEntityInZone(`${ZonePrefix}${stable.identifier}`, data.entity)) {
            return true;
          }
        }
        return false;
      },
    },
  });

  // Actions for horses in a stable zone.
  PVTarget.AddTarget({
    id: 'stable::unstable_horse',
    type: 'flag',
    group: ['isHorse'],
    data: [
      {
        id: 'stable::unstable_horse',
        label: 'Unstable Horse',
        icon: 'garage',
        event: 'stable:client:unstable-horse',
        parameters: {},
      },
    ],
    options: {
      distance: 5.0,
      throttle: 1_000,
      isEnabled(data) {
        if (!stableController.currentStable) {
          return false;
        }
        const horseId = DecorGetInt(data.entity, 'stable::horse.id');
        if (!horseId) {
          return false;
        }
        if (!stableController.isStabled(horseId)) {
          return false;
        }
        return true;
      },
    },
  });

  // Horses and wagon interactions.
  // PVTarget.AddTarget({
  //   id: 'stable::horse_wagon',
  //   type: 'flag',
  //   group: ['isHorse'],
  //   data: [
  //     {
  //       id: 'horse_detach',
  //       label: 'Detach from Wagon',
  //       icon: 'lasso',
  //       event: 'stable:client:detach',
  //       parameters: {},
  //     },
  //   ],
  //   options: {
  //     distance: 3.0,
  //     throttle: 1_000,
  //     isEnabled(data) {
  //       return GetVehicleDraftHorseIsAttachedTo(data.entity) !== 0;
  //     },
  //   },
  // });
  // PVTarget.AddTarget({
  //   id: 'stable::horse_wagon_detached',
  //   type: 'flag',
  //   group: ['isHorse'],
  //   data: [
  //     {
  //       id: 'horse_detach',
  //       label: 'Attach to Wagon',
  //       icon: 'lasso',
  //       event: 'stable:client:attach',
  //       parameters: {},
  //     },
  //   ],
  //   options: {
  //     distance: 3.0,
  //     throttle: 1_000,
  //     isEnabled(data) {
  //       return true;
  //       // return (
  //       //   GetVehicleDraftHorseIsAttachedTo(data.entity) === 0 &&
  //       //   GetLastVehicleDraftHorseWasAttachedTo(data.entity) !== 0
  //       // );
  //     },
  //   },
  // });
};

onResourceInit('target', registerTargets);

RegisterCommand(
  'female_horse',
  async (source: number, args: any[], rawCommand: string) => {
    // Log({ source, args, rawCommand });
    PVGame.makeHorseFemale(Number(args[0]));
  },
  false,
);
