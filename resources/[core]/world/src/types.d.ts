declare namespace World {
  interface Object {
    model: number;
    coords: Vector3Format;
    rotation: Vector3Format;
    name: string;
    networked: boolean;
  }

  type PtfxStepBase = {
    id: string;
    delayAfter?: number;
  };

  type PtfxStepStart = PtfxStepBase & {
    _type: 'start';
    dict: string;
    fx: string;
  };

  type PtfxStepEvolve = PtfxStepBase & {
    _type: 'evolve';
    evolutions: Record<string, number>;
  };

  type PtfxStepStop = PtfxStepBase & {
    _type: 'stop';
  };

  type PtfxStep = PtfxStepStart | PtfxStepEvolve | PtfxStepStop;

  type PtfxSteps = PtfxStep[];

  type GeyserShowStep = {
    _type: 'start' | 'evolve' | 'stop';
    id: 'geyser_1' | 'geyser_2' | 'geyser_3';
    evolutions?: {
      erupt?: number;
      steam?: number;
    };
    delayAfter?: number;
  };

  type GeyserShowSteps = GeyserShowStep[];
}

// Extend the ClientOut.ToSocket namespace with world-specific socket events
declare namespace ClientOut {
  interface ToSocket {
    'world.register-object': (name: string, netId: number) => void;
    'world.unregister-object': (name: string) => void;
  }
}
