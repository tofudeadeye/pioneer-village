import { PVBase, PVGame } from '@lib/client';
import { emitSocket, onSocket } from '@lib/client/comms/ui';
import { Vector3 } from '@lib/math';

const CHECK_INTERVAL_MS = 1_000;
const SPAWN_RANGE = 100;
const DESPAWN_RANGE = 150;

type ObjectState = Record<string, unknown>;
type SpawnHandler = (entityId: number, state: ObjectState) => void;
type StateChangeHandler = (entityId: number | undefined, patch: ObjectState, state: ObjectState) => void;

class WorldController {
  protected static instance: WorldController;

  static getInstance(): WorldController {
    if (!WorldController.instance) {
      WorldController.instance = new WorldController();
    }
    return WorldController.instance;
  }

  objects: Map<string, World.ObjectDef> = new Map();
  activeObjects: Map<string, number> = new Map();

  protected entityNames: Map<number, string> = new Map();
  protected spawning: Set<string> = new Set();
  protected spawnHandlers: Map<string, Set<SpawnHandler>> = new Map();
  protected stateHandlers: Map<string, Set<StateChangeHandler>> = new Map();
  protected interval: CitizenTimer;

  constructor() {
    this.interval = setInterval(() => {
      this.check();
    }, CHECK_INTERVAL_MS);

    onSocket('world.track-object', (def) => {
      this.objects.set(def.name, def);
      this.check();
    });

    onSocket('world.untrack-object', (name) => {
      this.destroyObject(name);
      this.objects.delete(name);
    });

    onSocket('world.state-changed', (name, patch) => {
      this.applyRemoteState(name, patch);
    });

    onSocket('world.transform-changed', (name, coords, rotation) => {
      this.applyRemoteTransform(name, coords, rotation);
    });

    on('onResourceStop', (resourceName: string) => {
      if (resourceName !== GetCurrentResourceName()) return;
      this.cleanUp();
    });

    // The socket server keeps per-client interest state across world resource restarts
    // (its connection lives in the ui resource), so tell it to resend our track list.
    emitSocket('world.request-sync');
  }

  check(): void {
    const playerCoords = Vector3.fromObject(PVGame.playerCoords());

    for (const obj of this.objects.values()) {
      const distance = playerCoords.getDistance2D(obj.coords.x, obj.coords.y);
      const isActive = this.activeObjects.has(obj.name);

      if (!isActive && distance < SPAWN_RANGE) {
        this.createObject(obj.name);
      } else if (isActive && distance > DESPAWN_RANGE) {
        this.destroyObject(obj.name);
      }
    }
  }

  protected async createObject(name: string): Promise<void> {
    const def = this.objects.get(name);
    if (!def || this.activeObjects.has(name) || this.spawning.has(name)) return;

    this.spawning.add(name);
    try {
      const entityId = await PVGame.createObject(def.model, def.coords, def.rotation, false);

      // The object may have been untracked while the model streamed in.
      if (!this.objects.has(name)) {
        PVBase.deleteEntity(entityId);
        return;
      }

      this.activeObjects.set(name, entityId);
      this.entityNames.set(entityId, name);

      const handlers = this.spawnHandlers.get(name);
      if (handlers) {
        for (const handler of handlers) {
          handler(entityId, def.state);
        }
      }
    } finally {
      this.spawning.delete(name);
    }
  }

  protected destroyObject(name: string): void {
    const entityId = this.activeObjects.get(name);
    if (!entityId) return;

    PVBase.deleteEntity(entityId);
    this.activeObjects.delete(name);
    this.entityNames.delete(entityId);
  }

  protected applyRemoteState(name: string, patch: ObjectState): void {
    const def = this.objects.get(name);
    if (!def) return;

    const changed: ObjectState = {};
    for (const [key, value] of Object.entries(patch)) {
      if (JSON.stringify(def.state[key]) !== JSON.stringify(value)) {
        changed[key] = value;
      }
    }
    // An empty diff means this client already applied the patch locally (its own update echoed back).
    if (Object.keys(changed).length === 0) return;

    Object.assign(def.state, changed);

    const handlers = this.stateHandlers.get(name);
    if (handlers) {
      const entityId = this.activeObjects.get(name);
      for (const handler of handlers) {
        handler(entityId, changed, def.state);
      }
    }
  }

  protected applyRemoteTransform(name: string, coords: Vector3Format, rotation: Vector3Format): void {
    const def = this.objects.get(name);
    if (!def) return;

    // An identical transform means this client already applied it locally (its own update echoed back).
    if (
      JSON.stringify(def.coords) === JSON.stringify(coords) &&
      JSON.stringify(def.rotation) === JSON.stringify(rotation)
    ) {
      return;
    }

    def.coords = coords;
    def.rotation = rotation;

    const entityId = this.activeObjects.get(name);
    if (entityId && DoesEntityExist(entityId)) {
      SetEntityCoordsNoOffset(entityId, coords.x, coords.y, coords.z, false, false, false);
      SetEntityRotation(entityId, rotation.x, rotation.y, rotation.z, 0, false);
    }
  }

  updateState(name: string, patch: ObjectState): void {
    const def = this.objects.get(name);
    if (!def) return;

    Object.assign(def.state, patch);
    emitSocket('world.update-state', name, patch);
  }

  updateTransform(name: string, coords: Vector3Format, rotation: Vector3Format): void {
    const def = this.objects.get(name);
    if (!def) return;

    def.coords = coords;
    def.rotation = rotation;

    const entityId = this.activeObjects.get(name);
    if (entityId && DoesEntityExist(entityId)) {
      SetEntityCoordsNoOffset(entityId, coords.x, coords.y, coords.z, false, false, false);
      SetEntityRotation(entityId, rotation.x, rotation.y, rotation.z, 0, false);
    }

    emitSocket('world.update-transform', name, coords, rotation);
  }

  getEntity(name: string): number | undefined {
    return this.activeObjects.get(name);
  }

  getName(entityId: number): string | undefined {
    return this.entityNames.get(entityId);
  }

  getState(name: string): ObjectState {
    return this.objects.get(name)?.state ?? {};
  }

  onSpawn(name: string, handler: SpawnHandler): void {
    let handlers = this.spawnHandlers.get(name);
    if (!handlers) {
      handlers = new Set();
      this.spawnHandlers.set(name, handlers);
    }
    handlers.add(handler);

    // Fire for objects that spawned before the handler was registered.
    const entityId = this.activeObjects.get(name);
    const def = this.objects.get(name);
    if (entityId && def) {
      handler(entityId, def.state);
    }
  }

  onStateChange(name: string, handler: StateChangeHandler): void {
    let handlers = this.stateHandlers.get(name);
    if (!handlers) {
      handlers = new Set();
      this.stateHandlers.set(name, handlers);
    }
    handlers.add(handler);
  }

  reset(): void {
    for (const name of [...this.activeObjects.keys()]) {
      this.destroyObject(name);
    }
    this.check();
  }

  cleanUp(): void {
    clearInterval(this.interval);
    for (const entityId of this.activeObjects.values()) {
      PVBase.deleteEntity(entityId);
    }
    this.activeObjects.clear();
    this.entityNames.clear();
  }
}

const worldController = WorldController.getInstance();

export default worldController;
