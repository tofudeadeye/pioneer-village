// Socket perspective - what the socket server receives
declare namespace SocketIn {
  interface FromGameServer {
    'world.registered-objects': (callback: (objects: Record<string, number>) => void) => void;
    'world.register-object': (name: string, id: number) => void;
    'world.unregister-object': (name: string) => void;
    'world.persistent-objects': (callback: (objects: Record<string, World.PersistentObject>) => void) => void;
  }

  interface FromClient {
    'world.registered-objects': (callback: (objects: Record<string, number>) => void) => void;
    'world.request-creation': (name: string, callback: (success: boolean) => void) => void;
    'world.register-object': (name: string, id: number) => void;
    'world.unregister-object': (name: string) => void;
    'world.load-state': (name: string, callback: (state: Record<string, unknown>) => void) => void;
    'world.update-state': (name: string, patch: Record<string, unknown>) => void;
  }
}

// Socket perspective - what the socket server sends
declare namespace SocketOut {
  interface ToGameServer {
    ['world.register-object']: (name: string, netId: number) => void;
    ['world.unregister-object']: (name: string) => void;
    ['world.persistent-objects']: (objects: Record<string, World.PersistentObject>) => void;
    ['world.net-id-exists']: (id: number, callback: (exists: boolean) => void) => void;
  }

  interface ToClient {
    'world.register-object': (name: string, id: number) => void;
    'world.unregister-object': (name: string) => void;

    // Cron Events
    'world.geyser-show': (data: World.GeyserShowSteps) => void;
    'world.meteor-shower': () => void;
  }
}

// Keep backward compatibility during migration
declare namespace SocketServer {
  interface Server extends SocketIn.FromGameServer {}
  interface ServerEvents extends SocketOut.ToGameServer {}
  interface Client extends SocketOut.ToClient {}
  interface ClientEvents extends SocketIn.FromClient {}
}
