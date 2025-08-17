import { addZone, onResourceInit } from '@lib/client';
import { Log } from '@lib/client/comms/ui';

import Stables from '../shared/data/stables';
import { ZonePrefix } from './config';
import stableController from './controllers/stable-controller';

for (const stable of Stables) {
  stableController.addStable(stable);
}

const registerStableZones = async () => {
  Log('registerStableZones');
  for (const stable of Stables) {
    // Log('adding zone', stable.identifier);
    // PVZone.CreatePoly(`${ZonePrefix}${stable.identifier}`, stable.zones.interior, 114.0, 123.0, { debug: true },);
    addZone({
      _type: 'poly',
      name: `${ZonePrefix}${stable.identifier}`,
      coords: stable.zones.interior,
      minZ: 0,
      maxZ: 999,
      options: { debug: false, delayExit: 5000 },
      onEnter() {
        Log(`Entered ${stable.identifier}`);
        stableController.enterStable(stable.identifier);
      },
      onExit() {
        Log(`Exited ${stable.identifier}`);
        stableController.exitStable(stable.identifier);
      },
    });
  }
};

onResourceInit('zones', registerStableZones);
