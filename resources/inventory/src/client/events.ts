import { onSocket } from '@lib/client/comms/ui';

import worldManager from './managers/world-manager';

onSocket('inventory.world-inventories', (inventories) => {
  console.log('inventories', inventories);
  worldManager.setInventories(inventories);
});

// PVTarget Events
on('inventory:open-world', (objectId: string) => {
  console.log('Opening world inventory', objectId);
  worldManager.openWorldInventory(Number(objectId));
});
