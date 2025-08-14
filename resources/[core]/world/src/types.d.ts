declare namespace World {
  interface Object {
    model: number;
    coords: Vector3Format;
    rotation: Vector3Format;
    name: string;
    networked: boolean;
  }
}

// Extend the ClientOut.ToSocket namespace with world-specific socket events
declare namespace ClientOut {
  interface ToSocket {
    'world.register-object': (name: string, netId: number) => void;
    'world.unregister-object': (name: string) => void;
  }
}
