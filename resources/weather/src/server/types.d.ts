declare namespace Weather {}

// Server perspective - events sent to socket
declare namespace ServerOut {
  interface ToSocket {}
}


// Server perspective - RPC calls from client
declare namespace ServerRPC {
  interface Client {
    'weather.request-grid': () => any;
  }
}