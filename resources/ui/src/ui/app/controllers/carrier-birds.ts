import { Socket } from 'socket.io-client';

import { onClientCall } from '@lib/ui';

export default (socket: Socket<SocketOut.ToClient, SocketIn.FromClient>) => {
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
