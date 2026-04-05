declare namespace Weather {}

type WeatherGridCell = {
  x: number;
  y: number;
  weather: string;
  variant: string | null;
  biome: string;
  rainRate: number;
};

// Client perspective - RPC calls via socket (through UI forwarding)
declare namespace ClientRPC {
  interface Socket {
    ['weather.request-grid']: () => { grid: WeatherGridCell[][] };
    ['weather.admin.get-grid-state']: () => { grid: WeatherGridCell[][]; frozen: boolean; globalOverride: string | null; };
    ['weather.admin.set-biome-weather']: (biome: string, weather: string) => { success: boolean; updatedCount: number; };
    ['weather.admin.regenerate-grid']: (seed?: number) => { success: boolean; };
    ['weather.admin.freeze-weather']: (frozen: boolean) => { success: boolean; };
    ['weather.admin.force-global']: (weather: string | null) => { success: boolean; };
  }
  interface Server {}
}

// Client perspective - events received from socket (via UI forwarding)
declare namespace ClientIn {
  interface FromSocket {
    ['weather.grid-update']: (grid: WeatherGridCell[][]) => void;
    ['weather.freeze-state']: (frozen: boolean) => void;
    ['weather.global-override']: (weather: string | null) => void;
  }
}
