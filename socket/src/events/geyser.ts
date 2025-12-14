import { shuffle } from 'lodash';

import Cron from '../managers/cron';
import Events from '../managers/events';
import { userNamespace } from '../server';

Cron.registerEvent('geyser-show', {
  type: 'socket',
  eventName: 'world.geyser-show',
  interval: 5, //60,
  intervalRange: 0, //15,
});

Events.register('world.geyser-show', () => {
  console.log('Generating geyser show sequence');

  const steps: World.GeyserShowSteps = [];

  const geyserIds: World.GeyserShowStep['id'][] = ['geyser_1', 'geyser_1', 'geyser_1'];

  // Start all geysers
  steps.push({ _type: 'start', id: 'geyser_1' });
  steps.push({ _type: 'start', id: 'geyser_2' });
  steps.push({ _type: 'start', id: 'geyser_3', delayAfter: 1_000 });

  // Ramp up to full steam
  steps.push({ _type: 'evolve', id: 'geyser_1', evolutions: { steam: 1.0 } });
  steps.push({ _type: 'evolve', id: 'geyser_2', evolutions: { steam: 1.0 } });
  steps.push({ _type: 'evolve', id: 'geyser_3', evolutions: { steam: 1.0 }, delayAfter: 6_000 });

  // Eruption cycles (3 rounds)
  for (let round = 0; round < 3; round++) {
    const order = shuffle(geyserIds);
    for (const id of order) {
      // Erupt
      steps.push({ _type: 'evolve', id, evolutions: { steam: 0.5, erupt: 1.0 }, delayAfter: 6_000 });
      // Calm down
      steps.push({ _type: 'evolve', id, evolutions: { steam: 0.25, erupt: 0 }, delayAfter: 6_000 });
    }
  }

  // Final cooldown (replace last delay, then chain cooldowns)
  steps.push({ _type: 'evolve', id: 'geyser_1', evolutions: { steam: 0 }, delayAfter: 6_000 });
  steps.push({ _type: 'evolve', id: 'geyser_2', evolutions: { steam: 0 }, delayAfter: 6_000 });
  steps.push({ _type: 'evolve', id: 'geyser_3', evolutions: { steam: 0 } });

  // Stop all geysers
  steps.push({ _type: 'stop', id: 'geyser_1' });
  steps.push({ _type: 'stop', id: 'geyser_2' });
  steps.push({ _type: 'stop', id: 'geyser_3' });

  userNamespace.emit('__client__', 'world.geyser-show', steps);
});
