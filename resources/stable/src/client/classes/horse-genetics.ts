import { PVBase, PVCustomization, PVGame } from '@lib/client';
import { Log } from '@lib/client/comms/ui';
import { Delay } from '@lib/functions';

import HorseModelScales from '../../shared/data/horse-model-scales';
import { CreepMutation, DNA, DNABuilder, DNAUtils, GaussianMutation } from './dna';

// <editor-fold desc="Gene Registration">
DNAUtils.geneBuilder('OffRoad')
  .dominance(0.5)
  .mutationRate(0.05)
  .dataType('number')
  .range(0, 2000)
  .shorthand('O')
  .mutationStrategy(new GaussianMutation(0.05))
  .register();

DNAUtils.geneBuilder('Health')
  .dominance(0.5)
  .mutationRate(0.05)
  .dataType('number')
  .range(0, 2000)
  .shorthand('H')
  .mutationStrategy(new GaussianMutation(0.05))
  .register();

DNAUtils.geneBuilder('Endurance')
  .dominance(0.5)
  .mutationRate(0.05)
  .dataType('number')
  .range(0, 2000)
  .shorthand('E')
  .mutationStrategy(new GaussianMutation(0.05))
  .register();

DNAUtils.geneBuilder('Sterile').dominance(0.25).mutationRate(0.05).dataType('boolean').shorthand('F').register();

DNAUtils.geneBuilder('Handling')
  .dominance(0.5)
  .mutationRate(0.05)
  .dataType('number')
  .range(0, 2000)
  .shorthand('Ha')
  .mutationStrategy(new GaussianMutation(0.05))
  .register();

DNAUtils.geneBuilder('Speed')
  .dominance(0.5)
  .mutationRate(0.05)
  .dataType('number')
  .range(0, 2000)
  .shorthand('S')
  .mutationStrategy(new GaussianMutation(0.05))
  .register();

DNAUtils.geneBuilder('Acceleration')
  .dominance(0.5)
  .mutationRate(0.05)
  .dataType('number')
  .range(0, 2000)
  .shorthand('A')
  .mutationStrategy(new GaussianMutation(0.05))
  .register();

DNAUtils.geneBuilder('BodyTint0')
  .mutationRate(0.5)
  .dataType('number')
  .range(0, 254)
  .shorthand('BT0')
  .mutationStrategy(new GaussianMutation(1 / 255))
  .register();

DNAUtils.geneBuilder('BodyTint1')
  .mutationRate(0.5)
  .dataType('number')
  .range(0, 254)
  .shorthand('BT1')
  .mutationStrategy(new GaussianMutation(1 / 255))
  .register();

DNAUtils.geneBuilder('BodyTint2')
  .mutationRate(0.5)
  .dataType('number')
  .range(0, 254)
  .shorthand('BT2')
  .mutationStrategy(new GaussianMutation(1 / 255))
  .register();

DNAUtils.geneBuilder('HairTint0')
  .mutationRate(0.5)
  .dataType('number')
  .range(0, 254)
  .shorthand('HT0')
  .mutationStrategy(new GaussianMutation(1 / 255))
  .register();

DNAUtils.geneBuilder('HairTint1')
  .mutationRate(0.5)
  .dataType('number')
  .range(0, 254)
  .shorthand('HT1')
  .mutationStrategy(new GaussianMutation(1 / 255))
  .register();

DNAUtils.geneBuilder('HairTint2')
  .mutationRate(0.5)
  .dataType('number')
  .range(0, 254)
  .shorthand('HT2')
  .mutationStrategy(new GaussianMutation(1 / 255))
  .register();

DNAUtils.geneBuilder('Scale')
  .dominance(0.5)
  .mutationRate(0.5)
  .dataType('number')
  .range(0.85, 1.15)
  .shorthand('Sc')
  // .mutationStrategy(new GaussianMutation(0.05))
  .mutationStrategy(new CreepMutation(0.05))
  .register();

// Register Expression Genes
const expressions = {
  ['cannon']: 60975,
  ['ass size']: 62347,
  ['belly height']: 63348,
  ['belly width']: 57577,
  ['belly x pos']: 60649,
  ['belly y pos']: 18278,
  ['body size']: 10726,
  ['forehead height']: 55026,
  ['head size']: 48003,
  ['head width']: 43213,
  ['hind legs']: 16934,
  ['hooves height']: 9675,
  ['pedal size']: 39436, // Hooves Size
  ['knee and hock size']: 26933,
  ['left ear forward backward']: 19812,
  ['left ear size']: 22538,
  ['left ear x pos']: 19813,
  ['left eye forward backward']: 17185,
  ['left eye height']: 17186,
  ['left eye size']: 34338,
  ['left nostril size']: 35608,
  ['muscle tone veins']: 8147,
  ['muscles']: 3015,
  ['neck height']: 10002,
  ['neck height base']: 42991,
  ['neck thickness']: 26839,
  ['nose bridge depth']: 62196,
  ['nose bridge height']: 29982,
  ['nose length']: 3054,
  ['nose size']: 22549,
  ['rear back height']: 11904,
  ['right ear forward backward']: 19780,
  ['right ear size']: 23050,
  ['right ear x pos']: 19781,
  ['right eye forward backward']: 17697,
  ['right eye height']: 17698,
  ['right eye size']: 34850,
  ['right nostril size']: 36120,
  ['tail angle']: 54287,
  ['thighs']: 36550,
  ['throat size']: 2075,
  ['under jaw sagging']: 1589,
  ['front legs']: 8420,
  ['chest size']: 41478,
};

for (const [name, id] of Object.entries(expressions)) {
  // console.log(`Registering expression gene: ${name} (${id})`);
  const shorthand = name
    .split(' ')
    .map((part) => {
      if (part === 'size') {
        return 'Sz';
      }
      if (part === 'eye') {
        return part.charAt(0).toUpperCase() + part.charAt(1);
      }
      return part.charAt(0).toUpperCase();
    })
    .join('');
  DNAUtils.geneBuilder(name)
    .mutationRate(0.5)
    .dataType('number')
    .range(-1, 1)
    .shorthand(shorthand)
    .mutationStrategy(new GaussianMutation(0.33))
    .register();
}
// </editor-fold>

RegisterCommand(
  'HorseBreedingTest',
  async (source: number, args: any[], rawCommand: string) => {
    // Log({ source, args, rawCommand });
    const model1 =
      args[0] || Object.keys(HorseModelScales)[Math.floor(Math.random() * Object.keys(HorseModelScales).length)];
    const model2 =
      args[1] || Object.keys(HorseModelScales)[Math.floor(Math.random() * Object.keys(HorseModelScales).length)];
    Log('Breeding', model1, 'and', model2);

    if (!(model1 in HorseModelScales)) {
      Log('Invalid horse model1:', model1);
      return;
    }
    if (!(model2 in HorseModelScales)) {
      Log('Invalid horse model2:', model2);
      return;
    }

    const coords = PVGame.playerCoords();
    const parent1Ped = await PVGame.createPed(model1, coords.x + 7, coords.y - 1, coords.z - 1, 90, true, true);
    const parent2Ped = await PVGame.createPed(model2, coords.x + 7, coords.y + 1, coords.z - 1, 90, true, true);

    await PVGame.pedIsReadyToRender(parent1Ped);
    await PVGame.pedIsReadyToRender(parent2Ped);

    const parent1HeadIndex = PVCustomization.getIndexForHorsePart(parent1Ped, 'hand');
    Log('parent1HeadIndex', parent1HeadIndex);
    const parent2HeadIndex = PVCustomization.getIndexForHorsePart(parent1Ped, 'hand');
    Log('parent2HeadIndex', parent2HeadIndex);
    const parent1ManeIndex = PVCustomization.getIndexForHorsePart(parent1Ped, 'mane');
    Log('parent1ManeIndex', parent1ManeIndex);
    const parent2ManeIndex = PVCustomization.getIndexForHorsePart(parent1Ped, 'mane');
    Log('parent2ManeIndex', parent2ManeIndex);

    await Delay(1_000);
    // PVBase.deleteEntities([parent1Ped, parent2Ped]);

    const parent1HeadTints = PVCustomization.getTintAtIndex(parent1Ped, parent1HeadIndex);
    // Log('parent1HeadTints', parent1HeadTints);
    const parent2HeadTints = PVCustomization.getTintAtIndex(parent2Ped, parent2HeadIndex);
    // Log('parent2HeadTints', parent2HeadTints);
    const parent1ManeTints = PVCustomization.getTintAtIndex(parent1Ped, parent1ManeIndex);
    // Log('parent1ManeTints', parent1ManeTints);
    const parent2ManeTints = PVCustomization.getTintAtIndex(parent2Ped, parent2ManeIndex);
    // Log('parent2ManeTints', parent2ManeTints);

    // @ts-ignore
    const parent1Scale = HorseModelScales[model1];
    // @ts-ignore
    const parent2Scale = HorseModelScales[model2];

    // if (Math.random() < Infinity) {
    //   return;
    // }

    // Create parent DNAs
    const parent1builder = new DNABuilder()
      .withMetadata('name', 'Parent 1')
      .withMetadata('generation', 0)
      .addGene('OffRoad', 2000)
      .addGene('Health', 2000)
      .addGene('Endurance', 2000)
      .addGene('Handling', 2000)
      .addGene('Speed', 2000)
      .addGene('Acceleration', 2000)
      .addGene('Scale', parent1Scale)
      .addGene('BodyTint0', parent1HeadTints.tint0)
      .addGene('BodyTint1', parent1HeadTints.tint1)
      .addGene('BodyTint2', parent1HeadTints.tint2)
      .addGene('HairTint0', parent1ManeTints.tint0)
      .addGene('HairTint1', parent1ManeTints.tint1)
      .addGene('HairTint2', parent1ManeTints.tint2);

    const parent2builder = new DNABuilder()
      .withMetadata('name', 'Parent 2')
      .withMetadata('generation', 0)
      .addGene('OffRoad', 1000)
      .addGene('Health', 1000)
      .addGene('Endurance', 1000)
      .addGene('Handling', 1000)
      .addGene('Speed', 1000)
      .addGene('Acceleration', 1000)
      .addGene('Scale', parent2Scale)
      .addGene('BodyTint0', parent2HeadTints.tint0)
      .addGene('BodyTint1', parent2HeadTints.tint1)
      .addGene('BodyTint2', parent2HeadTints.tint2)
      .addGene('HairTint0', parent2ManeTints.tint0)
      .addGene('HairTint1', parent2ManeTints.tint1)
      .addGene('HairTint2', parent2ManeTints.tint2);

    for (const [name, id] of Object.entries(expressions)) {
      const value1 = GetPedFaceFeature(parent1Ped, id);
      const value2 = GetPedFaceFeature(parent2Ped, id);
      parent1builder.addGene(name, value1);
      parent2builder.addGene(name, value2);
    }
    // getComponents(parent1Ped);
    // getComponents(parent2Ped);

    let parent1 = parent1builder.build();
    let parent2 = parent2builder.build();

    // Log('Parent 1:', parent1.toString());
    // Log('Parent 2:', parent2.toString());

    async function spawnChildHorse(child: DNA, offsetX = 0, offsetY = 0) {
      const model = Math.random() > 0.5 ? model1 : model2;
      // const model = model1;
      const coords = PVGame.playerCoords();
      // const offsety = Math.random() * 10 - 5;
      const horsePed = await PVGame.createPed(
        model,
        coords.x + 3 + offsetX,
        coords.y + offsetY,
        coords.z - 1,
        180,
        true,
        true,
      );

      for (const [name, id] of Object.entries(expressions)) {
        const gene = child.getGene(name);
        if (gene) {
          SetPedFaceFeature(horsePed, id, gene.value as number);
        }
      }

      await PVGame.pedIsReadyToRender(horsePed);

      SetPedScale(horsePed, child.getGene<number>('Scale')?.value || 1.0);
      // Log('Scale', child.getGene<number>('Scale')?.value || 1.0);

      for (const part of ['head', 'hand']) {
        PVCustomization.setTintByHorsePart(
          horsePed,
          // @ts-ignore
          part,
          'metaped_tint_horse',
          Math.floor(child.getGene<number>('BodyTint0')?.value || 0),
          Math.floor(child.getGene<number>('BodyTint1')?.value || 0),
          Math.floor(child.getGene<number>('BodyTint2')?.value || 0),
        );

        // Log(
        //   `Set ${part} tint to`,
        //   Math.floor(child.getGene<number>('BodyTint0')?.value || 0),
        //   Math.floor(child.getGene<number>('BodyTint1')?.value || 0),
        //   Math.floor(child.getGene<number>('BodyTint2')?.value || 0),
        // );
      }

      for (const part of ['hair', 'mane']) {
        PVCustomization.setTintByHorsePart(
          horsePed,
          // @ts-ignore
          part,
          'metaped_tint_horse',
          Math.floor(child.getGene<number>('HairTint0')?.value || 0),
          Math.floor(child.getGene<number>('HairTint1')?.value || 0),
          Math.floor(child.getGene<number>('HairTint2')?.value || 0),
        );
        // Log(
        //   `Set ${part} tint to`,
        //   Math.floor(child.getGene<number>('HairTint0')?.value || 0),
        //   Math.floor(child.getGene<number>('HairTint1')?.value || 0),
        //   Math.floor(child.getGene<number>('HairTint2')?.value || 0),
        // );
      }

      PVGame.finalizePedOutfit(horsePed);

      console.log('horsePed', horsePed);

      return horsePed;
    }

    const count = 20;
    for (let i = count; i--; ) {
      // Create offspring with advanced crossover
      const child1 = DNA.crossover(parent1, parent2, {
        inheritanceMode: 'random',
      });
      const child2 = DNA.crossover(parent1, parent2, {
        inheritanceMode: 'random',
      });

      // Log('Child:', child1.toString());
      // Log('Child:', child2.toString());

      child1.metadata.generation = parent1.metadata.generation + 1;
      child2.metadata.generation = parent2.metadata.generation + 1;
      // Log('Child Metadata:', child1.metadata);
      // Log('Child Metadata:', child2.metadata);

      const horsePed1 = await spawnChildHorse(child1, 0, (i - count / 2) * 3);
      const horsePed2 = await spawnChildHorse(child2, 1, (i - count / 2) * 3);

      setTimeout(() => {
        PVBase.deleteEntities([horsePed1, horsePed2]);
      }, 15_000);

      if (i % 5 === 0) {
        parent1 = child1;
        parent2 = child2;
      }
    }

    setTimeout(() => {
      PVBase.deleteEntities([parent1Ped, parent2Ped]);
    }, 15_000);
  },
  false,
);

const ped = 166404;
// PVCustomization.setTint(ped, 'metaped_tint_horse', 0, 0, 0);
// PVCustomization.removeTint(ped);
PVCustomization.setTintByHorsePart(
  ped,
  'head',
  'metaped_tint_horse',
  Math.floor(Math.random() * 255),
  Math.floor(Math.random() * 255),
  Math.floor(Math.random() * 255),
);
PVCustomization.setTintByHorsePart(
  ped,
  'hand',
  'metaped_tint_horse',
  Math.floor(Math.random() * 255),
  Math.floor(Math.random() * 255),
  Math.floor(Math.random() * 255),
);
PVCustomization.setTintByHorsePart(
  ped,
  'hair',
  'metaped_tint_horse',
  Math.floor(Math.random() * 255),
  Math.floor(Math.random() * 255),
  Math.floor(Math.random() * 255),
);
PVCustomization.setTintByHorsePart(
  ped,
  'mane',
  'metaped_tint_horse',
  Math.floor(Math.random() * 255),
  Math.floor(Math.random() * 255),
  Math.floor(Math.random() * 255),
);
PVGame.finalizePedOutfit(ped);

function getComponents(entity: number) {
  const metaPedType = GetMetaPedType(entity);
  const componentCount = GetNumComponentsInPed(entity);

  for (let i = componentCount; i--; ) {
    const struct1 = new DataView(new ArrayBuffer(4));
    const struct2 = new DataView(new ArrayBuffer(4));

    // @ts-ignore
    const [component, argStruct, wearableState] = GetShopItemComponentAtIndex(entity, i, true, struct1, struct2) as [
      number,
      number,
      number,
    ];
    const componentCategory = GetShopItemComponentCategory(component, metaPedType, true);

    const palette = PVCustomization.getTintAtIndex(entity, i);
    if (palette.palette !== 0) {
      Log(i, component, componentCategory, palette.palette, palette.tint0, palette.tint1, palette.tint2);
    }
  }
}

/*
const PedAttribute = {
    PA_HEALTH: 0, // 1100 | 1700
    PA_STAMINA: 1, // 1100 | 1700
    PA_SPECIALABILITY: 2, // 1100 | 0
    PA_COURAGE: 3, // 0 | 1700
    PA_AGILITY: 4, // 0 | 1700
    PA_SPEED: 5, // 0 | 1700
    PA_ACCELERATION: 6, // 0 | 1700
    PA_BONDING: 7, // 0 | 2450
    SA_HUNGER: 8, // 100 | 100
    SA_FATIGUED: 9, // 100 100
    SA_INEBRIATED: 10, // 100 | 0
    SA_POISONED: 11, // 100 | 0
    SA_BODYHEAT: 12, // 100 | 100
    SA_BODYWEIGHT: 13, // 100 | 100
    SA_OVERFED: 14, // 100 | 100
    SA_SICKNESS: 15, // 100 | 0
    SA_DIRTINESS: 16, // 10000 | 10000
    SA_DIRTINESSHAT: 17, // 10000 | 10000
    MTR_STRENGTH: 18, // 100 | 100
    MTR_GRIT: 19, // 100 | 100
    MTR_INSTINCT: 20, // 100 | 0
    PA_UNRULINESS: 21, // 0 | 100
    SA_DIRTINESSSKIN: 22, // 10000 | 10000
};

Horse Attribute Ranks 0,1,3
Rank | Points
  3  | 0
  4  | 50
  5  | 100
  6  | 200
  7  | 350
  8  | 550
  9  | 800
 10  | 1100
 11  | 1400
 12  | 1700

Horse Attribute Ranks 4,5,6
Rank | Points
  0   | 0
  1  | 50
  2  | 100
  3  | 200
  4  | 350
  5  | 550
  6  | 800
  7  | 1100
  8  | 1400
  9  | 1700

Horse Attribute Ranks 7
Rank | Points
  0  | 0 | 0-49 Knocks off less frequently the higher number
  1  | 50 | 50+ Whistle Distance?
  2  | 400
  3  | 1150
  4  | 2450

Horse Attribute Points 8 = Unknown < & >= 25 Checks

Horse Attribute Points 13 = Weight
  0  | Malnourished
 10  | Thin
 30  | Fit
 70  | Overweight
 90  | Obese

SetAttributePoints(horse, 7, n) // Bonding
GetAttributeRank(horse, 7) // Bonding

TaskHorseAction
1,5, Rear
2,10, Rear Knock Off
8,9, Jump a bit

Citizen.InvokeNative(0x3B005FF0538ED2A9, entityId) // _GET_IS_WILD
Citizen.InvokeNative(0xAEB97D84CDF3C00B, entityId, 1) // _SET_IS_WILD

*/

function pointsToRank(points: number): number {
  if (points < 50) {
    return 0;
  }
  if (points < 100) {
    return 1;
  }
  if (points < 200) {
    return 2;
  }
  if (points < 350) {
    return 3;
  }
  if (points < 550) {
    return 4;
  }
  if (points < 800) {
    return 5;
  }
  if (points < 1100) {
    return 6;
  }
  if (points < 1400) {
    return 7;
  }
  if (points < 1700) {
    return 8;
  }
  return 9;
}

RegisterCommand(
  'getAttributes',
  async (source: number, args: any[], rawCommand: string) => {
    for (let n = 0; n <= 22; n++) {
      const attr = GetAttributePoints(Number(args[0]), n);
      Log(`Attribute ${n}: ${attr} Rank: ${pointsToRank(attr)}`);
    }
  },
  false,
);
