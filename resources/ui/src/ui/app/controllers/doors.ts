import { Socket } from 'socket.io-client';
import { onClientCall } from '@lib/ui';

export default (socket: Socket<SocketIO.Events, SocketIn.FromClient & SocketOut.ToClient>) => {
  onClientCall('doors.get-door-states', () => {
    return new Promise((resolve) => {
      socket.emit('doors.get-door-states', (data) => {
        resolve(data);
      });
    });
  });
};
