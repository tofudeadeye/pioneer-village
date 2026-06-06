import { eq } from 'drizzle-orm';

import { db } from '../db/connection';
import { type NewWorldObjectSchemaType, type WorldObjectSchemaType, WorldObjectsSchema } from '../db/schema';
import { logInfoS } from '../helpers';

type WorldObjectState = Record<string, unknown>;

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
    networked: true,
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
    networked: true,
    state: { open: false },
  },
];

class WorldObjects {
  private static instance: WorldObjects;

  private cache: Map<string, WorldObjectSchemaType> = new Map();
  private initialized = false;

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
          networked: row.networked,
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
