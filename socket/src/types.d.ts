declare namespace SocketServer {
  interface Server {
    getAccount: (identifiers: Record<string, string>, callback: (whitelist: {}) => void) => void;
    generateJWT: (serverId: number, identifiers: Record<string, string>, callback: (jwt: string) => void) => void;
  }

  interface ServerEvents {
    'base.connected-players': (players: Base.PlayerInfo[]) => void;
    'base.player-coords': (serverId: number, coords: Vector3Format) => void;
  }

  interface Client {}

  interface ClientEvents {
    chatSend: (chatSend: UI.Chat.Send) => void;
  }

  interface SocketEvents {
    'player-management.kick': () => void;
  }

  interface SocketData {
    user: {
      serverId: number;
      userId: number;
      iat: number;
      exp: number;
    };
    character?: {
      id: number;
    };
  }
}

declare interface UISocketEvents {}

// type onClient = <T extends keyof NetEvents>(evtName: T, callback: (...args: Parameters<NetEvents[T]>) => void) => void;

// declare namespace Collection {
//   type inventory = {
//     _id?: number;
//     identifier: string;
//     metadata: string;
//     container: {
//       _id?: number;
//       locked: boolean;
//       sealed: 'NONE' | 'SEALED' | 'BROKEN';
//       items: {
//         _id?: number;
//         identifier: number;
//         metadata: string;
//         quantity: number;
//         createdAt: Date;
//         deletedAt: Date;
//       }[];
//     };
//   };
// }

declare interface String {
  GetHashKey(): number;
}
