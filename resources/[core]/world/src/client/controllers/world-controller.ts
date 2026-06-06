import { PVBase, PVGame, awaitUI } from '@lib/client';
import { emitSocket } from '@lib/client/comms/ui';
import { Vector3 } from '@lib/math';

const CHECK_INTERVAL_MS = 5_000;
const SPAWN_RANGE = 100;
const DESPAWN_RANGE = 150;

interface RegisterOptions {
  networked?: boolean;
  persistent?: boolean;
  initialState?: Record<string, unknown>;
  onSpawn?: (entityId: number) => void;
}

class WorldController {
  protected static instance: WorldController;

  static getInstance(): WorldController {
    if (!WorldController.instance) {
      WorldController.instance = new WorldController();
    }
    return WorldController.instance;
  }

  objects: Map<string, World.Object> = new Map();
  networkObjects: Map<string, number> = new Map();
  activeObjects: Map<string, number> = new Map();

  protected interval: CitizenTimer;
  protected serverObjectsInterval: CitizenTimer;
  protected receivedNetworkObjects = false;

  constructor() {
    this.interval = setInterval(() => {
      if (this.receivedNetworkObjects) {
        this.check();
      }
    }, CHECK_INTERVAL_MS);

    this.serverObjectsInterval = setInterval(() => {
      this.serverObjects();
    }, CHECK_INTERVAL_MS);
  }

  async serverObjects(): Promise<void> {
    const serverObjects = await awaitUI('world.registered-objects');
    const names = Object.keys(serverObjects);
    // if (names.length > 0) {
    //   console.log('[World:Client] serverObjects: socket reports', names.length, 'net objects:', names.join(', '));
    // }
    for (const [name, id] of Object.entries(serverObjects)) {
      const exists = NetworkDoesNetworkIdExist(id);
      // console.log(`[World:Client] serverObjects: ${name} netId=${id} exists=${exists}`);
      if (exists) {
        this.activeObjects.set(name, NetworkGetEntityFromNetworkId(id));
        this.networkObjects.set(name, id);
      }
    }

    this.receivedNetworkObjects = true;
  }

  async check(): Promise<void> {
    const playerCoords = Vector3.fromObject(PVGame.playerCoords());

    for (const obj of this.objects.values()) {
      const distance = playerCoords.getDistance2D(obj.coords.x, obj.coords.y);
      const isActive = this.activeObjects.has(obj.name);

      if (!isActive && distance < SPAWN_RANGE) {
        if (obj.networked) {
          if (await awaitUI('world.request-creation', obj.name)) {
            this.createObject(obj.name);
          }
        } else {
          this.createObject(obj.name);
        }
      } else if (isActive && distance > DESPAWN_RANGE && !obj.networked) {
        // Networked objects are managed by FXServer ownership migration — only locally destroy non-networked props
        this.destroyObject(obj.name);
      }
    }
  }

  register(
    model: number,
    coords: Vector3Format,
    rotation: Vector3Format,
    name: string,
    options: RegisterOptions = {},
  ): void {
    if (this.objects.has(name)) {
      console.warn(`Tried to register object already registered with name: "${name}"`);
      return;
    }

    console.info(`Registering world object: ${name}`);
    this.objects.set(name, {
      model,
      coords,
      rotation,
      name,
      networked: options.networked ?? true,
      persistent: options.persistent ?? false,
      initialState: options.initialState,
      onSpawn: options.onSpawn,
    });
  }

  async createObject(name: string): Promise<void> {
    const worldObject = this.objects.get(name);
    if (!worldObject) return;

    const entityId = await PVGame.createObject(
      worldObject.model,
      worldObject.coords,
      worldObject.rotation,
      worldObject.networked,
    );

    this.activeObjects.set(name, entityId);
    if (worldObject.networked) {
      const netId = NetworkGetNetworkIdFromEntity(entityId);
      this.networkObjects.set(name, netId);
      emitSocket('world.register-object', name, netId);
    }

    await this.seedState(worldObject, entityId);

    worldObject.onSpawn?.(entityId);
  }

  protected async seedState(worldObject: World.Object, entityId: number): Promise<void> {
    if (!worldObject.persistent) {
      if (worldObject.initialState) {
        for (const [key, value] of Object.entries(worldObject.initialState)) {
          Entity(entityId).state.set(key, value, worldObject.networked);
        }
      }
      return;
    }

    const stored = await awaitUI('world.load-state', worldObject.name);
    const merged = { ...(worldObject.initialState ?? {}), ...stored };
    for (const [key, value] of Object.entries(merged)) {
      Entity(entityId).state.set(key, value, worldObject.networked);
    }
  }

  async destroyObject(name: string): Promise<void> {
    const entityId = this.activeObjects.get(name);
    if (!entityId) return;

    await PVBase.deleteEntity(entityId);
    this.activeObjects.delete(name);
    this.networkObjects.delete(name);
    emitSocket('world.unregister-object', name);
  }

  getEntity(name: string): number | undefined {
    return this.activeObjects.get(name);
  }

  cleanUp(): void {
    clearInterval(this.interval);
    clearInterval(this.serverObjectsInterval);
    for (const name of this.objects.keys()) {
      emitSocket('world.unregister-object', name);
    }
    for (const entityId of this.activeObjects.values()) {
      PVBase.deleteEntity(entityId);
    }
  }
}

const worldController = WorldController.getInstance();

export default worldController;
