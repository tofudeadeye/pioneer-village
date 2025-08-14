import { Socket } from 'socket.io-client';
import { onClientCall } from '@lib/ui';

export default (socket: Socket<SocketIO.Events, SocketIn.FromClient & SocketOut.ToClient>) => {
  onClientCall('stable.load-character-horses', (characterId) => {
    return new Promise((resolve) => {
      socket.emit('stable.load-character-horses', characterId, (data) => {
        resolve(data);
      });
    });
  });
};
