interface ServerExports {
  base: Base.ServerExports;
}

// Removed SocketServer.SocketEvents - events now defined in centralized socket types
// 'player-management.kick' is defined in SocketInternal.Events
// 'base.force-coords-update' is defined in SocketOut.ToGameServer

declare namespace Base {
  type ServerExports = {
    emitSocket: emitSocket;
    awaitSocket: awaitSocket;
    onSocket: onSocketBase;
    socketConnected: () => boolean;
  };

  type emitSocket = <T extends keyof SocketServer.ServerEvents>(
    evtName: T,
    ...params: Parameters<SocketServer.ServerEvents[T]>
  ) => void;

  type awaitSocket = <
    T extends keyof {
      [K in keyof SocketServer.Server]: LastParam<SocketServer.Server[K]> extends () => any ? T : never;
    },
  >(
    evtName: T,
    ...params: DropLastParam<SocketServer.Server[T]>
  ) => Promise<LastParam<SocketServer.Server[T]>>;

  type onSocket = <T extends keyof SocketServer.SocketEvents>(
    evtName: T,
    callback: SocketServer.SocketEvents[T],
  ) => void;

  type onSocketBase = <T extends keyof SocketServer.SocketEvents>(
    resourceName: string,
    evtName: T,
    callback: SocketServer.SocketEvents[T],
  ) => void;

  type PlayerInfo = {
    serverId: number;
    coords?: Vector3Format;
  };
}

// Server perspective - RPC calls to various destinations
declare namespace ServerRPC {
  interface Socket {
    ['base.get-player-info']: (serverId: number) => Base.PlayerInfo;
  }
  interface Client {
    ['base.request-network-control']: (serverId: number, entity: number) => boolean;
  }
}

// Server perspective - events received from various sources
declare namespace ServerIn {
  interface FromSocket {
    ['player-management.kick']: SocketInternal.Events['player-management.kick'];
    ['base.force-coords-update']: SocketOut.ToGameServer['base.force-coords-update'];
  }
  interface FromClient {
    ['base.entity-deleted']: (entity: number) => void;
    ['base.entities-deleted']: (entities: number[]) => void;
  }
}

// Server perspective - events sent to various destinations
declare namespace ServerOut {
  interface ToSocket {
    ['base.player-update']: (playerInfo: Base.PlayerInfo) => void;
    ['character-update.last-position']: (serverId: number, coords: Vector3Format) => void;
    ['character-event.disconnected']: (serverId: number) => void;
  }
  interface ToClient {
    ['base.force-coords-update']: () => void;
  }
}

// Keep backward compatibility during migration
declare namespace SocketServer {
  interface Server extends ServerRPC.Socket {}
  interface ServerEvents extends ServerOut.ToSocket {}
  interface SocketEvents extends ServerIn.FromSocket {}
}
