import { exports } from '@lib/server';

import timeManager from '../shared/managers/time-manager';

const registerCronEvent: Events.registerCronEvent = (eventId, cron) => {
  timeManager.registerCronEvent(eventId, cron);
};

const registerTimeEvent: Events.registerTimeEvent = (eventId, time) => {
  timeManager.registerTimeEvent(eventId, time);
};

const unregisterCronTimeEvent: Events.unregisterCronTimeEvent = (eventId) => {
  timeManager.unregisterEvent(eventId);
};

exports<'events'>('registerCronEvent', registerCronEvent);
exports<'events'>('registerTimeEvent', registerTimeEvent);
exports<'events'>('unregisterCronTimeEvent', unregisterCronTimeEvent);
