declare interface ClientExports {
  world: World.ClientExports;
}

declare namespace World {
  type StartPtfxAtCoords = (
    id: string,
    looped: boolean,
    dict: string,
    name: string,
    coords: Vector3Format,
    rot?: Vector3Format,
    scale?: number,
  ) => Promise<number>;
  type StopPtfx = (id: string) => void;
  type SetFxEvolution = (id: string, name: string, value: number) => void;
  type SetFxEvolutions = (id: string, evolutions: Record<string, number>) => void;

  type ClientExports = {
    startPtfxAtCoords: StartPtfxAtCoords;
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
    // Add any events the client receives from socket here
  }
}

// Raw Socket.io events for UI layer typing - DEDUPLICATED
// Note: SocketIO.Events eliminated - use ClientIn.FromSocket directly
