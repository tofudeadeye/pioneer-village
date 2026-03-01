import { shuffle } from 'lodash';

import birdManager from './managers/bird-manager';

RegisterCommand(
  'birdTest',
  async (source: number, args: any[], rawCommand: string) => {
    // Log({ source, args, rawCommand });

    for (let i = 10; i--; ) {
      birdManager.registerEvent({
        type: shuffle(['send', 'arrival', 'return'])[0] as 'send' | 'arrival' | 'return',
        birdType: Math.random() > 0.2 ? 'pigeon' : 'owl',
        characterId: 0,
        birdInventoryId: 0,
      });
    }
  },
  false,
);

RegisterCommand(
  'birdSend',
  async (source: number, args: any[], rawCommand: string) => {
    // Log({ source, args, rawCommand });
    birdManager.registerEvent({
      type: 'send',
      birdType: Math.random() > 0.2 ? 'pigeon' : 'owl',
      characterId: 0,
      birdInventoryId: 0,
    });
  },
  false,
);

RegisterCommand(
  'birdArrive',
  async (source: number, args: any[], rawCommand: string) => {
    // Log({ source, args, rawCommand });
    birdManager.registerEvent({
      type: 'arrival',
      birdType: Math.random() > 0.2 ? 'pigeon' : 'owl',
      characterId: 0,
      birdInventoryId: 0,
    });
  },
  false,
);

RegisterCommand(
  'birdReturn',
  async (source: number, args: any[], rawCommand: string) => {
    // Log({ source, args, rawCommand });
    birdManager.registerEvent({
      type: 'return',
      birdType: Math.random() > 0.2 ? 'pigeon' : 'owl',
      characterId: 0,
      birdInventoryId: 0,
    });
  },
  false,
);
