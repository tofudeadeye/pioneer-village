import { emitSocket, onClient, onSocket } from '@lib/server';

import hatManager from './managers/hat-manager';

RegisterCommand(
  'giveItem',
  (source: number, args: string[], rawCommand: string) => {
    const characterId = Number(args[0]);
    const itemId = GetHashKey(args[1]);

    emitSocket(
      'inventoryAddItem',
      `character:${characterId}`,
      itemId,
      Number(args[2] ?? 1),
      {},
      (success: boolean) => {},
    );
  },
  false,
);

RegisterCommand(
  'giveDoorKey',
  async (source: number, args: string[], rawCommand: string) => {
    const characterId = Number(args[0]);
    const itemId = GetHashKey('PV_DOOR_KEY');

    const metadata: { name?: string; doorHashes?: number[]; doorHash?: number } = {};

    if (args[1].includes(',')) {
      metadata.doorHashes = args[1].split(',').map((doorHash) => Number(doorHash) << 0);
    } else {
      metadata.doorHash = Number(args[1]) << 0;
    }

    if (args[2]) {
      metadata.name = args[2];
    }

    emitSocket('inventoryAddItem', `character:${characterId}`, itemId, 1, metadata, (success: boolean) => {});
  },
  false,
);

onSocket('inventory.set-hat-item-id', (hatNetworkId, itemId) => {
  console.log('inventory.set-hat-item-id', hatNetworkId, itemId);
  hatManager.registerHatByNetId(itemId, hatNetworkId);
});

onSocket('inventory.delete-hat-by-item-id', (itemId) => {
  console.log('inventory.delete-hat-by-item-id', itemId);
  hatManager.deleteHatByItemId(itemId);
});
