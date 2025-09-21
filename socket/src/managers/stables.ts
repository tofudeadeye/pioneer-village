import { eq, or } from 'drizzle-orm';

import HorseBreedModels from '../../../resources/stable/src/shared/data/horse-breed-models';
import { DNA } from '../../../resources/stable/src/shared/dna';
import { db } from '../db/connection';
import { BrandsSchema, HorsePregnancySchema, type HorseSchemaType, HorsesSchema } from '../db/schema';
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

  async loadCharacterHorsePregnancies(horseIds: number[]) {
    const equalsHorseId = [];

    for (const horseId of horseIds) {
      equalsHorseId.push(eq(HorsePregnancySchema.motherHorseId, horseId));
      equalsHorseId.push(eq(HorsePregnancySchema.fatherHorseId, horseId));
      equalsHorseId.push(eq(HorsePregnancySchema.foalHorseId, horseId));
    }

    const result = await db
      .select()
      .from(HorsePregnancySchema)
      .where(or(...equalsHorseId));

    return result;
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

  async saveHorseLocations(locations: Horse.Location[]) {
    for (const location of locations) {
      if (!location.coords || !location.coords.x || !location.coords.y || !location.coords.z) {
        continue;
      }

      await db
        .update(HorsesSchema)
        .set({
          lastX: String(location.coords.x),
          lastY: String(location.coords.y),
          lastZ: String(location.coords.z),
        })
        .where(eq(HorsesSchema.id, location.horseId));
    }
  }

  async getHorseById(id: number) {
    const horse = await db.select().from(HorsesSchema).where(eq(HorsesSchema.id, id)).limit(1);
    if (horse.length === 0) {
      return null;
    }
    return horse[0];
  }

  async createFoal(dna: Record<string, any>, breeds: Record<string, number>, model: string | number) {
    if (typeof model === 'string') {
      model = model.GetHashKey();
    }

    // Create a new horse entry in the database with default values
    const insertedRows = await db
      .insert(HorsesSchema)
      .values({
        name: '',
        ownerId: 1,
        stable: null,
        brandId: null,
        breeds,
        components: [],
        model,
        gender: 'MALE',
        age: 0,
        weight: '0',
        food: '100',
        water: '100',
        health: '100',
        cleanliness: '100',
        neuteredFixed: false,
        dna,
        statBonding: {},
        hooves: '1',
        horseshoes: '0',
        metadata: null,
        lastX: '0.0',
        lastY: '0.0',
        lastZ: '0.0',
      })
      .returning({ id: HorsesSchema.id });

    if (!insertedRows.length) {
      return;
    }

    return insertedRows[0].id;
  }

  async insertPregnancyRecord(motherHorseId: number, fatherHorseId: number, foalHorseId: number) {
    try {
      const insertedRows = await db.insert(HorsePregnancySchema).values({
        motherHorseId,
        fatherHorseId,
        foalHorseId,
      });

      return (insertedRows.rowCount || 0) > 0;
    } catch {
      await db.delete(HorsesSchema).where(eq(HorsesSchema.id, foalHorseId));

      return false;
    }
  }

  async breedHorses(horseId1: number, horseId2: number) {
    if (horseId1 === horseId2) {
      return;
    }

    const horse1 = await this.getHorseById(horseId1);
    const horse2 = await this.getHorseById(horseId2);

    if (!horse1 || !horse2 || horse1.gender === horse2.gender || horse1.neuteredFixed || horse2.neuteredFixed) {
      return;
    }

    let mother = horse1;
    let father = horse2;

    if (father.gender === 'FEMALE') {
      [mother, father] = [father, mother];
    }

    // logInfo('Breeding horses', mother.name, '<->', father.name);
    const motherDNA = DNA.fromObject(mother.dna);
    const fatherDNA = DNA.fromObject(father.dna);

    const foalDNA = DNA.crossover(motherDNA, fatherDNA, {
      inheritanceMode: 'random',
    });

    const roundGenes = ['OffRoad', 'Health', 'Endurance', 'Handling', 'Speed', 'Acceleration'];

    for (const roundGene of roundGenes) {
      if (foalDNA.hasGene(roundGene)) {
        foalDNA.updateGene(roundGene, Math.round(foalDNA.getGene<number>(roundGene)?.value as number));
      }
    }

    // logInfo('Foal:', foalDNA.toString());

    foalDNA.metadata.generation = motherDNA.metadata.generation + 1;
    // logInfo('Foal Metadata:', foalDNA.metadata);

    const foalBreeds = this.mixBreeds(mother.breeds, father.breeds);

    // logInfo('Foal Breeds:', foalBreeds);
    const primaryBreed = Object.entries(foalBreeds).reduce((a, b) =>
      a[1] > b[1] ? a : b,
    )[0] as keyof typeof HorseBreedModels;
    // logInfo('Foal Primary Breed:', primaryBreed);

    if (!(primaryBreed in HorseBreedModels)) {
      return;
    }

    const foalModel = HorseBreedModels[primaryBreed][Math.floor(Math.random() * HorseBreedModels[primaryBreed].length)];
    // logInfo('Foal Model:', foalModel);

    const foalId = await this.createFoal(foalDNA.toObject(), foalBreeds, foalModel);

    if (!foalId) {
      return;
    }

    await this.insertPregnancyRecord(mother.id, father.id, foalId);

    return foalId;
  }

  mixBreeds(breeds1: Record<string, number>, breeds2: Record<string, number>): Record<string, number> {
    const mixedBreeds: Record<string, number> = {};
    const blendFactor = 0.25 + Math.random() * 0.5; // Random factor between 0.25 and 0.75

    const allBreeds = new Set([...Object.keys(breeds1), ...Object.keys(breeds2)]);

    for (const breed of allBreeds) {
      const value1 = breeds1[breed] || 0;
      const value2 = breeds2[breed] || 0;
      mixedBreeds[breed] = value1 * blendFactor + value2 * (1 - blendFactor);
    }

    return mixedBreeds;
  }
}

export default Stables.instance;
