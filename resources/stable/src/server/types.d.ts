declare namespace Stable {}

// Server perspective - RPC calls to various destinations
declare namespace ServerRPC {
  interface Socket {}
}

// Server perspective - events received from various sources
declare namespace ServerIn {
  interface FromSocket {}
}

// Server perspective - events sent to socket
declare namespace ServerOut {
  interface ToSocket {
    ['stable.horse-locations']: (locations: Horse.Location[]) => void;
  }
}

// Extend the base ServerEvents
declare namespace SocketServer {
  interface ServerEvents {
    ['stable.horse-locations']: ServerOut.ToSocket['stable.horse-locations'];
  }
}
