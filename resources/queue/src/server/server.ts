import { awaitSocket, getIdentifiers, onClientCall } from '@lib/server';

import './queue';

const SOCKET_USER_CONNECTION = GetConvar('SOCKET_USER_CONNECTION', '');

const socketDetails: Map<number, SocketDetails> = new Map();

on('onResourceStop', (resourceName: string) => {
  console.log(`[Queue] Stopping ${resourceName}`);
  if (resourceName === 'ui') {
    socketDetails.clear();
  }
});

onClientCall('getSocketDetails', async (serverId, useCache = true) => {
  if (useCache && socketDetails.has(serverId)) {
    return socketDetails.get(serverId) as SocketDetails;
  }
  const identifiers = getIdentifiers(serverId);
  // console.log('identifiers', identifiers);
  const token = await awaitSocket('generateJWT', serverId, identifiers);
  const details: SocketDetails = {
    socketUrl: SOCKET_USER_CONNECTION,
    token,
  };
  socketDetails.set(serverId, details);
  return details;
});
