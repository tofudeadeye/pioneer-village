import { PVGame, onUI } from '@lib/client';
import { Delay } from '@lib/functions';

import { componentManager } from '../managers/component-manager';
import { creationManager } from '../managers/creation-manager';
import { paletteManager } from '../managers/palette-manager';

on('customization:client:character_creation', () => {
  creationManager.start();
});

onUI('customization.set-components', (components) => {
  console.log('customization.set-components', components);
  creationManager.setComponents(components);
});

onUI('customization.set-components-with-tints', (components) => {
  console.log('customization.set-components-with-tints', ...components);
  creationManager.setComponentsWithTints(components);
});

onUI('customization.set-tint-by-category', (category, data) => {
  console.log('customization.set-tint-by-category', category, data);

  if (data.palette !== 0) {
    const ped = creationManager.isActive ? creationManager.getChosen() : PVGame.playerPed();
    paletteManager.setTintByCategory(ped, category, data.palette, data.tint0, data.tint1, data.tint2);
    // paletteManager.setTintByHorsePart(
    //   713474,
    //   // @ts-ignore
    //   'head',
    //   data.palette,
    //   data.tint0,
    //   data.tint1,
    //   data.tint2,
    // );
  }
});

onUI('customization.set-wearable-state', (category, state) => {
  const ped = creationManager.isActive ? creationManager.getChosen() : PVGame.playerPed();
  componentManager.setWearableState(category, state, ped);
});

onUI('customization.highlight', (gender) => {
  creationManager.highlightGender(gender);
});

onUI('customization.choose-gender', () => {
  creationManager.chooseGender();
});

onUI('customization.set-state', (state) => {
  creationManager.setState(state);
});

onUI('customization.set-skin-tone', (skinTone) => {
  creationManager.setSkinTone(skinTone);
});

onUI('customization.set-head', (head) => {
  creationManager.setHead(head);
});

onUI('customization.set-teeth', (teeth) => {
  console.log('customization.set-teeth', teeth);
  creationManager.setTeeth(teeth);
});

onUI('customization.set-body-type', (bodyType) => {
  creationManager.setBodyType(bodyType);
});

onUI('customization.set-waist', (waist) => {
  creationManager.setWaist(waist);
});

onUI('customization.set-face-option', (options) => {
  console.log(options);
  creationManager.setFaceOptions(options);
});

onUI('customization.set-face-feature', (feature, value) => {
  console.log('customization.set-face-feature', feature, value);
  creationManager.setFaceFeature(feature, value);
});

onUI('customization.set-layers', (layers: UI.Customization.LayerData[]) => {
  console.log('overlaycustomization.set-layers', layers);

  creationManager.setOverlays(layers);
});

onUI('customization.rotate-chosen', (rotation) => {
  creationManager.rotateChosen(rotation);
});

onUI('customization.finalized', async () => {
  await Delay(250);
  creationManager.destroy();
});

RegisterCommand(
  'set_face_option',
  async (source: number, args: string[]) => {
    const ped = args[2] ? Number(args[2]) : PlayerPedId();
    SetCharExpression(ped, Number(args[0]), Number(args[1]));
    console.log(`SetCharExpression(${ped}, ${Number(args[0])}, ${Number(args[1])})`);
    UpdatePedVariation(ped, false, true, true, true, false);
  },
  false,
);

RegisterCommand(
  'create_start',
  () => {
    creationManager.start();
  },
  false,
);

RegisterCommand(
  'create_end',
  () => {
    creationManager.destroy();
  },
  false,
);

RegisterCommand(
  'create_rotate',
  async (source: number, args: string[]) => {
    creationManager.rotateChosen(Number(args[0]));
  },
  false,
);

RegisterCommand(
  'create_camera',
  async (source: number, args: string[]) => {
    // @ts-ignore
    creationManager.chooseCamera(args[0]);
  },
  false,
);
