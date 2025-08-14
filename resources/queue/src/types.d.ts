interface SocketDetails {
  socketUrl: string;
  token: string;
}

// Extend the ClientRPC.Server namespace with queue-specific RPC methods
declare namespace ClientRPC {
  interface Server {
    getSocketDetails: (useCache?: boolean) => SocketDetails;
  }
}
