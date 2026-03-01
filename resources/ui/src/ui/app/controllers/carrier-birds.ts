import { Socket } from 'socket.io-client';

import { emitClient, onClientCall } from '@lib/ui';

export default (socket: Socket<SocketOut.ToClient, SocketIn.FromClient>) => {
  socket.on('carrier-birds.send-animation', (characterId, birdType) => {
    emitClient('carrier-birds.send-animation', characterId, birdType);
  });

  socket.on('carrier-birds.arrive', (characterId, birdType) => {
    emitClient('carrier-birds.arrive', characterId, birdType);
  });

  socket.on('carrier-birds.return', (characterId, birdType) => {
    emitClient('carrier-birds.return', characterId, birdType);
  });

  type SocketForward = keyof SocketIn.FromClient;

  const forwards: SocketForward[] = ['carrier-birds.send', 'carrier-birds.get-active'];

  for (const forward of forwards) {
    // @ts-ignore
    onClientCall(forward, (...args) => {
      return new Promise((resolve) => {
        // @ts-ignore
        socket.emit(forward, ...args, (data) => {
          resolve(data);
        });
      });
    });
  }
};
