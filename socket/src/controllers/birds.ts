import PVItems from '../../../lib/shared/items';
import { findNearestPostOffice } from '../../../lib/shared/post-offices';
import { logInfoC } from '../helpers';
import pigeons from '../managers/birds';
import characters from '../managers/characters';
import inventories from '../managers/inventories';
import { userNamespace } from '../server';

export default () => {
  pigeons.init();

  userNamespace.on('connection', (socket) => {
    logInfoC('[Pigeons]', 'User connected', socket.id, socket.data);

    socket.on('carrier-birds.send', async (pigeonItemId, receiverCharacterId, cb = () => {}) => {
      const characterId = socket.data?.character?.id;
      if (!characterId) {
        cb({ success: false, error: 'No character data' });
        return;
      }

      if (!(await characters.doesCharacterIdExist(receiverCharacterId))) {
        cb({ success: false, error: 'Destination charater does not exist' });
        return;
      }

      const available = await pigeons.isBirdAvailable(pigeonItemId);
      if (!available) {
        cb({ success: false, error: 'Bird not available' });
        return;
      }

      // Look up the item to determine bird type
      const item = await inventories.getItem(pigeonItemId);
      if (!item) {
        cb({ success: false, error: 'Bird item not found' });
        return;
      }
      const itemDef = PVItems[item.identifier];
      const birdType = (itemDef?.birdType || 'pigeon') as CarrierBirds.BirdTypes;

      const senderCoords = await characters.getLastCoords(characterId);
      const receiverCoords = await characters.getLastCoords(receiverCharacterId);

      const receiverChar = characters.getActiveCharacterForCharacterId(receiverCharacterId);
      const isReceiverOnline = receiverChar && receiverChar.source !== -1 && !receiverChar.offline;

      let destCoords = receiverCoords;
      if (!isReceiverOnline || (receiverCoords.x === 0 && receiverCoords.y === 0 && receiverCoords.z === 0)) {
        const nearestPO = findNearestPostOffice(receiverCoords.x, receiverCoords.y);
        destCoords = nearestPO.coords;
      }

      const result = await pigeons.sendPigeon({
        pigeonItemId,
        birdType,
        ownerId: characterId,
        receiverId: receiverCharacterId,
        originX: senderCoords.x,
        originY: senderCoords.y,
        originZ: senderCoords.z,
        destX: destCoords.x,
        destY: destCoords.y,
        destZ: destCoords.z,
      });

      if (result.success) {
        const birdEvent: CarrierBirds.BirdEvent = {
          type: 'send',
          characterId,
          birdType,
          birdInventoryId: pigeonItemId,
        };
        userNamespace.emit('__client__', 'carrier-birds.event', birdEvent);
        userNamespace.emit('carrier-birds.event', birdEvent);
      }

      cb(result);
    });

    socket.on('carrier-birds.get-active', async (cb = () => {}) => {
      const characterId = socket.data?.character?.id;
      if (!characterId) {
        cb([]);
        return;
      }

      const deliveries = await pigeons.getActiveDeliveries(characterId);
      cb(deliveries);
    });
  });
};
