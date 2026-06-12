import { Vector3 } from '@lib/math/vector3';
import { onSocket } from '@lib/server';

import './comms';
import { emitSocket } from './comms';

let connectedPlayers: Base.PlayerInfo[] = [];

const getConnectedPlayers = () => {
  const players: Base.PlayerInfo[] = [];
  const indexes = GetNumPlayerIndices();

  for (let i = 0; i < indexes; i++) {
    const serverId = Number(GetPlayerFromIndex(i));
    if (serverId === 0) {
      continue;
    }

    const playerPed = GetPlayerPed(String(serverId));

    const playerData: Base.PlayerInfo = { serverId };

    if (playerPed !== 0) {
      playerData.coords = Vector3.fromArray(GetEntityCoords(playerPed));
    }

    players.push(playerData);
  }

  return players;
};

// 5s keeps socket-side coords fresh enough for world-object interest checks (a galloping
// horse covers ~75m between pushes, well inside the interest radius buffer).
setInterval(async () => {
  connectedPlayers = getConnectedPlayers();
  emitSocket('base.connected-players', connectedPlayers);
}, 5_000);

on('playerDropped', () => {
  const src = global.source;
  const coords = Vector3.fromArray(GetEntityCoords(GetPlayerPed(String(src))));
  emitSocket('character-update.last-position', src, coords);
  emitSocket('character-event.disconnected', src);
});

onSocket('base.force-coords-update', (serverId) => {
  console.log('[Base] Force coords update for serverId:', serverId);

  const playerPed = GetPlayerPed(String(serverId));
  if (playerPed !== 0) {
    const coords = Vector3.fromArray(GetEntityCoords(playerPed));
    console.log('[Base] Coords for serverId:', serverId, coords);
    emitSocket('character-update.last-position', serverId, coords);
  }
});
