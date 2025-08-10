import { PVInit } from '@lib/client';

PVInit.register('ui::ready', { reset: true });

RegisterCommand(
  'ui-r',
  () => {
    console.log('Restarting UI...');
    PVInit.register('ui::ready', { reset: true });
    SetNuiFocus(false, false);
    SendNUIMessage({
      type: 'event',
      evtName: 'nui.restart',
      args: [],
    });
  },
  false,
);
