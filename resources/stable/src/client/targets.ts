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
      },
    ],
    options: {
      distance: 3.0,
      throttle: 1_000,
      isEnabled(data) {
        if (!data.entity || !data.playerPed) return false;
        const horseId = DecorGetInt(data.entity, 'horseId');
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
      },
    ],
    options: {
      distance: 3.0,
      throttle: 1_000,
      isEnabled(data) {
        if (!data.entity) return false;
        return GetVehicleDraftHorseIsAttachedTo(data.entity) === 0 && IsEntityInWater(data.entity);
      },
    },
  });

  PVTarget.AddTarget({
    id: 'stable::pelt_remove',
    type: 'flag',
    group: ['isHorse'],
    data: [
      {
        id: 'pelt_remove',
        label: 'Remove Pelt',
        icon: 'paw',
        event: 'stable:client:remove-pelt',
      },
    ],
    options: {
      distance: 3.0,
      throttle: 1_000,
      isEnabled(data) {
        if (!data.entity || !data.playerPed) return false;
        const horseState = Entity(data.entity).state;
        const horsePelts = horseState.pelts || [];

        if (horsePelts.length === 0) {
          return false;
        }

        if (GetFirstEntityPedIsCarrying(data.playerPed) || !IsPedOnFoot(data.playerPed)) {
          return false;
        }

        return true;
      },
    },
  });

  PVTarget.AddTarget({
    id: 'stable::horse_birth',
    type: 'flag',
    group: ['isHorse'],
    data: [
      {
        id: 'horse_birth',
        label: 'Birth Foal',
        icon: 'horse',
        event: 'stable:client:birth_foal',
      },
    ],
    options: {
      distance: 3.0,
      throttle: 1_000,
      isEnabled(data) {
        const horseId = data.entity && Entity(data.entity).state.horseId;
        // Log('Horse ID:', horseId);
        if (!horseId) {
          return false;
        }
        // Log('Is horse stabled?', stableController.isStabled(horseId));
        if (stableController.isStabled(horseId)) {
          return false;
        }

        const progress = stableController.pregnancyProgress(horseId);
        if (progress === null || progress < 1) {
          return false;
        }

        return true;
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
      },
    ],
    options: {
      distance: 3.0,
      throttle: 1_000,
      isEnabled(data) {
        Log('stableController.currentStable', stableController.currentStable);
        if (!data.entity || !stableController.currentStable) {
          return false;
        }
        const horseId = Entity(data.entity).state.horseId;
        Log('Horse ID:', horseId);
        if (!horseId) {
          return false;
        }
        Log('Is horse stabled?', stableController.isStabled(horseId));
        if (stableController.isStabled(horseId)) {
          return false;
        }
        Log('Checking zones for entity:', data.entity);
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
      },
    ],
    options: {
      distance: 5.0,
      throttle: 1_000,
      isEnabled(data) {
        if (!data.entity || !stableController.currentStable) {
          return false;
        }
        const horseId = DecorGetInt(data.entity, 'horseId');
        if (!horseId) {
          return false;
        }
        return stableController.isStabled(horseId);
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
