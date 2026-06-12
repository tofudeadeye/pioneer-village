import { logInfoC } from '../helpers';
import worldObjects from '../managers/world-objects';
import { userNamespace } from '../server';

export default () => {
  worldObjects.init();

  userNamespace.on('connection', (socket) => {
    socket.on('world.request-sync', () => {
      worldObjects.resyncSocket(socket);
    });

    socket.on('world.update-state', async (name, patch) => {
      const updated = await worldObjects.setState(name, patch);
      if (!updated) {
        logInfoC('[World]', `update-state: unknown object "${name}"`);
        return;
      }
      userNamespace.emit('__client__', 'world.state-changed', name, patch);
    });

    socket.on('world.update-transform', async (name, coords, rotation) => {
      const updated = await worldObjects.setTransform(name, coords, rotation);
      if (!updated) {
        logInfoC('[World]', `update-transform: unknown object "${name}"`);
        return;
      }
      userNamespace.emit('__client__', 'world.transform-changed', name, coords, rotation);
    });
  });
};
