import { Log, onSocket } from '@lib/client/comms/ui';

import worldManager from './managers/world-manager';

onSocket('inventory.world-inventories', (inventories) => {
  Log('inventories', inventories);
  worldManager.setInventories(inventories);
});

// PVTarget Events
on('inventory:open-world', (objectId: string) => {
  Log('Opening world inventory', objectId);
  worldManager.openWorldInventory(Number(objectId));
});
