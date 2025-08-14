import { Socket } from 'socket.io-client';

import { emitClient } from '@lib/ui';

export default (socket: Socket<SocketOut.ToClient, SocketIn.FromClient>) => {
  // Only forward world-inventories event that isn't handled by the store
  socket.on('inventory.world-inventories', (inventories) => {
    emitClient('inventory.world-inventories', inventories);
  });
  
  // Note: All other inventory socket events are now handled by the inventory store
  // The store handles: inventory.load, inventory.item-add, inventory.item-move, 
  // inventory.success, inventory.fail, inventory.item-wear, inventory.open-world
};
