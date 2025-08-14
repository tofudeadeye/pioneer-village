import './helpers';
import './exports';

import { PVInit, PVPrompt } from '@lib/client';
import PlacementManager from './managers/placement-manager';
import { Log } from '@lib/client/comms/ui';

const placementManager = PlacementManager.getInstance();

RegisterCommand(
  'placeObject',
  async (source: number, args: string[]) => {
    const objects = await placementManager.queuePlaceObject(GetHashKey(args[0]), Number(args[1] || 1));
    Log('done placing objects');
    Log(objects);
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
    Log('done placing objects');
    Log(allObjects);
  },
  false,
);

const registerPrompts = async () => {
  await PVInit.initializedResource('prompts');
  Log('place-object: registering prompts');
  PVPrompt.registerWithEvent('createHold', 'place-object::place', 0xcefd9220, 'Place Object');

  PVPrompt.registerWithEvent('createHold', 'place-object::ground', 0x760a9c6f, 'Un-Ground');

  PVPrompt.registerWithEvent('createHold', 'place-object::cancel', 0xde794e3e, 'Cancel');
};

on('onResourceStart', (resource: string) => {
  if (resource === 'prompts') {
    registerPrompts();
  }
});

on('onResourceStop', (resource: string) => {
  placementManager.cleanup();
});

if (GetResourceState('prompts') === 'started') {
  registerPrompts();
}
