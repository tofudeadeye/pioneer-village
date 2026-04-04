import type { GridCell } from "./shared/grid";

declare interface ClientExports {
  weather: Weather.ClientExports;
}

declare namespace ClientRPC {
  interface Socket {
  }
  interface Server {
  }
}

declare interface RPC {
  ['weather.request-grid']: () => Promise<{ grid: GridCell[][] }>;
}

declare namespace Weather {
  type ClientExports = {
  };
}
