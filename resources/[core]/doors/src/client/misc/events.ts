import { PVGame } from '@lib/client';
import { emitSocket } from '@lib/client/comms/ui';
import { Delay, lerp } from '@lib/functions';
import { Vector3 } from '@lib/math';

import doorManager from '../managers/door-manager';
import { doorOpenAnim } from './anim-tasks';

const toggleDoor = async (doorHash: number) => {
  if (Math.abs(DoorSystemGetOpenRatio(doorHash)) > 0.15) {
    doorManager.closeDoor(doorHash, 0.25);
  }

  const doorEntity = doorManager.getDoorEntity(doorHash);

  if (doorEntity) {
    const keyholeCoords = Vector3.fromArray(GetOffsetFromEntityInWorldCoords(doorEntity, 1.0, 0.0, 1.0));
    const angleTo = PVGame.getAngleTo(keyholeCoords);
    if (angleTo > 20) {
      await PVGame.turnPedToFaceCoord(
        PVGame.playerPed(),
        keyholeCoords.x,
        keyholeCoords.y,
        keyholeCoords.z,
        lerp(250, 750, angleTo / 180),
      );
      await Delay(lerp(125, 250, angleTo / 180));
    }
  }

  PVGame.taskPlayAnim(doorOpenAnim);
  await doorManager.toggleDoorState(doorHash);
};

on('doors:client:toggle_door', async (item: Inventory.ItemBase, itemData: UI.Inventory.ItemData) => {
  console.log('doors:client:toggle_door', item, itemData);
  for (const metadata of itemData.metadatas) {
    let closestDoorHash = metadata.doorHash;
    let distance = doorManager.getDoorDistance(metadata.doorHash);
    for (const doorHash of metadata.doorHashes || []) {
      const curDistance = doorManager.getDoorDistance(doorHash);
      console.log('Checking door hash', doorHash, 'distance', curDistance);
      if (curDistance < distance) {
        closestDoorHash = doorHash;
        distance = curDistance;
      }
    }

    console.log('distance', distance);

    if (distance < 2.5) {
      await toggleDoor(closestDoorHash);
    }

    let keyWasUsed = false;
    for (const doorHashes of metadata.linkedDoors || []) {
      if (doorHashes.length === 0) {
        continue;
      }
      const distance = doorManager.getDoorDistance(doorHashes[0]);
      const curState = doorManager.getDoorState(doorHashes[0]);
      if (distance < 2.5) {
        await toggleDoor(doorHashes.shift());
        for (const doorHash of doorHashes) {
          if (doorManager.getDoorState(doorHash) === curState) {
            await doorManager.toggleDoorState(doorHash);
            keyWasUsed = true;
          }
        }
      }
    }

    if (keyWasUsed) {
      emitSocket('inventory.item-wear', itemData.ids[0]);
    }
  }
});
