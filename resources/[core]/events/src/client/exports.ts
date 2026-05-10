import { exports } from '@lib/client';

import timeManager from '../shared/managers/time-manager';
import { EventManager } from './managers/event-manager';
import { KeyManager } from './managers/key-manager';

const eventManager = EventManager.getInstance();
const keyManager = KeyManager.getInstance();

const register: Events.register = (identifier, event, callback) => {
  return eventManager.register(identifier, event, callback);
};

const unregister: Events.unregister = (identifier, event) => {
  return eventManager.unregister(identifier, event);
};

const keyRegister: Events.keyRegister = (command, name, method, key) => {
  keyManager.register(command, key);
};

const registerCronEvent: Events.registerCronEvent = (eventId, cron) => {
  timeManager.registerCronEvent(eventId, cron);
};

const registerTimeEvent: Events.registerTimeEvent = (eventId, time) => {
  timeManager.registerTimeEvent(eventId, time);
};

const unregisterCronTimeEvent: Events.unregisterCronTimeEvent = (eventId) => {
  timeManager.unregisterEvent(eventId);
};

exports<'events'>('register', register);
exports<'events'>('unregister', unregister);
exports<'events'>('keyRegister', keyRegister);
exports<'events'>('registerCronEvent', registerCronEvent);
exports<'events'>('registerTimeEvent', registerTimeEvent);
exports<'events'>('unregisterCronTimeEvent', unregisterCronTimeEvent);
