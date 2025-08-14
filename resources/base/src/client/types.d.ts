declare interface ClientExports {
  base: Base.ClientExports;
}

declare namespace Base {
  type getNetworkControlOfEntity = (entity: number) => Promise<void>;
  type deleteEntity = (entity: number) => void;
  type deleteEntities = (entities: number[]) => void;

  type ClientExports = {
    getNetworkControlOfEntity: getNetworkControlOfEntity;
    deleteEntity: deleteEntity;
    deleteEntities: deleteEntities;
    getCurrentCharacter: () => CharacterData | null;
  }

  type DoorData = [doorHash: number, modelHash: number, modelName: string, x: number, y: number, z: number];
  type BlipData = {
    name: string;
    sprite: string | number;
    color?: number;
    coords: Vector3Format;
  }
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

