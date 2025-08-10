declare namespace SocketServer {
  interface SocketEvents {
    'world.net-id-exists': (id: number) => void;
  }
}

declare namespace World {}
