import { logInfoC, logInfoS } from '../helpers';
import Stables from '../managers/stables';
import { serverNamespace, userNamespace } from '../server';

export default () => {
  serverNamespace.on('connection', (socket) => {
    socket.on('stable.horse-locations', async (locations: Horse.Location[]) => {
      logInfoS('stable.horse-locations', locations);

      await Stables.saveHorseLocations(locations);
    });
  });

  userNamespace.on('connection', (socket) => {
    socket.on('stable.load-character-horses', async (characterId: number, cb) => {
      logInfoC('stable.load-character-horses', characterId);

      const horses: Horse.Data[] = [];
      for (const drizzleHorse of await Stables.loadCharacterHorses(characterId)) {
        const horse: Horse.Data = {
          id: drizzleHorse.id,
          name: drizzleHorse.name,
          ownerId: drizzleHorse.ownerId,
          stable: drizzleHorse.stable,
          brandId: drizzleHorse.brandId,
          breeds: JSON.parse(JSON.stringify(drizzleHorse.breeds || {})),
          components: drizzleHorse.components,
          model: drizzleHorse.model,
          gender: drizzleHorse.gender,
          age: drizzleHorse.age,
          weight: Number(drizzleHorse.weight || '0'),
          food: Number(drizzleHorse.food || '0'),
          water: Number(drizzleHorse.water || '0'),
          health: Number(drizzleHorse.health || '0'),
          cleanliness: Number(drizzleHorse.cleanliness || '0'),
          neuteredFixed: drizzleHorse.neuteredFixed || false,
          // statOffRoad: drizzleHorse.statOffRoad,
          // statHealth: drizzleHorse.statHealth,
          // statEndurance: drizzleHorse.statEndurance,
          // statFertility: drizzleHorse.statFertility,
          // statHandling: drizzleHorse.statHandling,
          // statSpeed: drizzleHorse.statSpeed,
          // statAcceleration: drizzleHorse.statAcceleration,
          dna: JSON.parse(JSON.stringify(drizzleHorse.dna || {})),
          statBonding: JSON.parse(JSON.stringify(drizzleHorse.statBonding || {})),
          hooves: Number(drizzleHorse.hooves || '0'),
          horseshoes: Number(drizzleHorse.horseshoes || '0'),
          metadata: JSON.parse(JSON.stringify(drizzleHorse.metadata || {})),
          lastX: Number(drizzleHorse.lastX || '0'),
          lastY: Number(drizzleHorse.lastY || '0'),
          lastZ: Number(drizzleHorse.lastZ || '0'),
          createdAt: drizzleHorse.createdAt?.toISOString() || new Date().toISOString(),
        };
        horses.push(horse);

        logInfoC('loaded horse:', horse.id, horse.name);
      }

      const pregnancies: Horse.Pregnancy[] = [];
      for (const drizzlePregnany of await Stables.loadCharacterHorsePregnancies(horses.map((h) => h.id))) {
        const pregnancy: Horse.Pregnancy = {
          id: drizzlePregnany.id,
          motherId: drizzlePregnany.motherHorseId,
          fatherId: drizzlePregnany.fatherHorseId,
          foalId: drizzlePregnany.foalHorseId,
          conceivedAt: drizzlePregnany.conceivedAt?.toISOString() || new Date().toISOString(),
          status: drizzlePregnany.status,
        };
        pregnancies.push(pregnancy);

        logInfoC(
          'loaded pregnancy:',
          pregnancy.id,
          'mother:',
          pregnancy.motherId,
          'father:',
          pregnancy.fatherId,
          'foal:',
          pregnancy.foalId,
        );
      }

      cb([horses, pregnancies]);
    });

    socket.on('stable.save-horse', async (horseData: Horse.DirtyData, cb) => {
      const { id: horseId, ...dirtyData } = horseData;
      logInfoC('stable.save-horse', horseId, dirtyData);

      // @ts-expect-error apparently lastX is typed as a string, but it is a decimal...
      const result = await Stables.saveHorse(horseId, dirtyData);
      if (result) {
        logInfoC('stable.save-horse', horseId, 'success');
        cb(true);
        return;
      }

      cb(false);
    });

    socket.on('stable.breed-horses', async (horseId1: number, horseId2: number, cb) => {
      logInfoC('stable.breed-horses', horseId1, horseId2);

      const newHorses = await Stables.breedHorses(horseId1, horseId2);

      cb(newHorses);
    });
  });
};
