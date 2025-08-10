import { Socket } from 'socket.io-client';

import { emitClient } from '@lib/ui';

export default (socket: Socket<UISocketEvents, SocketServer.Client & SocketServer.ClientEvents>) => {
  socket.on('inventory.world-inventories', (inventories) => {
    emitClient('inventory.world-inventories', inventories);
  });
};
