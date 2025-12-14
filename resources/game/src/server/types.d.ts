declare namespace Game {
  type MyServerType = {
    one: 'two';
  };
}

// Server perspective - RPC calls from client
declare namespace ServerRPC {
  interface Client {
    ['game.getSteamId']: () => string;
  }
}

// Server perspective - events received from socket
declare namespace ServerIn {
  interface FromSocket {
    ['player-management.kick']: SocketInternal.Events['player-management.kick'];
  }
}
