declare namespace Inventory {}

declare namespace SocketServer {
  interface SocketEvents {
    'inventory.set-hat-item-id': (hatNetworkId: number, itemId: number) => void;
  }
}
