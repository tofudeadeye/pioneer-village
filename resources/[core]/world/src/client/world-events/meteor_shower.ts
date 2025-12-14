import { Log, onSocket } from '@lib/client/comms/ui';
import { Delay } from '@lib/functions';

import ptfxManager from '../managers/ptfx-manager';

let meteorShowerActive = false;

onSocket('world.meteor-shower', async () => {
  if (meteorShowerActive) return;
  meteorShowerActive = true;
  const scale = 1 + Math.random();
  Log('[Meteor Shower]', 'Activating meteor shower', scale);

  await ptfxManager.startFxAtCoords(
    'meteor_shower',
    true,
    'scr_discoverables',
    'scr_disc_meteor_shower',
    { x: 2895.893, y: 1650.213, z: 1000.863 },
    { x: 0, y: 0, z: 0 },
    scale,
  );

  await Delay(10e3 + Math.round(Math.random() * 20e3));

  ptfxManager.stopFx('meteor_shower');
  meteorShowerActive = false;
});
