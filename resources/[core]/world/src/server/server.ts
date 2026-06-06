import { PVBase, emitSocket } from '@lib/server';

import './controllers/world-controller';

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
