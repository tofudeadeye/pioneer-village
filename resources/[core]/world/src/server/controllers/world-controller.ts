import { Delay } from '@lib/functions';
import { Vector3 } from '@lib/math';
import { awaitSocket, emitSocket, onSocket } from '@lib/server';

const CHECK_INTERVAL_MS = 10_000;
const SPAWN_RANGE_MULTIPLIER = 2; // cellSize * SPAWN_RANGE_MULTIPLIER = max range to consider a player nearby

class WorldController {
  protected static instance: WorldController;

  static getInstance(): WorldController {
    if (!WorldController.instance) {
      WorldController.instance = new WorldController();
    }
    return WorldController.instance;
  }

  cellSize = 50;
  objects: Map<string, World.Object> = new Map();
  networkObjects: Map<string, number> = new Map();
  activeObjects: Map<string, number> = new Map();

  protected interval: CitizenTimer;
  protected receivedNetworkObjects = false;

  constructor() {
    this.interval = setInterval(() => {
      if (this.receivedNetworkObjects) {
        this.check();
      }
    }, CHECK_INTERVAL_MS);

    this.startup();

    // Live updates: the socket pushes new/changed persistent objects after the initial pull.
    onSocket('world.persistent-objects', (objects) => {
      this.applyPersistentObjects(objects);
      this.check();
    });

    onSocket('world.net-id-exists', (netId, callback) => {
      const entity = NetworkGetEntityFromNetworkId(netId);
      const exists = entity !== 0 && DoesEntityExist(entity);
      callback(exists);
    });
  }

  async startup(): Promise<void> {
    // Pull persistent objects directly rather than relying on the socket's connect-time push,
    // which can fire before this resource has registered its listener (boot-order race).
    const persistentObjects = await awaitSocket('world.persistent-objects');
    this.applyPersistentObjects(persistentObjects);

    await this.serverObjects();

    this.check();
  }

  applyPersistentObjects(payload: Record<string, World.PersistentObject>): void {
    for (const obj of Object.values(payload)) {
      if (this.objects.has(obj.name)) continue;
      this.register(GetHashKey(obj.model), obj.coords, obj.rotation, obj.name, { networked: obj.networked });
    }
  }

  async serverObjects(): Promise<void> {
    const serverObjects = await awaitSocket('world.registered-objects');
    for (const [name, id] of Object.entries(serverObjects)) {
      const entity = NetworkGetEntityFromNetworkId(id);
      if (entity !== 0 && DoesEntityExist(entity)) {
        this.activeObjects.set(name, entity);
        this.networkObjects.set(name, id);
      }
    }

    this.receivedNetworkObjects = true;
  }

  async playerInRange(
    objectCoords: Vector3Format,
    maxDistance = this.cellSize * SPAWN_RANGE_MULTIPLIER,
  ): Promise<number | void> {
    let closest = Infinity;
    let closestPlayer = 0;

    const indexes = GetNumPlayerIndices();

    for (let i = 0; i < indexes; i++) {
      const serverId = Number(GetPlayerFromIndex(i));
      if (serverId === 0) continue;

      const playerPed = GetPlayerPed(String(serverId));
      if (playerPed === 0) continue;

      const playerCoords = Vector3.fromArray(GetEntityCoords(playerPed));
      const distance = playerCoords.getDistance(objectCoords);

      if (distance < maxDistance && distance < closest) {
        closest = distance;
        closestPlayer = serverId;
      }
    }

    return closestPlayer || undefined;
  }

  async check(): Promise<void> {
    console.log('[World:Server] check:', this.objects.size, 'registered,', this.activeObjects.size, 'active');
    for (const obj of this.objects.values()) {
      if (this.activeObjects.has(obj.name)) continue;
      if (!obj.networked) continue;
      console.log('[World:Server] check: attempting spawn of', obj.name);
      await this.createObject(obj.name);
    }
  }

  register(
    model: number,
    coords: Vector3Format,
    rotation: Vector3Format,
    name: string,
    options: { networked?: boolean } = {},
  ): void {
    if (this.objects.has(name)) {
      console.warn(`Tried to register object already registered with name: "${name}"`);
      return;
    }

    console.info(`Registering world object: ${name}`);
    this.objects.set(name, { model, coords, rotation, name, networked: options.networked ?? true });
  }

  async createObject(name: string): Promise<void> {
    const worldObject = this.objects.get(name);
    if (!worldObject || !worldObject.networked) return;

    const closestPlayer = await this.playerInRange(worldObject.coords);
    if (!closestPlayer) {
      console.log('[World:Server] createObject: no player in range of', name, '— skipping');
      return;
    }
    console.log('[World:Server] createObject: player', closestPlayer, 'in range of', name);

    const entityId = CreateObject(
      worldObject.model,
      worldObject.coords.x,
      worldObject.coords.y,
      worldObject.coords.z,
      true,
      true,
      false,
    );
    if (entityId === 0) {
      console.log('[World:Server] createObject: CreateObject FAILED for', name);
      return;
    }

    await Delay(1000);
    this.activeObjects.set(name, entityId);

    const netId = NetworkGetNetworkIdFromEntity(entityId);
    const owner = NetworkGetEntityOwner(entityId);
    console.log('[World:Server] createObject: spawned', name, 'entity', entityId, 'netId', netId, 'owner', owner);
    if (owner) {
      emitNet('world.set-coord-rot', owner, netId, worldObject.coords, worldObject.rotation);
    } else {
      console.log('[World:Server] createObject: NO OWNER for', name, '— rotation not applied');
    }

    this.networkObjects.set(name, netId);
    emitSocket('world.register-object', name, netId);
  }

  async destroyObject(name: string): Promise<void> {
    const entityId = this.activeObjects.get(name);
    if (!entityId) return;

    DeleteEntity(entityId);
    this.activeObjects.delete(name);
    this.networkObjects.delete(name);
    emitSocket('world.unregister-object', name);
  }

  getEntity(name: string): number | undefined {
    return this.activeObjects.get(name);
  }

  cleanUp(): void {
    clearInterval(this.interval);
  }
}

const worldController = WorldController.getInstance();

export default worldController;
