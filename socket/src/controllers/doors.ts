import { eq } from 'drizzle-orm';

import { db } from '../db/connection';
import { DoorSchema } from '../db/schema';
import { logInfo, logInfoC, logInfoS } from '../helpers';
import Inventories from '../managers/inventories';
import { serverNamespace, userNamespace } from '../server';

// TODO: Ability to re-key doors via a version number or something.

export default () => {
  const DoorState = new Map<number, number>();

  db.select()
    .from(DoorSchema)
    .then((doors) => {
      // logInfo('[doors]', doors);

      for (const doorRecord of doors) {
        DoorState.set(doorRecord.hash << 0, doorRecord.state || -1);
        // logInfo('[Door State]', doorRecord.hash, doorRecord.hash >>> 0, doorRecord.state);
      }
    });

  serverNamespace.on('connection', (socket) => {
    //
  });

  userNamespace.on('connection', (socket) => {
    socket.on('doors.get-door-states', (cb) => {
      cb(Array.from(DoorState.entries()));
    });

    socket.on('doors.set-door-state', async (doorHash, state) => {
      logInfoC('doors.set-door-state', doorHash, state);
      if (state < -1 || state > 4) {
        return;
      }
      let currentDoorState = DoorState.get(doorHash);
      if (currentDoorState === state) {
        return;
      }

      if (currentDoorState === undefined) {
        await db.insert(DoorSchema).values({
          hash: doorHash << 0,
          state,
        });
      }

      const inventoryIdentifier = `character:${socket.data?.character?.id || 0}`;
      let hasKey = await Inventories.hasDoorKey(inventoryIdentifier, doorHash);
      if (hasKey || currentDoorState === undefined) {
        DoorState.set(doorHash << 0, state);
        userNamespace.emit('__client__', 'doors.set-door-state', doorHash, state);
        // TODO: Update DB
      } else {
        userNamespace.emit('__client__', 'doors.set-door-state', doorHash, currentDoorState);
      }
    });
  });
};
