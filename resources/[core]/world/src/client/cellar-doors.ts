import { PVGame, PVTarget, onResourceInit } from '@lib/client';
import { emitSocket } from '@lib/client/comms/ui';
import { Delay } from '@lib/functions';
import { Vector3 } from '@lib/math';

import worldController from './controllers/world-controller';

const DOOR_L_NAME = 'serial::cellar-door-l';
const DOOR_R_NAME = 'serial::cellar-door-r';
const ANIM_DICT = 'script_rc@sklr@ig@ig1_opendoor';

const setDoorOpen = (open: boolean) => {
  const doorLeft = worldController.getEntity(DOOR_L_NAME);
  const doorRight = worldController.getEntity(DOOR_R_NAME);
  if (doorLeft) Entity(doorLeft).state.set('open', open, true);
  if (doorRight) Entity(doorRight).state.set('open', open, true);
  emitSocket('world.update-state', DOOR_L_NAME, { open });
  emitSocket('world.update-state', DOOR_R_NAME, { open });
};

const isDoorOpen = (entity: number | undefined): boolean => {
  if (!entity) return false;
  return Entity(entity).state.open === true;
};

// Snap a door to its fully-open pose without playing the swing. Used when a door streams in
// already-open (restored from persisted state) so the player sees the end state, not the animation.
const snapDoorOpen = (entity: number) => {
  console.log('Snapping door open for entity', entity);
  PVGame.taskPlayEntityAnim([
    {
      obj: entity,
      dict: ANIM_DICT,
      anim:
        GetEntityModel(entity) === GetHashKey('P_CS_LUC_BASEDR')
          ? 'arthur_open_doors_luc_basedr_l_door'
          : 'arthur_open_doors_luc_basedr_r_door',
      delta: 0.9,
      stayInAnim: true,
      flags: 32768,
    },
  ]);
};

// Track which door entities we've already restored, so we only snap once per spawn.
const restoredDoors: Set<number> = new Set();

const restoreDoorStates = () => {
  for (const name of [DOOR_L_NAME, DOOR_R_NAME]) {
    const entity = worldController.getEntity(name);
    if (!entity || !DoesEntityExist(entity)) {
      restoredDoors.delete(entity ?? -1);
      continue;
    }
    if (restoredDoors.has(entity)) continue;

    if (isDoorOpen(entity)) {
      snapDoorOpen(entity);
    }
    restoredDoors.add(entity);
  }
};

setInterval(restoreDoorStates, 1_000);

const registerTargets = () => {
  PVTarget.AddTarget({
    id: 'open_cellar',
    type: 'model',
    group: [GetHashKey('P_CS_LUC_BASEDR'), GetHashKey('P_CS_LUC_BASEDR_1')],
    data: [
      {
        id: 'open_cellar',
        label: 'Open Cellar',
        icon: 'door-open',
        event: 'world:client:open-cellar',
      },
    ],
    options: {
      distance: 3.0,
      isEnabled(data) {
        if (!data.entity) return false;
        return !isDoorOpen(data.entity);
      },
    },
  });
  PVTarget.AddTarget({
    id: 'close_cellar',
    type: 'model',
    group: [GetHashKey('P_CS_LUC_BASEDR'), GetHashKey('P_CS_LUC_BASEDR_1')],
    data: [
      {
        id: 'close_cellar',
        label: 'Close Cellar',
        icon: 'door-closed',
        event: 'world:client:close-cellar',
      },
    ],
    options: {
      distance: 3.0,
      isEnabled(data) {
        if (!data.entity) return false;
        return isDoorOpen(data.entity);
      },
    },
  });
};

onResourceInit('target', registerTargets);

on('world:client:open-cellar', async (_pEntity: number, _pArgs: Record<string, any>) => {
  setDoorOpen(true);
  const animOffset = { x: -0.03258881, y: -1.82538, z: 0.7651197 };

  const doorLeft = worldController.getEntity(DOOR_L_NAME);
  const doorRight = worldController.getEntity(DOOR_R_NAME);
  if (!doorLeft || !doorRight) return;

  console.log('Attempting to get control of doors');
  await PVGame.getNetworkControlOfEntity(doorLeft);
  await PVGame.getNetworkControlOfEntity(doorRight);
  await Delay(10);
  await PVGame.getNetworkControlOfEntity(doorLeft);
  await PVGame.getNetworkControlOfEntity(doorRight);
  console.log('Got control of doors');
  console.log('Starting door open anim');

  const coords = Vector3.fromArray(
    GetOffsetFromEntityInWorldCoords(doorLeft, animOffset.x, animOffset.y, animOffset.z),
  );
  coords.z -= 1.0;
  const doorRot = Vector3.fromArray(GetEntityRotation(doorLeft, 2));
  const rot = new Vector3(0.0, 0.0, doorRot.z);
  rot.z -= 40.0;

  TaskGoToCoordAnyMeans(PVGame.playerPed(), coords.x, coords.y, coords.z, 1.5, 0, false, 0, 0);
  await PVGame.reachedCoords(coords, 0.5);

  if (PVGame.playerCoords().z > 96.0) {
    PVGame.taskPlayAnimAdvArray(coords.toObject(), rot.toObject(), [
      {
        dict: ANIM_DICT,
        anim: 'arthur_open_doors_arthur',
        delta: 0.0,
        duration: 1150,
      },
      {
        dict: ANIM_DICT,
        anim: 'arthur_open_doors_arthur',
        delta: 0.4666,
        additional: [
          {
            obj: doorLeft,
            anim: 'arthur_open_doors_luc_basedr_l_door',
            stayInAnim: true,
            flags: 32768,
          },
          {
            obj: doorRight,
            anim: 'arthur_open_doors_luc_basedr_r_door',
            stayInAnim: true,
            flags: 32768,
          },
        ],
      },
    ]);
  } else {
    PVGame.taskPlayEntityAnim([
      {
        obj: doorLeft,
        dict: ANIM_DICT,
        anim: 'arthur_open_doors_luc_basedr_l_door',
        delta: 0.635,
        stayInAnim: true,
        flags: 32768,
      },
      {
        obj: doorRight,
        dict: ANIM_DICT,
        anim: 'arthur_open_doors_luc_basedr_r_door',
        delta: 0.4666,
        stayInAnim: true,
        flags: 32768,
      },
    ]);
  }
});

on('world:client:close-cellar', async (_pEntity: number, _pArgs: Record<string, any>) => {
  setDoorOpen(false);

  const doorLeft = worldController.getEntity(DOOR_L_NAME);
  const doorRight = worldController.getEntity(DOOR_R_NAME);
  if (!doorLeft || !doorRight) return;

  console.log('Attempting to get control of doors');
  await PVGame.getNetworkControlOfEntity(doorLeft);
  await PVGame.getNetworkControlOfEntity(doorRight);
  await Delay(10);
  await PVGame.getNetworkControlOfEntity(doorLeft);
  await PVGame.getNetworkControlOfEntity(doorRight);
  console.log('Got control of doors');
  console.log('Starting door open anim');

  PVGame.taskPlayEntityAnim([
    {
      obj: doorLeft,
      dict: ANIM_DICT,
      anim: 'enter_closed_doors_luc_basedr_l_door',
      stayInAnim: true,
      flags: 32768,
    },
    {
      obj: doorRight,
      dict: ANIM_DICT,
      anim: 'enter_closed_doors_luc_basedr_r_door',
      stayInAnim: true,
      flags: 32768,
    },
  ]);
});
