import { Socket } from 'socket.io-client';
import { emitClient, onClientCall } from '@lib/ui';

export default (socket: Socket<SocketOut.ToClient, SocketIn.FromClient>) => {
  socket.on('weather.grid-update', (grid) => {
    emitClient('weather.grid-update', grid);
  });

  socket.on('weather.freeze-state', (frozen) => {
    emitClient('weather.freeze-state', frozen);
  });

  socket.on('weather.global-override', (weather) => {
    emitClient('weather.global-override', weather);
  });

  type SocketForward = keyof SocketIn.FromClient;

  const forwards: SocketForward[] = [
    'weather.request-grid',
    'weather.admin.get-grid-state',
    'weather.admin.set-biome-weather',
    'weather.admin.regenerate-grid',
    'weather.admin.freeze-weather',
    'weather.admin.force-global',
  ];

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
