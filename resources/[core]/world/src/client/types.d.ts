declare interface ClientExports {
  world: World.ClientExports;
}

declare namespace World {
  type StartFxAtCoords = (
    id: string,
    looped: boolean,
    dict: string,
    name: string,
    coords: Vector3Format,
    rot?: Vector3Format,
    scale?: number,
  ) => Promise<number>;
  type StartFxOnEntity = (
    id: string,
    looped: boolean,
    dict: string,
    name: string,
    entity: number,
    offset?: Vector3Format,
    rot?: Vector3Format,
    scale?: number,
  ) => Promise<number>;
  type StartFxOnEntityBone = (
    id: string,
    looped: boolean,
    dict: string,
    name: string,
    entity: number,
    boneIndex: number,
    offset: Vector3Format,
    rot: Vector3Format,
    scale?: number,
  ) => Promise<number>;
  type StartFxOnEntityBoneByName = (
    id: string,
    looped: boolean,
    dict: string,
    name: string,
    entity: number,
    boneName: string,
    offset: Vector3Format,
    rot: Vector3Format,
    scale?: number,
  ) => Promise<number>;
  type StartFxOnPedBone = (
    id: string,
    looped: boolean,
    dict: string,
    name: string,
    ped: number,
    boneIndex: number,
    offset: Vector3Format,
    rot: Vector3Format,
    scale?: number,
  ) => Promise<number>;
  type StartFxOnPedBoneByName = (
    id: string,
    looped: boolean,
    dict: string,
    name: string,
    ped: number,
    boneName: string,
    offset: Vector3Format,
    rot: Vector3Format,
    scale?: number,
  ) => Promise<number>;
  type StopPtfx = (id: string, removeNow?: boolean) => void;
  type SetFxEvolution = (id: string, name: string, value: number) => void;
  type SetFxEvolutions = (id: string, evolutions: Record<string, number>) => void;

  type ClientExports = {
    startFxAtCoords: StartFxAtCoords;
    startFxOnEntity: StartFxOnEntity;
    startFxOnEntityBone: StartFxOnEntityBone;
    startFxOnEntityBoneByName: StartFxOnEntityBoneByName;
    // startFxOnPedBone: StartFxOnPedBone;
    // startFxOnPedBoneByName: StartFxOnPedBoneByName;
    stopFx: StopPtfx;
    setFxEvolution: SetFxEvolution;
    setFxEvolutions: SetFxEvolutions;
  };
}

// Client perspective - RPC calls to various destinations
declare namespace ClientRPC {
  interface Socket {
    ['world.registered-objects']: () => Record<string, number>;
    ['world.request-creation']: (name: string) => boolean;
  }
}

// Client perspective - events sent to socket
declare namespace ClientOut {
  interface ToSocket {
    ['world.register-object']: (name: string, netId: number) => void;
    ['world.unregister-object']: (name: string) => void;
  }
}

// Client perspective - events received from various sources
declare namespace ClientIn {
  interface FromSocket {
    // Cron Events
    'world.geyser-show': (data: World.GeyserShowSteps) => void;
    'world.meteor-shower': () => void;
  }
}

// Raw Socket.io events for UI layer typing - DEDUPLICATED
// Note: SocketIO.Events eliminated - use ClientIn.FromSocket directly
