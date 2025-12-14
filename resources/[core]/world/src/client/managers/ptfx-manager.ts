import { Log } from '@lib/client/comms/ui';

type PtfxInfo = {
  id: number;
  looped: boolean;
};

export class PtfxManager {
  protected static instance: PtfxManager;

  protected ptfxs: Map<string, PtfxInfo> = new Map();

  static getInstance(): PtfxManager {
    if (!PtfxManager.instance) {
      PtfxManager.instance = new PtfxManager();
    }
    return PtfxManager.instance;
  }

  initialized = false;

  constructor() {
    on('onResourceStop', (resourceName: string) => {
      if (resourceName === GetCurrentResourceName()) {
        this.cleanup();
      }
    });

    this.init();
  }

  async init() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
  }

  cleanup() {
    for (const ptfx of this.ptfxs.values()) {
      if (!ptfx.looped || !DoesParticleFxLoopedExist(ptfx.id)) {
        continue;
      }
      StopParticleFxLooped(ptfx.id, false);
    }
  }

  async startFxAtCoords(
    id: string,
    looped: boolean,
    dict: string,
    name: string,
    coords: Vector3Format,
    rot: Vector3Format = { x: 0, y: 0, z: 0 },
    scale: number = 1.0,
  ): Promise<number> {
    if (this.ptfxs.has(id)) {
      return this.ptfxs.get(id)!.id;
    }
    // Log('Starting PTFX', id, dict, name, coords, rot, scale, looped);

    let ptfxId = 0;
    UseParticleFxAsset(dict);
    if (looped) {
      ptfxId = StartParticleFxLoopedAtCoord(
        name,
        coords.x,
        coords.y,
        coords.z,
        rot.x,
        rot.y,
        rot.z,
        scale,
        false,
        false,
        false,
        false,
      );
    } else {
      ptfxId = StartParticleFxNonLoopedAtCoord(
        name,
        coords.x,
        coords.y,
        coords.z,
        rot.x,
        rot.y,
        rot.z,
        scale,
        false,
        false,
        false,
      );
    }

    this.ptfxs.set(id, { id: ptfxId, looped });

    return ptfxId;
  }

  stopFx(id: string) {
    const ptfx = this.ptfxs.get(id);
    if (!ptfx) {
      return;
    }
    if (ptfx.looped && DoesParticleFxLoopedExist(ptfx.id)) {
      Log('Stopping PTFX', id, ptfx.id);
      StopParticleFxLooped(ptfx.id, false);
    }
    this.ptfxs.delete(id);
  }

  setFxEvolution(id: string, name: string, value: number) {
    const ptfx = this.ptfxs.get(id);
    if (!ptfx || !DoesParticleFxLoopedExist(ptfx.id)) {
      return;
    }
    Log('Setting PTFX evolution', id, name, value);
    SetParticleFxLoopedEvolution(ptfx.id, name, value, false);
  }

  setFxEvolutions(id: string, evolutions: Record<string, number>) {
    const ptfx = this.ptfxs.get(id);
    if (!ptfx || !DoesParticleFxLoopedExist(ptfx.id)) {
      return;
    }
    for (const [name, value] of Object.entries(evolutions)) {
      Log('Setting PTFX evolution', id, name, value);
      SetParticleFxLoopedEvolution(ptfx.id, name, value, false);
    }
  }
}

const ptfxManager = PtfxManager.getInstance();

export default ptfxManager;
