declare interface ClientExports {
  base: Base.ClientExports;
}

declare namespace Base {
  type DoorData = [doorHash: number, modelHash: number, modelName: string, x: number, y: number, z: number];
  type BlipData = {
    id: number;
    // type: 'sprite';
    label: string;
    sprite: number;
    modifiers?: number[];
    coords: Vector3Format;
  };
  // TODO: Implement other blip types like area, entity, etc.
  // | {
  //   id: number;
  //   type: 'entity';
  //   label: string;
  //   color?: number;
  //   entity: number;
  // }
  // | {
  //   id: number;
  //   type: 'area';
  //   label: string;
  //   scale?: number;
  //   color?: number;
  //   coords: Vector3Format;
  // };
  type BlipDataWithoutId = Omit<BlipData, 'id'>;

  type getNetworkControlOfEntity = (entity: number) => Promise<void>;
  type deleteEntity = (entity: number, attached?: boolean) => void;
  type deleteEntities = (entities: number[], attached?: boolean) => void;

  type blipRegister = (id: string, data: BlipDataWithoutId, style?: number) => number;
  type blipUnregister = (id: string) => void;

  type ClientExports = {
    getNetworkControlOfEntity: getNetworkControlOfEntity;
    deleteEntity: deleteEntity;
    deleteEntities: deleteEntities;
    getCurrentCharacter: () => CharacterData | null;
    blipRegister: blipRegister;
    blipUnregister: blipUnregister;
  };
}

// Client perspective - RPC calls to various destinations
declare namespace ClientRPC {
  interface Server {
    ['base.get-network-control']: (entity: number) => void;
  }
}

// Client perspective - events received from various sources
declare namespace ClientIn {
  interface FromServer {
    ['base.force-coords-update']: () => void;
  }
}

// Client perspective - events sent to various destinations
declare namespace ClientOut {
  interface ToServer {
    ['base.entity-deleted']: (entity: number) => void;
    ['base.entities-deleted']: (entities: number[]) => void;
  }
}
