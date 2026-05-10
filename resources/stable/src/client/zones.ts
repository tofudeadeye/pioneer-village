import { addZone, onResourceInit } from '@lib/client';

import Stables from '../shared/data/stableData';
import { ZonePrefix } from './config';
import stableController from './controllers/stable-controller';

for (const stable of Stables) {
  stableController.addStable(stable);
}

const registerStableZones = async () => {
  console.log('registerStableZones');
  for (const stable of Stables) {
    // console.log('adding zone', stable.identifier);
    // PVZone.CreatePoly(`${ZonePrefix}${stable.identifier}`, stable.zones.interior, 114.0, 123.0, { debug: true },);
    addZone({
      _type: 'poly',
      name: `${ZonePrefix}${stable.identifier}`,
      coords: stable.zones.interior,
      minZ: -50,
      maxZ: 999,
      options: { debug: false, delayExit: 5000 },
      onEnter() {
        console.log(`Entered ${stable.identifier}`);
        stableController.enterStable(stable.identifier);
      },
      onExit() {
        console.log(`Exited ${stable.identifier}`);
        stableController.exitStable(stable.identifier);
      },
    });
  }
};

onResourceInit('zones', registerStableZones);
