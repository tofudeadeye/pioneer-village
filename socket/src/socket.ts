import CharacterController from './controllers/characters';
import ChatController from './controllers/chat';
import DoorController from './controllers/doors';
import InventoryController from './controllers/inventory';
import JobsController from './controllers/jobs';
import StableController from './controllers/stables';
import UserController from './controllers/user';
import WorldController from './controllers/world';
import { seedDB } from './seed';
import server, { userAccessKey } from './server';

seedDB();

UserController(userAccessKey);
CharacterController(userAccessKey);
ChatController();
DoorController();
InventoryController();
StableController();
WorldController();
JobsController();

server.listen(Number(process.env.SOCKET_PORT), () => {
  const serverAddress = server.address();
  if (typeof serverAddress === 'string') {
    console.log(`Server listening on ${serverAddress}`);
  } else if (serverAddress) {
    console.log(`Server listening on ${serverAddress.address}:${serverAddress.port}`);
  } else {
    console.log('Server listening');
  }
});
