declare namespace SocketServer {
  interface Server {
    createInventory: (identifier: string, inventoryType: number, callback: (inventory: boolean) => void) => void;
    inventoryAddItem: (
      identifier: string,
      itemId: number,
      amount: number,
      metadata: Record<string, any>,
      callback: (success: boolean) => void,
    ) => void;
    'inventory.item-wear': (itemId: number, callback: (success: boolean) => void) => void;
    'inventory.set-hat-item-id': (hatNetworkId: number, itemId: number, callback: (success: boolean) => void) => void;
    'inventory.pickup-hat': (source: number, itemId: number, callback: (success: boolean) => void) => void;
    'base.force-coords-update': (serverId: number, callback: (coords: Vector3Format) => void) => void;
    'world.net-id-exists': (id: number, callback: (valid: boolean) => void) => void;
  }

  interface ServerEvents {
    inventoryAddItem: (
      identifier: string,
      itemId: number,
      amount: number,
      metadata: Record<string, any>,
      callback: (success: boolean) => void,
    ) => void;
    'inventory.item-wear': (itemId: number) => void;
    'inventory.set-hat-item-id': (hatNetworkId: number, itemId: number) => void;
    'base.force-coords-update': (serverId: number) => void;
    'world.net-id-exists': (id: number) => void;
  }

  interface Client {
    'inventory.world-inventories': (inventories: string[]) => void;
  }

  interface ClientEvents {
    'inventory.subscribe': (identifier: string) => void;
    'inventory.unsubscribe': (identifier: string) => void;
    'inventory.subscribe-world': () => void;
    'inventory.item-stack': (
      requestId: number,
      oldIdentifier: string,
      oldSlot: number,
      newIdentifier: string,
      newSlot: number,
    ) => void;
    'inventory.item-move': (
      requestId: number,
      oldIdentifier: string,
      oldSlot: number,
      newIdentifier: string,
      newSlot: number,
    ) => void;
    'inventory.world-inventories': (inventories: string[]) => void;
    'inventory.item-drop': (requestId: number, identifier: string, slot: number) => void;
    'inventory.item-wear': (itemId: number) => void;
    'inventory.lost-hat': (hatNetId: number, coords: Vector3) => void;
    'inventory.check-world': () => void;
  }
}
