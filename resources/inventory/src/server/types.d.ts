declare namespace Inventory {}

// Server perspective - events sent to socket
declare namespace ServerOut {
  interface ToSocket {
    'inventoryAddItem': (inventoryId: string, itemId: number, quantity: number, metadata: any, callback: (success: boolean) => void) => void;
    'inventory.pickup-hat': (serverId: number, itemId: number) => void;
  }
}

// Server perspective - events received from client
declare namespace ServerIn {
  interface FromClient {
    'inventory.pickup-hat': (hatNetId: number) => void;
  }
}

// Server perspective - events received from socket
declare namespace ServerIn {
  interface FromSocket {
    'inventory.set-hat-item-id': (hatNetworkId: number, itemId: number) => void;
  }
}

// Extend the base ServerEvents
declare namespace SocketServer {
  interface ServerEvents extends ServerOut.ToSocket {}
  interface SocketEvents extends ServerIn.FromSocket {}
}
