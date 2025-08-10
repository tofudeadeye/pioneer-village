import { emitSocket, onClient, onSocket } from '@lib/server';

RegisterCommand(
  'giveItem',
  (source: number, args: string[], rawCommand: string) => {
    const characterId = Number(args[0]);
    const itemId = GetHashKey(args[1]);

    emitSocket('inventoryAddItem', `character:${characterId}`, itemId, Number(args[2] ?? 1), {}, (success: boolean) => {
      console.log('success', success);
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
      console.log('success', success);
    });
  },
  false,
);

onClient('inventory.pickup-hat', (hatNetId) => {
  console.log(`Player picked up a hat with network ID: ${hatNetId}`);

  const hatEntity = NetworkGetEntityFromNetworkId(hatNetId);
  const hat = Entity(hatEntity);

  const itemId = hat.state.hatItemId;
  console.log(`Hat Item ID: ${itemId}`);

  emitSocket('inventory.pickup-hat', source, itemId);
});

onSocket('inventory.set-hat-item-id', (hatNetworkId, itemId) => {
  const hatEntity = NetworkGetEntityFromNetworkId(hatNetworkId);

  console.log(`Hat Entity: ${hatEntity}`);
  const coords = GetEntityCoords(hatEntity);
  console.log(`Hat Coords: ${coords[0]}, ${coords[1]}, ${coords[2]}`);

  Entity(hatEntity).state.set('hatItemId', itemId, true);
});
