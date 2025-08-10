import { logInfoC, logInfoS } from '../helpers';
import { serverNamespace, userNamespace } from '../server';

export default () => {
  serverNamespace.on('connection', (socket) => {
    logInfoS('[Example]', 'Game server connected');

    // socket.on('my-resource.event-from-server', async (data) => {});
  });

  userNamespace.on('connection', (socket) => {
    logInfoC('[Example]', 'User connected', socket.data);

    // socket.on('my-resource.event-from-client', async (data) => {});
  });
};
