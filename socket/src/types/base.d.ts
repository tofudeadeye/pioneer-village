// Socket perspective - what the socket server receives
declare namespace SocketIn {
  interface FromGameServer {
    'base.force-coords-update': (serverId: number, callback: (coords: Vector3Format) => void) => void;
    'base.connected-players': (players: Base.PlayerInfo[]) => void;
  }
  
  interface FromClient {
    // No base events from client currently
  }
}

// Socket perspective - what the socket server sends
declare namespace SocketOut {
  interface ToGameServer {
    'base.connected-players': (players: Base.PlayerInfo[]) => void;
    'base.player-coords': (serverId: number, coords: Vector3Format) => void;
    'base.force-coords-update': (serverId: number) => void;
  }
  
  interface ToClient {
    // Events already defined in main types.d.ts
  }
}

// Keep backward compatibility during migration
declare namespace SocketServer {
  interface Server extends SocketIn.FromGameServer {}
  interface ServerEvents extends SocketOut.ToGameServer {}
  interface Client extends SocketOut.ToClient {}
  interface ClientEvents extends SocketIn.FromClient {}
}