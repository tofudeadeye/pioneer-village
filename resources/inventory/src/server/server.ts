import { emitSocket, onClient, onSocket } from '@lib/server';

RegisterCommand(
  'giveItem',
  (source: number, args: string[], rawCommand: string) => {
    const characterId = Number(args[0]);
    const itemId = GetHashKey(args[1]);

    emitSocket('inventoryAddItem', `character:${characterId}`, itemId, Number(args[2] ?? 1), {}, (success: boolean) => {
    });
  },
  false,
);

RegisterCommand(
  'giveDoorKey',
  (source: number, args: string[], rawCommand: string) => {
    const characterId = Number(args[0]);
    const itemId = GetHashKey('PV_DOOR_KEY');

    const metadata: { doorHashes?: number[]; doorHash?: number } = {};

    if (args[1].includes(',')) {
      metadata.doorHashes = args[1].split(',').map((doorHash) => Number(doorHash) << 0);
    } else {
      metadata.doorHash = Number(args[1]) << 0;
    }

    emitSocket('inventoryAddItem', `character:${characterId}`, itemId, 1, metadata, (success: boolean) => {
    });
  },
  false,
);

onClient('inventory.pickup-hat', (hatNetId) => {
  const hatEntity = NetworkGetEntityFromNetworkId(hatNetId);
  const hat = Entity(hatEntity);

  const itemId = hat.state.hatItemId;

  emitSocket('inventory.pickup-hat', source, itemId);
});

onSocket('inventory.set-hat-item-id', (hatNetworkId, itemId) => {
  const hatEntity = NetworkGetEntityFromNetworkId(hatNetworkId);

  const coords = GetEntityCoords(hatEntity);

  Entity(hatEntity).state.set('hatItemId', itemId, true);
});
