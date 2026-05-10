import { PVTarget, onResourceInit } from '@lib/client';

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
      },
    ],
    options: {
      distance: 2.0,
      throttle: 60_000,
      isEnabled(data) {
        if (!data.entity) return false;
        return DecorGetBool(data.entity, 'isInventory');
      },
    },
  });
};

onResourceInit('target', registerTargets);
