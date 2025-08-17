import { Socket } from 'socket.io-client';

import { onClientCall } from '@lib/ui';

export default (socket: Socket<SocketIO.Events, SocketIn.FromClient & SocketOut.ToClient>) => {
  onClientCall('stable.load-character-horses', (characterId) => {
    console.log(`Loading horses for character ID: ${characterId}`);
    return new Promise((resolve) => {
      socket.emit('stable.load-character-horses', characterId, (data) => {
        resolve(data);
      });
    });
  });

  onClientCall('stable.save-horse', (horseData) => {
    return new Promise((resolve) => {
      socket.emit('stable.save-horse', horseData, (data) => {
        resolve(data);
      });
    });
  });
};
