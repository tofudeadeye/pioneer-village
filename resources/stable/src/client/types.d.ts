declare namespace Stable {}

// Client perspective - RPC calls to various destinations
declare namespace ClientRPC {
  interface Socket {
    ['stable.load-character-horses']: (characterId: number) => [Horse.Data[], Horse.Pregnancy[]];
    ['stable.save-horse']: (horseData: Horse.DirtyData) => boolean;
    ['stable.can-birth-foal']: (horseId: number) => boolean;
    ['stable.breed-horses']: (horseId1: number, horseId2: number) => number | void;
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
