declare namespace World {}

// Client perspective - RPC calls to various destinations
declare namespace ClientRPC {
  interface Socket {
    ['world.registered-objects']: () => Record<string, number>;
    ['world.request-creation']: (name: string) => boolean;
  }
}

// Client perspective - events sent to socket
declare namespace ClientOut {
  interface ToSocket {
    ['world.register-object']: (name: string, netId: number) => void;
    ['world.unregister-object']: (name: string) => void;
  }
}

// Client perspective - events received from various sources
declare namespace ClientIn {
  interface FromSocket {
    // Add any events the client receives from socket here
  }
}

// Raw Socket.io events for UI layer typing - DEDUPLICATED
// Note: SocketIO.Events eliminated - use ClientIn.FromSocket directly

