declare interface ClientExports {
  ['carrier-birds']: CarrierBirds.ClientExports;
}

declare namespace CarrierBirds {
  type ClientExports = {};
}

declare namespace ClientRPC {
  interface Socket {
    ['carrier-birds.send']: (
      pigeonItemId: number,
      receiverCharacterId: number,
      letterItemId: number,
    ) => Promise<{ success: boolean; error?: string }>;
    ['carrier-birds.get-active']: () => Promise<CarrierBirds.ActiveDelivery[]>;
  }
}

declare namespace ClientIn {
  interface FromSocket {
    ['carrier-birds.event']: (data: CarrierBirds.BirdEvent) => void;
  }
}

declare namespace SocketIO {
  interface Events {}
}
