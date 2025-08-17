import { eq } from 'drizzle-orm';

import { db } from '../db/connection';
import { BrandsSchema, type HorseSchemaType, HorsesSchema } from '../db/schema';
import { logInfo } from '../helpers';

type HorseWithBrand = HorseSchemaType & { brand?: typeof BrandsSchema.$inferSelect | null };

class Stables {
  static readonly instance: Stables = new Stables();

  constructor() {
    if (Stables.instance) {
      throw new Error('Error: Instantiation failed: Use Stables.Instance instead of new.');
    }
  }

  async loadCharacterHorses(characterId: number): Promise<HorseWithBrand[]> {
    const result = await db
      .select()
      .from(HorsesSchema)
      .leftJoin(BrandsSchema, eq(HorsesSchema.brandId, BrandsSchema.id))
      .where(eq(HorsesSchema.ownerId, characterId));

    return result.map((row) => ({
      ...row.Horses,
      brand: row.Brands,
    }));
  }

  async saveHorse(horseId: number, dirtyData: Partial<HorseSchemaType>): Promise<boolean> {
    try {
      await db.update(HorsesSchema).set(dirtyData).where(eq(HorsesSchema.id, horseId));

      logInfo('Horse saved successfully', horseId);
      return true;
    } catch (error) {
      logInfo('Error saving horse', horseId, error);
      return false;
    }
  }
}

export default Stables.instance;
