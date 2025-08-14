declare namespace Queue {}

// Client perspective - RPC calls to various destinations
declare namespace ClientRPC {
  interface Socket {
    getSocketDetails: (useCache?: boolean) => SocketDetails;
  }
  
  interface Server {
    getSocketDetails: (useCache?: boolean) => SocketDetails;
  }
}

// Client perspective - events received from various sources
declare namespace ClientIn {
  interface FromSocket {
    // Add queue events from socket here when needed
  }
}

// Client perspective - events sent to various destinations
declare namespace ClientOut {
  interface ToSocket {
    // Add queue events to socket here when needed
  }
}

// Raw Socket.io events for UI layer typing - DEDUPLICATED
// Note: SocketIO.Events eliminated - use ClientRPC.Socket and ClientIn/ClientOut directly


