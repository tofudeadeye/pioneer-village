import { PVCustomization, PVGame } from '@lib/client';
import { Log } from '@lib/client/comms/ui';
import { Delay } from '@lib/functions';
import { ColorPaletteNames } from '@lib/shared/color-palettes';

RegisterCommand(
  'compare_config_flag',
  async (source: number, args: any[], rawCommand: string) => {
    // Log({ source, args, rawCommand });

    const pedOne = Number(args[0]);
    const pedTwo = Number(args[1]);

    for (let i = 1000; i--; ) {
      const flagOne = GetPedConfigFlag(pedOne, i, true);
      const flagTwo = GetPedConfigFlag(pedTwo, i, true);

      if (flagOne !== flagTwo) {
        Log(`Flag ${i} differs: PedOne=${flagOne}, PedTwo=${flagTwo}`);
      }
    }
  },
  false,
);

const componentFiles = [
  '2886757168',
  'accessories',
  'ammo_pistols',
  'ammo_rifles',
  'aprons',
  'armor',
  'badges',
  'beards_chin',
  'beards_chops',
  'beards_complete',
  'beards_mustache',
  'belt_buckles',
  'belts',
  'bodies_lower',
  'bodies_upper',
  'boot_accessories',
  'boots',
  'chaps',
  'cloaks',
  'coats',
  'coats_closed',
  'dresses',
  'eyes',
  'eyewear',
  'gauntlets',
  'gloves',
  'gunbelt_accs',
  'gunbelts',
  'hair',
  'hair_accessories',
  'hats',
  'heads',
  'holsters_crossdraw',
  'holsters_knife',
  'holsters_left',
  'holsters_right',
  'horse_accessories',
  'horse_bedrolls',
  'horse_blankets',
  'horse_bridles',
  'horse_manes',
  'horse_mustache',
  'horse_saddlebags',
  'horse_saddles',
  'horse_shoes',
  'horse_tails',
  'jewelry_bracelets',
  'jewelry_rings_left',
  'jewelry_rings_right',
  'loadouts',
  'masks',
  'masks_large',
  'neckties',
  'neckwear',
  'pants',
  'ponchos',
  'saddle_horns',
  'saddle_lanterns',
  'saddle_stirrups',
  'satchels',
  'shirts_full',
  'skirts',
  'spats',
  'suspenders',
  'talisman_belt',
  'talisman_holster',
  'talisman_satchel',
  'talisman_wrist',
  'teeth',
  'vests',
];

// type AlternativeColorData = Record<string, Set<string>>;
type AlternativeColorData = Record<string, string[]>;

RegisterCommand(
  'componentTest',
  async (source: number, args: any[], rawCommand: string) => {
    // Log({ source, args, rawCommand });
    // const componentsData = JSON.parse(
    //     LoadResourceFile('rdr3-shared', `components/${componentFile}.json`),
    //   ) as Component[];
    const componentsData = JSON.parse(LoadResourceFile('rdr3-shared', `components/hats.json`)) as Component[];

    const playerPed = PlayerPedId();

    const componentTints = new Map<number, Customization.Palette>();
    const alternativeColors = new Map<string | number, AlternativeColorData>();

    for (const component of componentsData) {
      if (component.type === '1') {
        continue;
      }
      if (component.isMp) {
        await PVGame.setPedComponentsMp(playerPed, [component.component]);
      } else {
        continue;
        // await PVGame.setPedComponents(playerPed, [component.component]);
      }
      await PVGame.pedIsReadyToRender(playerPed);
      PVGame.finalizePedOutfit(playerPed);

      await Delay(25);

      const palette = PVCustomization.getTintForCategory(playerPed, component.category);
      if (!palette) {
        continue;
      }

      if (palette.palette in ColorPaletteNames) {
        palette.palette = ColorPaletteNames[palette.palette as keyof typeof ColorPaletteNames];
      }

      componentTints.set(component.component, palette);

      if (!alternativeColors.has(palette.palette)) {
        alternativeColors.set(palette.palette, {});
      }

      const altData = alternativeColors.get(palette.palette)!;
      if (!altData[palette.tint0]) {
        // altData[palette.tint0] = new Set<string>();
        altData[palette.tint0] = [];
      }
      // altData[palette.tint0].add(`${palette.tint1},${palette.tint2}`);
      altData[palette.tint0].push(`${palette.tint1},${palette.tint2}`);

      await Delay(125);

      if (componentTints.size >= 100) {
        break;
      }
    }

    Log(`Found ${componentTints.size} components with tints resulting in ${alternativeColors.size} unique colors`);
    Log(Object.fromEntries(componentTints.entries()));
    Log(Object.fromEntries(alternativeColors.entries()));
  },
  false,
);
