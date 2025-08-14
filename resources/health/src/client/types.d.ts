declare namespace Health {}

// Client perspective - RPC calls to various destinations
declare namespace ClientRPC {
  interface Socket {
    // Add health RPC calls here when needed
  }
  interface Server {
    ['health.getFoodAndDrink']: (charId: number) => { food: number; drink: number };
    ['health.getHealthMetadata']: (charId: number) => any; // TODO: define proper metadata type
  }
}

// Client perspective - events received from various sources
declare namespace ClientIn {
  interface FromSocket {
    ['doctor.state']: (event: UI.Doctor.Event) => void;
    ['character-update.food-drink']: (food: number, water: number) => void;
    ['character-update.health-status']: (
      boneHealth: any[],
      boneStatus: any[],
      sick: boolean,
      activeTonic: boolean,
      health: number,
      stamina: number,
      litersOfBlood: number,
    ) => void;
  }
}

// Client perspective - events sent to various destinations
declare namespace ClientOut {
  interface ToSocket {
    ['character-update.food-drink']: (food: number, water: number) => void;
    ['character-update.health-status']: (
      boneHealth: any[],
      boneStatus: any[],
      sick: boolean,
      activeTonic: boolean,
      health: number,
      stamina: number,
      litersOfBlood: number,
    ) => void;
  }
}

// Raw Socket.io events for UI layer typing - DEDUPLICATED
// Note: SocketIO.Events eliminated - use ClientIn.FromSocket directly


