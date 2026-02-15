import type { GridCell } from "./shared/grid";

declare interface ClientExports {
  weather: Weather.ClientExports;
}

declare namespace ClientRPC {
  interface Socket {
    // ['weather.request-grid']: () => Promise<{ grid: GridCell[][] }>;
  }
  interface Server {
    // ['weather.request-grid']: () => Promise<{ grid: GridCell[][] }>;
  }
}

declare interface RPC {
  ['weather.request-grid']: () => Promise<{ grid: GridCell[][] }>;
//   ['health.getFoodAndDrink']: (charId: number) => Promise<{ food: number; drink: number }>;
//   ['health.getHealthMetadata']: (charId: number) => Promise<CharacterHealthMetadata>;
}

declare namespace Weather {
//   interface BoneInfo {
//     index: number;
//     id: number;
//     attachedTo?: string[];
//   }

//   interface InjuryInfo {
//     threshold: number;
//     text: string;
//     recoveryMultiplier: number;
//     boneBroken?: boolean;
//   }

//   interface BoneStatus {
//     index: number;
//     bulletFragment: number;
//     shot: number;
//     burned: boolean;
//     slash: number;
//     broken: boolean;
//     bandaged: boolean;
//     stabilized: boolean;
//     infected: boolean; // Poisonous Animal Infection
//     infectedBySelf: boolean; // Bad Bandage Infection
//     infectionMultiplier: number;
//     infection: number;
//     bleedingParticleId: boolean;
//     bleedingParticleSize: number;
//   }

//   type increaseFoodLevel = (food: number) => void;
//   type increaseWaterLevel = (water: number) => void;
//   type limitWalkSpeed = (speed: number) => void;
//   type clearWalkSpeed = () => void;

  type ClientExports = {
    // increaseFoodLevel: increaseFoodLevel;
    // increaseWaterLevel: increaseWaterLevel;
    // limitWalkSpeed: limitWalkSpeed;
    // clearWalkSpeed: clearWalkSpeed;
  };
}

// Extend the ClientOut.ToSocket namespace with doors-specific socket events
declare namespace ClientOut {
  interface ToSocket {
    // 'doors.set-door-state': (doorHash: number, state: Doors.State) => void;
    // ['weather.request-grid']: () => Promise<{ grid: GridCell[][] }>;
  }
}
