import { logInfoC } from '../helpers';
import pigeons from '../managers/birds';
import characters from '../managers/characters';
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

      const senderCoords = await characters.getLastCoords(characterId);
      const receiverCoords = await characters.getLastCoords(receiverCharacterId);

      const receiverChar = characters.getActiveCharacterForCharacterId(receiverCharacterId);
      const isReceiverOnline = receiverChar && receiverChar.source !== -1 && !receiverChar.offline;

      let destCoords = receiverCoords;
      if (!isReceiverOnline || (receiverCoords.x === 0 && receiverCoords.y === 0 && receiverCoords.z === 0)) {
        const { findNearestPostOffice } = await import('../../../lib/shared/post-offices');
        const nearestPO = findNearestPostOffice(senderCoords.x, senderCoords.y);
        destCoords = nearestPO.coords;
      }

      const result = await pigeons.sendPigeon({
        pigeonItemId,
        birdType: 'pigeon',
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
        userNamespace.emit('__client__', 'carrier-birds.send-animation', characterId, 'pigeon');
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
