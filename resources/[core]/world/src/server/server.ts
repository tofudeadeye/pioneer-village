import { Vector3 } from '@lib/math';
import { PVBase, emitSocket } from '@lib/server';

import worldController from './controllers/world-controller';

/*
 * Serial Killer Cellar.
 */
const doorCoords = new Vector3(-609.7892456054688, 522.194580078125, 96.08792877197266);
const doorRot = new Vector3(9.34038352966308, 0.22028501331806, 39.96985626220703);

setTimeout(() => {
  worldController.register(GetHashKey('P_CS_LUC_BASEDR'), doorCoords, doorRot, 'serial::cellar-door-l');
  worldController.register(GetHashKey('P_CS_LUC_BASEDR_1'), doorCoords, doorRot, 'serial::cellar-door-r');
}, 5000);

// <editor-fold desc="Cron Events">
const registerCronEvents = () => {
  emitSocket('cron.register-event', 'meteor-shower', {
    type: 'client',
    eventName: 'world.meteor-shower',
    interval: 48 * 5,
    intervalRange: 48,
  });
};

on('socket.connected', registerCronEvents);
if (PVBase.socketConnected()) {
  registerCronEvents();
}
// </editor-fold>
