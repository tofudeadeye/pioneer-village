import { sign } from 'jsonwebtoken';

import { logGreen, logInfoC, logInfoS } from '../helpers';
import Accounts from '../managers/accounts';
import Characters from '../managers/characters';
import { serverNamespace, userNamespace } from '../server';

export default (userAccessKey: string) => {
  serverNamespace.on('connection', (socket) => {
    logInfoS('[User]', 'Game server connected');

    socket.on('base.connected-players', (players) => {
      logInfoS('players', players);
      for (const player of players) {
        const character = Characters.getActiveCharacterForServerId(player.serverId);
        if (!character || !player.coords) continue;

        Characters.setLastCoords(character.id, {
          x: player.coords.x || 0,
          y: player.coords.y || 0,
          z: player.coords.z || 0,
        });
      }
    });

    socket.on('getAccount', async (_identifiers, cb) => {
      const account = await Accounts.getOrCreate(_identifiers);
      cb(account);
    });

    socket.on('generateJWT', async (serverId, _identifiers, cb) => {
      // do a db query using identifiers.
      const account = await Accounts.getOrCreate(_identifiers);
      logInfoS('[User]', 'account', account);
      const token = sign(
        {
          serverId,
          userId: account.id,
        },
        userAccessKey,
        { expiresIn: '1 day' },
      );

      logInfoS('[User]', 'token', token);

      cb(token);
    });
  });

  userNamespace.on('connection', (socket) => {
    logInfoC('[User]', 'User connected', socket.data);
  });
};
