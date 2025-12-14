// Socket perspective - what the socket server receives
declare namespace SocketIn {
  interface FromGameServer {
    'cron.register-event': (id: string, data: CronData) => void;
  }

  interface FromClient {}
}

// Socket perspective - what the socket server sends
declare namespace SocketOut {
  interface ToGameServer {}

  interface ToClient {}
}

// Keep backward compatibility during migration
declare namespace SocketServer {
  interface Server extends SocketIn.FromGameServer {}
  interface ServerEvents extends SocketOut.ToGameServer {}
  interface Client extends SocketOut.ToClient {}
  interface ClientEvents extends SocketIn.FromClient {}
}

type CronDataClient = {
  type: 'client';
  eventName: keyof SocketOut.ToClient;
  interval: number;
  intervalRange?: number;
};

type CronDataServer = {
  type: 'server';
  eventName: keyof SocketOut.ToGameServer;
  interval: number;
  intervalRange?: number;
};

type CronDataSocket = {
  type: 'socket';
  eventName: string;
  interval: number;
  intervalRange?: number;
};

type CronData = CronDataClient | CronDataServer | CronDataSocket;
