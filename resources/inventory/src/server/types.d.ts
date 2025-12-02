declare namespace Inventory {}

// Server perspective - events sent to socket
declare namespace ServerOut {
  interface ToSocket {
    inventoryAddItem: (
      inventoryId: string,
      itemId: number,
      quantity: number,
      metadata: any,
      callback: (success: boolean) => void,
    ) => void;
  }
}

// Server perspective - events received from client
declare namespace ServerIn {
  interface FromClient {
    //
  }
}

// Server perspective - events received from socket
declare namespace ServerIn {
  interface FromSocket {
    'inventory.set-hat-item-id': (hatNetworkId: number, itemId: number) => void;
    'inventory.delete-hat-by-item-id': (itemId: number) => void;
  }
}

// Extend the base ServerEvents
declare namespace SocketServer {
  interface ServerEvents extends ServerOut.ToSocket {}
  interface SocketEvents extends ServerIn.FromSocket {}
}
