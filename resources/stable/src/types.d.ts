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
    pelts: [number, number][];
    corpses: Record<string, [number, number, number, number]>;
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

  type PregnancyStatus = 'ACTIVE' | 'BIRTHED' | 'LOST';

  interface Pregnancy {
    id: number;
    motherId: number;
    fatherId: number;
    foalId: number;
    conceivedAt: string;
    status: PregnancyStatus;
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
    force?: boolean;
    heading?: number;
  }

  type Breed =
    | 'UNKNOWN'
    | 'AMERICANPAINT'
    | 'AMERICANSTANDARDBRED'
    | 'ANDALUSIAN'
    | 'APPALOOSA'
    | 'ARABIAN'
    | 'ARDENNES'
    | 'BELGIAN'
    | 'BRETON'
    | 'CRIOLLO'
    | 'DUTCHWARMBLOOD'
    | 'GYPSYCOB'
    | 'HUNGARIANHALFBRED'
    | 'KENTUCKYSADDLE'
    | 'KLADRUBER'
    | 'MANGY'
    | 'MISSOURIFOXTROTTER'
    | 'MORGAN'
    | 'MULE'
    | 'MURFREEBROOD'
    | 'MUSTANG'
    | 'NOKOTA'
    | 'NORFOLKROADSTER'
    | 'SHIRE'
    | 'SUFFOLKPUNCH'
    | 'TENNESSEEWALKER'
    | 'THOROUGHBRED'
    | 'TURKOMAN';

  type BreedRecord = Map<Breed, number>;
}

declare namespace Wagon {
  type Id = number;
}
