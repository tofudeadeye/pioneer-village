import eventListener from './event/event-listener';
import './exports';
import './misc/commands';
import './misc/events';

on('onResourceStart', (resourceName: string) => {
  // Events Resource Starts
  if (resourceName === GetCurrentResourceName()) {
    eventListener.restartListener();
    console.log('EventListener Started');
  }
});

on('onResourceStop', (resourceName: string) => {
  // Current Resource Stops
  if (resourceName === GetCurrentResourceName() && eventListener) {
    eventListener.destroy();
  }
});

onNet('game:character-selected', (charId: number) => {
  eventListener.restartListener();
  console.log('EventListener Restarted');
});
