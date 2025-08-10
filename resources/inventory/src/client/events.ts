import { Log, onSocket } from '@lib/client/comms/ui';

import worldManager from './managers/world-manager';

onSocket('inventory.world-inventories', (inventories) => {
  Log('inventories', inventories);
  worldManager.setInventories(inventories);
});
