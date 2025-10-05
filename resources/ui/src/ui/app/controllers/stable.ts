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

  // onClientCall('stable.save-horse', (horseData) => {
  //   return new Promise((resolve) => {
  //     socket.emit('stable.save-horse', horseData, (data) => {
  //       resolve(data);
  //     });
  //   });
  // });
  //
  // onClientCall('stable.breed-horses', (horseId1, horseId2) => {
  //   return new Promise((resolve) => {
  //     socket.emit('stable.breed-horses', horseId1, horseId2, (data) => {
  //       resolve(data);
  //     });
  //   });
  // });
  //
  // onClientCall('stable.can-birth-foal', (horseId) => {
  //   return new Promise((resolve) => {
  //     socket.emit('stable.can-birth-foal', horseId, (data) => {
  //       resolve(data);
  //     });
  //   });
  // });

  type socketForward = keyof SocketIn.FromClient;

  const forwards: socketForward[] = ['stable.save-horse', 'stable.breed-horses', 'stable.can-birth-foal'];

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
