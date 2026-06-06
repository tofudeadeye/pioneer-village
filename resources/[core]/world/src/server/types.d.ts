declare namespace World {}

// Server perspective - events sent to socket server
declare namespace ServerOut {
  interface ToSocket {
    // Cron
    ['cron.register-event']: (id: string, data: CronData) => void;
  }
}

// Server perspective - events received from socket server
declare namespace ServerIn {
  interface FromSocket {
    ['world.net-id-exists']: (id: number, callback: (exists: boolean) => void) => void;
    ['world.persistent-objects']: (objects: Record<string, World.PersistentObject>) => void;
  }
}

// Keep backward compatibility during migration
declare namespace SocketServer {
  interface SocketEvents extends ServerIn.FromSocket {}
  interface ServerEvents extends ServerOut.ToSocket {}
}
