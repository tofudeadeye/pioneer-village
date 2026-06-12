declare interface ClientExports {
  <R extends keyof ClientExports, K extends keyof ClientExports[R] = keyof ClientExports[R]>(
    name: K,
    fn: ClientExports[R][K],
  ): void;
}

declare interface ServerExports {
  <R extends keyof ServerExports, K extends keyof ServerExports[R] = keyof ServerExports[R]>(
    name: K,
    fn: ServerExports[R][K],
  ): void;
}

// Initialize base namespaces for client communication
declare namespace ClientRPC {
  interface Socket {} // RPC calls to socket server (via UI)
  interface Server {} // RPC calls to game server
}

declare namespace ClientIn {
  interface FromSocket {} // Events from socket server (via UI)
  interface FromServer {} // Events from game server
}

declare namespace ClientOut {
  interface ToSocket {} // Events to socket server (via UI)
  interface ToServer {} // Events to game server
}

declare namespace SocketIO {
  interface Events {
    // Chat is a core UI feature
    chatMessage: (chatMessage: UI.Chat.Message) => void;

    // Log messages are UI-specific
    ['log.message']: (data: UI.Log.Data) => void;

    // Character updates might be UI-specific (if not defined elsewhere)
    ['character-client-update.getCharacter']: (character: string) => void;
    ['character-client-update.updateAttribute']: (attr: keyof CharacterData, newVal: any) => void;
  } // Raw Socket.io events for UI layer
}

// Initialize base namespaces for server communication
declare namespace ServerRPC {
  interface Client {} // RPC calls from client
}

declare namespace ServerIn {
  interface FromClient {} // Events from game client
  interface FromSocket {} // Events from socket server
}

declare namespace ServerOut {
  interface ToClient {} // Events to game client
  interface ToSocket {} // Events to socket server
}

type DropLast<T extends any[]> = T extends [...rest: infer U, arg: any] ? U : T;
type DropLastParam<T extends (...args: any[]) => any> = DropLast<Parameters<T>>;
type Last<T extends any[]> = T extends [...any[], infer R] ? R : never;
type LastParam<T extends (...args: any[]) => any> = Last<Parameters<T>>;

// Check if we're in server context by checking for 'source' global variable
// which is only available in @citizenfx/server
type IsServer = typeof source extends number ? true : false;

// Use conditional typing based on whether we're in server or client context
type onClient = <T extends keyof ServerIn.FromClient>(
  evtName: T,
  callback: (...args: Parameters<ServerIn.FromClient[T]>) => void,
) => void;
type onClientCall = <T extends keyof ServerRPC.Client>(
  evtName: T,
  callback: (
    serverId: number,
    ...args: Parameters<ServerRPC.Client[T]>
  ) => ReturnType<ServerRPC.Client[T]> | Promise<ReturnType<ServerRPC.Client[T]>>,
) => void;
type emitClient = <T extends keyof ServerOut.ToClient>(
  evtName: T,
  serverId: number,
  ...args: Parameters<ServerOut.ToClient[T]>
) => void;
type awaitClient = <T extends keyof ServerRPC.Client>(
  evtName: T,
  serverId: number,
  ...args: Parameters<ServerRPC.Client[T]>
) => Promise<ReturnType<ServerRPC.Client[T]>>;

type onServer = <T extends keyof (ClientIn.FromServer & ClientOut.ToServer)>(
  evtName: T,
  callback: (...args: Parameters<(ClientIn.FromServer & ClientOut.ToServer)[T]>) => void,
) => void;
type onServerCall = <T extends keyof ClientRPC.Server>(
  evtName: T,
  callback: (
    serverId: number,
    ...args: Parameters<ClientRPC.Server[T]>
  ) => ReturnType<ClientRPC.Server[T]> | Promise<ReturnType<ClientRPC.Server[T]>>,
) => void;
type emitServer = <T extends keyof (ClientIn.FromServer & ClientOut.ToServer)>(
  evtName: T,
  ...args: Parameters<(ClientIn.FromServer & ClientOut.ToServer)[T]>
) => void;
type awaitServer = <T extends keyof ClientRPC.Server>(
  evtName: T,
  ...args: Parameters<ClientRPC.Server[T]>
) => Promise<ReturnType<ClientRPC.Server[T]>>;

type PendingCallback = {
  resolve: (response: any) => void;
  reject: (error: any) => void;
  timeout: NodeJS.Timeout;
};

declare namespace Global {
  type PopulationPedCreating = (
    x: number,
    y: number,
    z: number,
    model: number,
    setters: {
      setModel: (model: string | number) => void;
      setPosition: (x: number, y: number, z: number) => void;
    },
  ) => void;
}

declare namespace CFX {
  interface ExplosionEvent {
    f186: number;
    f208: number;
    ownerNetId: number;
    f214: number;
    explosionType: number;
    damageScale: number;
    posX: number;
    posY: number;
    posZ: number;
    f242: boolean;
    f104: number;
    cameraShake: number;
    isAudible: boolean;
    f189: boolean;
    isInvisible: boolean;
    f126: boolean;
    f241: boolean;
    f243: boolean;
    f210: number;
    unkX: number;
    unkY: number;
    unkZ: number;
    f190: boolean;
    f191: boolean;
    f164: number;
    posX224: number;
    posY224: number;
    posZ224: number;
    f240: boolean;
    f218: number;
    f216: boolean;
  }
}

interface Vector2Format {
  x: number;
  y: number;
}

interface Vector3Format extends Vector2Format {
  z: number;
}

interface Vector4Format extends Vector3Format {
  w: number;
}

interface MinMax {
  min: number;
  max: number;
}
