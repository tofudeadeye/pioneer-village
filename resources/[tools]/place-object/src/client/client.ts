import { PVInit, PVPrompt } from '@lib/client';

import './exports';
import './helpers';
import PlacementManager from './managers/placement-manager';

const placementManager = PlacementManager.getInstance();

RegisterCommand(
  'placeObject',
  async (source: number, args: string[]) => {
    const objects = await placementManager.queuePlaceObject(GetHashKey(args[0]), Number(args[1] || 1));
    console.log('done placing objects');
    console.log(objects);
  },
  false,
);

RegisterCommand(
  'placeObjects',
  async (source: number, args: string[]) => {
    const allObjects = [];
    for (const arg of args) {
      allObjects.push(...(await placementManager.queuePlaceObject(GetHashKey(arg))));
    }
    console.log('done placing objects');
    console.log(allObjects);
  },
  false,
);

const registerPrompts = async () => {
  await PVInit.initializedResource('prompts');
  console.log('place-object: registering prompts');
  PVPrompt.registerWithEvent('createHold', 'place-object::place', 0xcefd9220, 'Place Object');

  PVPrompt.registerWithEvent('createHold', 'place-object::ground', 0x760a9c6f, 'Un-Ground');

  PVPrompt.registerWithEvent('createHold', 'place-object::cancel', 0xde794e3e, 'Cancel');
};

on('onResourceStart', (resource: string) => {
  if (resource !== 'prompts') {
    return;
  }
  registerPrompts();
});

if (GetResourceState('prompts') === 'started') {
  registerPrompts();
}

on('onResourceStop', (resource: string) => {
  if (resource !== GetCurrentResourceName()) {
    return;
  }
  placementManager.cleanup();
});
