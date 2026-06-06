import { logInfoC, logInfoS } from '../helpers';
import worldObjects from '../managers/world-objects';
import { serverNamespace, userNamespace } from '../server';

const NET_ID_EXISTS_TIMEOUT_MS = 250;

export default () => {
  worldObjects.init();

  const netIds: Map<string, number> = new Map();

  const persistentObjectsPayload = (): Record<string, World.PersistentObject> => {
    const data: Record<string, World.PersistentObject> = {};
    for (const row of worldObjects.list()) {
      logInfoS('[World]', 'Persistent object', row.name, row.model, row.x, row.y, row.z);
      data[row.name] = {
        name: row.name,
        model: row.model,
        coords: { x: Number(row.x), y: Number(row.y), z: Number(row.z) },
        rotation: { x: Number(row.rotX), y: Number(row.rotY), z: Number(row.rotZ) },
        networked: row.networked ?? true,
        state: (row.state as Record<string, unknown>) ?? {},
      };
    }
    return data;
  };

  serverNamespace.on('connection', (socket) => {
    logInfoS('[World]', 'Game server connected');

    socket.emit('world.persistent-objects', persistentObjectsPayload());

    socket.on('world.registered-objects', (cb) => {
      const data: Record<string, number> = {};
      for (const [name, id] of netIds.entries()) {
        data[name] = id;
      }
      cb(data);
    });

    socket.on('world.persistent-objects', (cb) => {
      cb(persistentObjectsPayload());
    });

    socket.on('world.register-object', (name, id) => {
      logInfoS('[World]', 'Register network object', name, id);
      netIds.set(name, id);
      userNamespace.emit('world.register-object', name, id);
    });

    socket.on('world.unregister-object', (name) => {
      logInfoS('[World]', 'Unregister network object', name);
      netIds.delete(name);
      userNamespace.emit('world.unregister-object', name);
    });
  });

  userNamespace.on('connection', (socket) => {
    socket.on('world.registered-objects', (cb) => {
      const data: Record<string, number> = {};
      for (const [name, id] of netIds.entries()) {
        data[name] = id;
      }
      cb(data);
    });

    socket.on('world.request-creation', (name, cb) => {
      logInfoC('[World]', 'Request creation', name);

      const id = netIds.get(name);
      if (!id) {
        cb(true);
        return;
      }

      const gameServers = [...serverNamespace.sockets.values()];
      if (gameServers.length === 0) {
        logInfoC('[World]', 'No game server connected — allowing creation');
        netIds.delete(name);
        cb(true);
        return;
      }

      serverNamespace.timeout(NET_ID_EXISTS_TIMEOUT_MS).emit('world.net-id-exists', id, (err, responses) => {
        if (err) {
          logInfoC('[World]', `net-id-exists timed out for ${name} (${id}) — assuming dead`);
          netIds.delete(name);
          cb(true);
          return;
        }

        const alive = responses.some((response) => response === true);
        if (alive) {
          cb(false);
        } else {
          logInfoC('[World]', `net-id ${id} for ${name} no longer exists — allowing recreation`);
          netIds.delete(name);
          cb(true);
        }
      });
    });

    socket.on('world.load-state', (name, cb) => {
      cb(worldObjects.getState(name));
    });

    socket.on('world.update-state', async (name, patch) => {
      const updated = await worldObjects.setState(name, patch);
      if (!updated) {
        logInfoC('[World]', `update-state: unknown object "${name}"`);
      }
    });

    socket.on('world.register-object', (name, id) => {
      logInfoC('[World]', 'Register network object', name, id);
      netIds.set(name, id);
    });

    socket.on('world.unregister-object', (name) => {
      logInfoC('[World]', 'Unregister network object', name);
      netIds.delete(name);
    });
  });
};
