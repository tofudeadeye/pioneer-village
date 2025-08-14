declare namespace ThreeD {}

// Client perspective - RPC calls to various destinations
declare namespace ClientRPC {
  interface Socket {
    // Add 3d RPC calls here when needed
  }
}

// Client perspective - events received from various sources
declare namespace ClientIn {
  interface FromSocket {
    // Add 3d events from socket here when needed
  }
}

// Client perspective - events sent to various destinations
declare namespace ClientOut {
  interface ToSocket {
    // Add 3d events to socket here when needed
  }
}

// Raw Socket.io events for UI layer typing - DEDUPLICATED
// Note: SocketIO.Events eliminated - use ClientIn.FromSocket and ClientOut.ToSocket directly


