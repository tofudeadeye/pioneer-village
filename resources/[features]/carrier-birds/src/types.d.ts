declare namespace CarrierBirds {
  type BirdTypes = 'pigeon' | 'owl';

  interface ActiveDelivery {
    id: number;
    pigeonItemId: number;
    birdType: string;
    state: string;
    ownerId: number;
    receiverId: number;
    totalDistance: number;
    distanceCovered: number;
    createdAt: string;
  }

  interface PigeonItemMetadata {
    name: string;
    birdType: string;
    stamina: number;
  }

  type BirdEvent = {
    type: 'arrival' | 'return' | 'send';
    characterId: number;
    birdType: CarrierBirds.BirdTypes;
    birdInventoryId: number;
  };
}

declare interface RPC {}
