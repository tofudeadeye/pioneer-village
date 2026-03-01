import { onSocket } from '@lib/client/comms/ui';

import birdManager from './managers/bird-manager';

onSocket('carrier-birds.event', (data) => {
  birdManager.registerEvent(data);
});
