declare namespace Stable {}

// Client perspective - RPC calls to various destinations
declare namespace ClientRPC {
  interface Socket {
    ['stable.load-character-horses']: (characterId: number) => Horse.Data[];
    ['stable.save-horse']: (horseData: Horse.DirtyData) => boolean;
  }
}

// Client perspective - events received from various sources
declare namespace ClientIn {
  interface FromSocket {}
}

// Client perspective - events sent to various destinations
declare namespace ClientOut {
  interface ToSocket {
    // Add stable events to socket here when needed
  }
}

// Raw Socket.io events for UI layer typing - DEDUPLICATED
// Note: SocketIO.Events eliminated - use ClientRPC.Socket for RPC calls
