declare interface RPC {}

interface StateBagInterface {
  horseId?: number;
}

declare namespace Stable {
  type Id = string;

  type Type =
    | 'VALENTINE'
    | 'STRAWBERRY'
    | 'DEWBERRY_CREEK'
    | 'VAN_HORN'
    | 'SAINT_DENIS'
    | 'BLACKWATER'
    | 'TUMBLEWEED'
    | 'RHODES'
    | 'COLTER'
    | 'LITTLE_CREEK'
    | 'MCFARLANE'
    | 'ARMADILLO'
    | 'THIEVES_LANDING'
    | 'DAKOTA_RIVER_SOUTH'
    | 'DAKOTA_RIVER_NORTH';

  interface Data {
    name: string;
    identifier: string;
    type: Type;
    zones: Record<string, Vector2Format[]>;
    stalls: Vector4Format[];
    stallDoors?: number[];
  }
}

declare namespace Horse {
  type Id = number;

  type Location = {
    horseId: Horse.Id;
    coords?: Vector3Format;
  };

  interface Data {
    id: number;
    name: string;
    ownerId: number;
    stable: string | null;
    brandId: number | null;
    breeds: Horse.BreedRecord | null;
    components: number[] | any;
    model: number;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    age: number;
    weight: number;
    food: number;
    water: number;
    health: number;
    cleanliness: number;
    neuteredFixed: boolean;
    dna: Record<string, any>;
    statBonding: Record<number, number>; // Record<CharacterId, Bonding>
    hooves: number;
    horseshoes: number;
    metadata: Record<string, any> | null;
    lastX: number;
    lastY: number;
    lastZ: number;
    createdAt: string;
  }

  type DirtyData = Partial<Omit<Data, 'id' | 'createdAt'>> & { id: number };

  interface StatRange {
    health?: MinMax;
    endurance?: MinMax;
    fertility?: MinMax;
    handling?: MinMax;
    speed?: MinMax;
    acceleration?: MinMax;
  }

  interface SpawnOptions {
    scale?: number;
    local?: boolean;
    overrideCoord?: Vector4Format;
  }

  type Breed =
    | 'UNKNOWN'
    | 'AMERICAN_PAINT'
    | 'AMERICAN_STANDARDBRED'
    | 'ANDALUSIAN'
    | 'APPALOOSA'
    | 'ARABIAN'
    | 'ARDENNES'
    | 'BELGIAN'
    | 'BRETON'
    | 'BUELL'
    | 'CRIOLLO'
    | 'DUTCH_WARMBLOOD'
    | 'HUNGARIAN_HALFBRED'
    | 'KENTUCKY_SADDLE'
    | 'KLADRUBER'
    | 'MISSOURI_FOX_TROTTER'
    | 'MORGAN'
    | 'MUSTANG'
    | 'NOKOTA'
    | 'SHIRE'
    | 'SUFFOLK_PUNCH'
    | 'TENNESSEE_WALKER'
    | 'THOROUGHBRED'
    | 'TURKOMAN'
    | 'MULE';

  type BreedRecord = Map<Breed, number>;
}

declare namespace Wagon {
  type Id = number;
}
