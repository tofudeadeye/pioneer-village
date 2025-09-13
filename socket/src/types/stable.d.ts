// Socket perspective - what the socket server receives
declare namespace SocketIn {
  interface FromGameServer {
    ['stable.horse-locations']: ServerOut.ToSocket['stable.horse-locations'];
  }

  interface FromClient {
    ['stable.load-character-horses']: (characterId: number, callback: (data: Horse.Data[]) => void) => void;
    ['stable.save-horse']: (horseData: Horse.DirtyData, callback: (result: boolean) => void) => void;
  }
}

// Socket perspective - what the socket server sends
declare namespace SocketOut {
  interface ToGameServer {}

  interface ToClient {
    // No stable events sent to client currently
  }
}

// Keep backward compatibility during migration
declare namespace SocketServer {
  interface Server extends SocketIn.FromGameServer {}
  interface ServerEvents extends SocketOut.ToGameServer {}
  interface Client extends SocketOut.ToClient {}
  interface ClientEvents extends SocketIn.FromClient {}
}
