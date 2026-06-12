import { eq } from 'drizzle-orm';

import { db } from '../db/connection';
import { type NewWorldObjectSchemaType, type WorldObjectSchemaType, WorldObjectsSchema } from '../db/schema';
import { logInfoS } from '../helpers';
import Characters from './characters';

type WorldObjectState = Record<string, unknown>;

const INTEREST_TICK_MS = 5_000;
const INTEREST_RADIUS = 200;
const INTEREST_RADIUS_SQ = INTEREST_RADIUS * INTEREST_RADIUS;

interface CharacterInterest {
  socket: PVCharacterData['socket'];
  names: Set<string>;
}

const SEED_OBJECTS: NewWorldObjectSchemaType[] = [
  {
    name: 'serial::cellar-door-l',
    model: 'P_CS_LUC_BASEDR',
    x: '-609.7892456054688',
    y: '522.194580078125',
    z: '96.08792877197266',
    rotX: '9.34038352966308',
    rotY: '0.22028501331806',
    rotZ: '39.96985626220703',
    state: { open: false },
  },
  {
    name: 'serial::cellar-door-r',
    model: 'P_CS_LUC_BASEDR_1',
    x: '-609.7892456054688',
    y: '522.194580078125',
    z: '96.08792877197266',
    rotX: '9.34038352966308',
    rotY: '0.22028501331806',
    rotZ: '39.96985626220703',
    state: { open: false },
  },
];

class WorldObjects {
  private static instance: WorldObjects;

  private cache: Map<string, WorldObjectSchemaType> = new Map();
  private initialized = false;
  private interestTimer: NodeJS.Timeout | null = null;
  private interests: Map<number, CharacterInterest> = new Map();

  private constructor() {}

  static getInstance(): WorldObjects {
    if (!WorldObjects.instance) {
      WorldObjects.instance = new WorldObjects();
    }
    return WorldObjects.instance;
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    const rows = await db.select().from(WorldObjectsSchema);
    for (const row of rows) {
      this.cache.set(row.name, row);
    }

    await this.seedDefaults();

    this.startInterestTick();

    this.initialized = true;
    logInfoS('[WorldObjects]', `Initialized with ${this.cache.size} objects`);
  }

  list(): WorldObjectSchemaType[] {
    return [...this.cache.values()];
  }

  get(name: string): WorldObjectSchemaType | undefined {
    return this.cache.get(name);
  }

  getState(name: string): WorldObjectState {
    return (this.cache.get(name)?.state as WorldObjectState) ?? {};
  }

  toObjectDef(row: WorldObjectSchemaType): World.ObjectDef {
    return {
      name: row.name,
      model: row.model,
      coords: { x: Number(row.x), y: Number(row.y), z: Number(row.z) },
      rotation: { x: Number(row.rotX), y: Number(row.rotY), z: Number(row.rotZ) },
      state: (row.state as WorldObjectState) ?? {},
    };
  }

  async upsert(row: NewWorldObjectSchemaType): Promise<WorldObjectSchemaType> {
    const [stored] = await db
      .insert(WorldObjectsSchema)
      .values(row)
      .onConflictDoUpdate({
        target: WorldObjectsSchema.name,
        set: {
          model: row.model,
          x: row.x,
          y: row.y,
          z: row.z,
          rotX: row.rotX,
          rotY: row.rotY,
          rotZ: row.rotZ,
          updatedAt: new Date(),
        },
      })
      .returning();

    this.cache.set(stored.name, stored);
    return stored;
  }

  async setState(name: string, patch: WorldObjectState): Promise<WorldObjectSchemaType | undefined> {
    const existing = this.cache.get(name);
    if (!existing) {
      logInfoS('[WorldObjects]', `setState: unknown object "${name}"`);
      return undefined;
    }

    const next: WorldObjectState = { ...(existing.state as WorldObjectState), ...patch };

    const [updated] = await db
      .update(WorldObjectsSchema)
      .set({ state: next, updatedAt: new Date() })
      .where(eq(WorldObjectsSchema.name, name))
      .returning();

    this.cache.set(name, updated);
    return updated;
  }

  async setTransform(
    name: string,
    coords: Vector3Format,
    rotation: Vector3Format,
  ): Promise<WorldObjectSchemaType | undefined> {
    const existing = this.cache.get(name);
    if (!existing) {
      logInfoS('[WorldObjects]', `setTransform: unknown object "${name}"`);
      return undefined;
    }

    const [updated] = await db
      .update(WorldObjectsSchema)
      .set({
        x: coords.x.toString(),
        y: coords.y.toString(),
        z: coords.z.toString(),
        rotX: rotation.x.toString(),
        rotY: rotation.y.toString(),
        rotZ: rotation.z.toString(),
        updatedAt: new Date(),
      })
      .where(eq(WorldObjectsSchema.name, name))
      .returning();

    this.cache.set(name, updated);
    return updated;
  }

  // The user socket lives in the UI resource and survives a world resource restart, so the
  // client announces a fresh start and we forget what was sent to it. The immediate tick
  // resends the full track list without waiting for the next interval.
  resyncSocket(socket: PVCharacterData['socket']): void {
    for (const [characterId, interest] of this.interests.entries()) {
      if (interest.socket === socket) {
        this.interests.delete(characterId);
      }
    }
    this.interestTick();
  }

  private startInterestTick(): void {
    if (this.interestTimer) return;
    this.interestTimer = setInterval(() => this.interestTick(), INTEREST_TICK_MS);
    logInfoS('[WorldObjects]', 'Interest tick started');
  }

  private interestTick(): void {
    const activeCharacterIds = new Set<number>();

    for (const character of Characters.characters) {
      if (!character || character.offline || !character.socket) continue;
      activeCharacterIds.add(character.id);

      let interest = this.interests.get(character.id);
      // A new socket means the client lost everything it was tracking (reconnect or
      // resource restart), so start from an empty set to resend the full track list.
      if (!interest || interest.socket !== character.socket) {
        interest = { socket: character.socket, names: new Set() };
        this.interests.set(character.id, interest);
      }

      const inRange = new Set<string>();
      for (const row of this.cache.values()) {
        const dx = Number(row.x) - character.lastX;
        const dy = Number(row.y) - character.lastY;
        if (dx * dx + dy * dy <= INTEREST_RADIUS_SQ) {
          inRange.add(row.name);
        }
      }

      for (const name of inRange) {
        if (interest.names.has(name)) continue;
        const row = this.cache.get(name);
        if (row) {
          interest.socket.emit('__client__', 'world.track-object', this.toObjectDef(row));
        }
      }

      for (const name of interest.names) {
        if (!inRange.has(name)) {
          interest.socket.emit('__client__', 'world.untrack-object', name);
        }
      }

      interest.names = inRange;
    }

    for (const characterId of this.interests.keys()) {
      if (!activeCharacterIds.has(characterId)) {
        this.interests.delete(characterId);
      }
    }
  }

  private async seedDefaults(): Promise<void> {
    const missing = SEED_OBJECTS.filter((seed) => !this.cache.has(seed.name));
    if (missing.length === 0) return;

    logInfoS('[WorldObjects]', `Seeding ${missing.length} default objects`);
    for (const seed of missing) {
      await this.upsert(seed);
    }
  }
}

export default WorldObjects.getInstance();
