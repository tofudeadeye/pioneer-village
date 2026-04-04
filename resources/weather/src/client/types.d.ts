declare namespace Weather {}

declare namespace ClientRPC {
  interface Socket {
    // Add health RPC calls here when needed
  }
  interface Server {
     ['weather.request-grid']: () => any;
  }
}
