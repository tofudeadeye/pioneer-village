declare namespace Health {}

// Server perspective - RPC calls from client
declare namespace ServerRPC {
  interface Client {
    ['health.getFoodAndDrink']: (charId: number) => { food: number; drink: number };
    ['health.getHealthMetadata']: (charId: number) => any; // TODO: define proper metadata type
  }
}

// Server perspective - events sent to socket
declare namespace ServerOut {
  interface ToSocket {
    ['character-get.food-drink']: (charId: number, callback: (food: number, drink: number) => void) => void;
    ['character-get.health-metadata']: (charId: number, callback: (metadata: any) => void) => void;
  }
}
