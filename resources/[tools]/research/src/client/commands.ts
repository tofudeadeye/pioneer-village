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

const delayMult = 2;

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

    Log(`Testing ${componentsData.length} components`);
    let n = -1;
    for (const component of componentsData) {
      n++;
      delete componentsData[n].palette;
      delete componentsData[n].tint0;
      delete componentsData[n].tint1;
      delete componentsData[n].tint2;
      if (component.type === '1') {
        continue;
      }
      if (component.isMp) {
        // continue;
        await PVGame.setPedComponentsMp(playerPed, [component.component]);
      } else {
        // continue;
        await PVGame.setPedComponents(playerPed, [component.component]);
      }
      await PVGame.pedIsReadyToRender(playerPed);
      PVGame.finalizePedOutfit(playerPed);

      await Delay(75 * delayMult);

      const palette = PVCustomization.getTintForCategory(playerPed, component.category);
      if (!palette || palette.palette === 0 || palette.tint0 === 0 || palette.tint1 === 0 || palette.tint2 === 0) {
        continue;
      }

      if (palette.palette in ColorPaletteNames) {
        palette.palette = ColorPaletteNames[palette.palette as keyof typeof ColorPaletteNames];
      }

      componentsData[n].palette = palette.palette;
      componentsData[n].tint0 = palette.tint0;
      componentsData[n].tint1 = palette.tint1;
      componentsData[n].tint2 = palette.tint2;

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

      await Delay(50 * delayMult);

      // if (componentTints.size >= 5) {
      //   break;
      // }
    }

    Log(JSON.stringify(componentsData, null, 2));

    // Log(`Found ${componentTints.size} components with tints resulting in ${alternativeColors.size} unique colors`);
    // Log(Object.fromEntries(componentTints.entries()));
    // Log(Object.fromEntries(alternativeColors.entries()));
  },
  false,
);

RegisterCommand(
  'paletteName',
  async (source: number, args: any[], rawCommand: string) => {
    // Log({ source, args, rawCommand });
    const hash = Number(args[0]);
    for (const [key, value] of Object.entries(ColorPaletteNames)) {
      if (Number(key) === hash) {
        console.log(`Palette name for hash ${hash} is ${value}`);
        return;
      }
    }
  },
  false,
);
