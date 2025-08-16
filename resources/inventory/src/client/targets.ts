import { PVTarget, onResourceInit } from '@lib/client';
import { Log } from '@lib/client/comms/ui';

const registerTargets = async () => {
  PVTarget.AddTarget({
    id: 'world_inventory',
    type: 'model',
    group: [GetHashKey('p_cs_dirtybag01x')],
    data: [
      {
        id: 'world_inventory',
        label: 'Open Inventory',
        icon: 'sack',
        event: 'inventory:open-world',
        parameters: {},
      },
    ],
    options: {
      distance: 2.0,
      isEnabled(data) {
        Log('test', Math.random());
        return DecorGetBool(data.entity, 'isInventory') !== false;
      },
    },
  });
};

onResourceInit('target', registerTargets);
