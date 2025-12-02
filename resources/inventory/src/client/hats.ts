import { PVEvents, PVGame, emitServer } from '@lib/client';
import { Log, emitSocket } from '@lib/client/comms/ui';
import { Vector3 } from '@lib/math';

const registerEvents = () => {
  PVEvents.register('EVENT_PLAYER_HAT_KNOCKED_OFF', (data) => {
    const { originPed, hat } = data;

    if (!originPed || !hat || originPed !== PVGame.playerPed()) {
      return;
    }

    Log(`EVENT_PLAYER_HAT_KNOCKED_OFF: Hat ${hat} knocked off by ${data.causePed} on player ${originPed}`);

    setTimeout(() => {
      const coords = Vector3.fromArray(GetEntityCoords(hat, false));

      const hatNetId = NetworkGetNetworkIdFromEntity(hat);

      emitSocket('inventory.lost-hat', hatNetId, coords.toArray());
    }, 1_500);
  });

  PVEvents.register('EVENT_PLAYER_HAT_EQUIPPED', (data) => {
    const { ped, hat } = data;

    if (!ped || !hat || ped !== PVGame.playerPed()) {
      return;
    }

    Log(`EVENT_PLAYER_HAT_EQUIPPED: Hat ${hat} equipped on player ${ped}`);

    // const hatNetId = NetworkGetNetworkIdFromEntity(hat);

    const itemId = Entity(hat).state.hatItemId;

    emitSocket('inventory.pickup-hat', itemId);
  });
};

RegisterCommand(
  'pickup_hat',
  async (source: number, args: any[], rawCommand: string) => {
    // Log({ source, args, rawCommand });
    emitSocket('inventory.pickup-hat', 121);
  },
  false,
);
// emitSocket('inventory.lost-hat', 63, [13, 42, 69]);

on('onResourceStart', (resourceName: string) => {
  // Events Resource Starts
  if (resourceName === 'events_manager') {
    registerEvents();
  }
});

if (GetResourceState('events_manager') === 'started') {
  registerEvents();
}
