import { Socket } from 'socket.io-client';
import { onClientCall } from '@lib/ui';

export default (socket: Socket<SocketIO.Events, SocketIn.FromClient & SocketOut.ToClient>) => {
  onClientCall('world.registered-objects', () => {
    return new Promise((resolve) => {
      socket.emit('world.registered-objects', (data) => {
        resolve(data);
      });
    });
  });
  onClientCall('world.request-creation', (name) => {
    return new Promise((resolve) => {
      socket.emit('world.request-creation', name, (success) => {
        resolve(success);
      });
    });
  });
  onClientCall('world.load-state', (name) => {
    return new Promise((resolve) => {
      socket.emit('world.load-state', name, (state) => {
        resolve(state);
      });
    });
  });
};
