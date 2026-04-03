declare namespace SocketIn {
  interface FromClient {
    ['carrier-birds.send']: (
      pigeonItemId: number,
      receiverCharacterId: number,
      callback: (result: { success: boolean; error?: string }) => void,
    ) => void;
    ['carrier-birds.get-active']: (callback: (deliveries: CarrierBirds.ActiveDelivery[]) => void) => void;
  }
}

declare namespace SocketOut {
  interface ToClient {
    ['carrier-birds.event']: (data: CarrierBirds.BirdEvent) => void;
  }
}
