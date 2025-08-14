declare namespace Stable {}

// Server perspective - RPC calls to various destinations
declare namespace ServerRPC {
  interface Socket {}
}

// Server perspective - events received from various sources
declare namespace ServerIn {
  interface FromSocket {}
}
