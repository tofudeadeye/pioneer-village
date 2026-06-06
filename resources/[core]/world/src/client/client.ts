import { PVGame } from '@lib/client';
import { Delay } from '@lib/functions';

import './cellar-doors';
import './exports';
import './world-events';

const SET_COORD_ROT_MAX_ATTEMPTS = 40; // 40 * 50ms = 2s window for the entity to stream in
const SET_COORD_ROT_RETRY_MS = 50;

const applyCoordRot = async (netId: number, coord: Vector3Format, rot: Vector3Format): Promise<void> => {
  console.log(`[World:Client] set-coord-rot received: netId=${netId}`);
  // The server emits this right after CreateObject, but network replication to the owning
  // client is not instant — the netId may not resolve to an entity for a few frames.
  let entityId = NetworkGetEntityFromNetworkId(netId);
  let attempts = 0;
  while (entityId === 0 && attempts < SET_COORD_ROT_MAX_ATTEMPTS) {
    await Delay(SET_COORD_ROT_RETRY_MS);
    entityId = NetworkGetEntityFromNetworkId(netId);
    attempts++;
  }

  if (entityId === 0) {
    console.warn(`[World:Client] set-coord-rot: net id ${netId} never streamed in after ${attempts} attempts`);
    return;
  }

  console.log(`[World:Client] set-coord-rot: netId=${netId} resolved to entity=${entityId} after ${attempts} attempts`);

  // SetEntityRotation only sticks if this client has control of the entity. The server targets
  // the owner, but control can lag behind a fresh stream-in, so confirm it before applying.
  await PVGame.getNetworkControlOfEntity(entityId);

  SetEntityCoords(entityId, coord.x, coord.y, coord.z, false, false, false, false);
  SetEntityRotation(entityId, rot.x, rot.y, rot.z, 0, false);
  console.log(`[World:Client] set-coord-rot: applied rotation to entity=${entityId}`);
};

onNet('world.set-coord-rot', (netId: number, coord: Vector3Format, rot: Vector3Format) => {
  applyCoordRot(netId, coord, rot);
});
