import { logInfoS } from '../helpers';
import Cron from '../managers/cron';
import { serverNamespace } from '../server';

export default () => {
  serverNamespace.on('connection', (socket) => {
    logInfoS('[Cron]', 'Game server connected');

    socket.on('cron.register-event', async (id, data) => {
      logInfoS('[Cron]', `Registering cron event from game server: ${id}`);
      Cron.registerEvent(id, data);
    });
  });
};
