import { Buffer } from 'buffer';

import { PVEventsManager } from '@lib/client/resources';

const intToFloat = (int: number) => {
  const buffer = Buffer.alloc(4);
  buffer.writeInt32LE(int, 0);
  return buffer.readFloatLE(0);
};

const registeredEvents = new Set();

const callbacks = new Map();

type EventMappingData = { [p: string]: 'i' | 'f' };

const eventMappings = {
  EVENT_ENTITY_DAMAGED: {
    attacked: 'i',
    attacker: 'i',
    weaponHash: 'i',
    ammoHash: 'i',
    damage: 'f',
    _5: 'i',
    x: 'f',
    y: 'f',
    z: 'f',
  },
  EVENT_ENTITY_DESTROYED: {
    attacked: 'i',
    attacker: 'i',
    weaponHash: 'i',
    ammoHash: 'i',
    damage: 'f',
    _5: 'i',
    x: 'f',
    y: 'f',
    z: 'f',
  },
  EVENT_ENTITY_EXPLOSION: {
    pedOrigin: 'i',
    _1: 'i',
    weaponHash: 'i',
    x: 'f',
    y: 'f',
    z: 'f',
  },
  EVENT_PLAYER_HAT_KNOCKED_OFF: {
    originPed: 'i',
    causePed: 'i',
    hat: 'i',
    _3: 'i',
    _4: 'i',
  },
  EVENT_CARRIABLE_UPDATE_CARRY_STATE: {
    carriable: 'i',
    ped: 'i',
    ped2: 'i',
    _3: 'i',
    _4: 'i',
  },
  EVENT_PICKUP_CARRIABLE: {
    ped: 'i',
    carriable: 'i',
    _2: 'i',
    _3: 'i',
  },
  EVENT_PLAYER_HAT_EQUIPPED: {
    ped: 'i',
    hat: 'i',
    _2: 'i',
    _3: 'i',
    _4: 'i',
    _5: 'i',
    palette: 'i',
    tint0: 'i',
    tint1: 'i',
    tint2: 'i',
  },
  weapon: {
    mainHand: 'i',
    offHand: 'i',
  },
};

// type emitSocket = <T extends keyof SocketServer.ServerEvents>(
//   evtName: T,
//   ...params: Parameters<SocketServer.ServerEvents[T]>
// ) => void;
//
// type awaitSocket = <
//   T extends keyof {
//     [K in keyof SocketServer.Server]: LastParam<SocketServer.Server[K]> extends () => any ? T : never;
//   },
// >(
//   evtName: T,
//   ...params: DropLastParam<SocketServer.Server[T]>
// ) => Promise<Parameters<LastParam<SocketServer.Server[T]>>[0]>;

type EventsManagerDataStuff = Record<keyof EventMappingData, number>;

function register<T extends keyof typeof eventMappings>(
  event: T,
  callback: (data: Record<keyof (typeof eventMappings)[T], number>) => void,
) {
  if (!callbacks.has(event)) {
    callbacks.set(event, []);
  }
  callbacks.get(event).push(callback);
  if (!registeredEvents.has(event)) {
    registeredEvents.add(event);
    PVEventsManager.Register(event);
    on(`events_manager:${event}`, (dataArray: number[]): void => {
      const data: Record<string, number> = {};
      let n = 0;
      if (eventMappings[event]) {
        for (const [index, dataType] of Object.entries(eventMappings[event])) {
          switch (dataType) {
            case 'f':
              data[index] = intToFloat(dataArray[n]);
              break;
            default:
              data[index] = dataArray[n];
              break;
          }
          n++;
        }
      } else {
        for (const value of dataArray) {
          data[`_${n}`] = value;
          n++;
        }
      }
      for (const callback of callbacks.get(event) ?? []) {
        callback(data);
      }
    });
  }
}

export const PVEvents = {
  register,
};
