import { Vector3 } from '@lib/math';
import { emitSocket } from '@lib/server';
import { LogToUI } from '@lib/server/comms/client';

const trackedHorsePeds = new Map<Horse.Id, number>();

console.log('GlobalState.trackedHorsePeds', GlobalState.trackedHorsePeds);
if (GlobalState.trackedHorsePeds) {
  for (const [horseId, netId] of GlobalState.trackedHorsePeds) {
    trackedHorsePeds.set(horseId, netId);
    LogToUI(`[Stable] Loaded tracked horse ped: Horse ID ${horseId} with netId ${netId}`);
  }
}

const storeTrackedHorsePeds = () => {
  GlobalState.set('trackedHorsePeds', [...trackedHorsePeds.entries()], false);
  console.log('GlobalState.trackedHorsePeds', GlobalState.trackedHorsePeds);
};

const getHorseLocations = () => {
  const horseLocations = [];
  for (const [horseId, netId] of trackedHorsePeds.entries()) {
    const horsePed = NetworkGetEntityFromNetworkId(netId);

    LogToUI(`Horse ID ${horseId} has ped ${horsePed} (netId ${netId})`);

    const horseData: Horse.Location = { horseId };

    if (!horsePed || !DoesEntityExist(horsePed)) {
      trackedHorsePeds.delete(horseId);
      storeTrackedHorsePeds();
      continue;
    }
    horseData.coords = Vector3.fromArray(GetEntityCoords(horsePed));

    horseLocations.push(horseData);
  }

  LogToUI('[Stable] Horse locations: ' + JSON.stringify(horseLocations));

  return horseLocations;
};

setInterval(async () => {
  const locations = getHorseLocations();
  if (locations.length) {
    emitSocket('stable.horse-locations', locations);
  }
}, 30_000);

onNet('stable:track-horse', (horsePedNetId: number) => {
  LogToUI(`[Stable] Tracking horse with netId ${horsePedNetId}`);
  const horsePed = NetworkGetEntityFromNetworkId(horsePedNetId);
  if (horsePed === 0 || !DoesEntityExist(horsePed)) {
    LogToUI(`[Stable] Horse ped with netId ${horsePedNetId} does not exist`);
    return;
  }

  const horseId = Entity(horsePed).state.horseId;

  LogToUI(`[Stable] Horse ID: ${horseId}`);

  if (horseId) {
    trackedHorsePeds.set(horseId, horsePedNetId);
    storeTrackedHorsePeds();
  }
});
