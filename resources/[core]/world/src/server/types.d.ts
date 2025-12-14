declare namespace World {}

// Server perspective - events sent to socket server
declare namespace ServerOut {
  interface ToSocket {
    ['world.net-id-exists']: (id: number) => void;

    // Cron
    ['cron.register-event']: (id: string, data: CronData) => void;
  }
}

declare namespace ServerIn {
  interface FromSocket {}
}

// Keep backward compatibility during migration
declare namespace SocketServer {
  interface SocketEvents extends ServerOut.ToSocket {}
}
