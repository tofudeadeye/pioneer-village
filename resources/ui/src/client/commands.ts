RegisterCommand(
  'ui-r',
  () => {
    console.log('Restarting UI...');
    SetNuiFocus(false, false);
    SendNUIMessage({
      type: 'event',
      evtName: 'nui.restart',
      args: [],
    });
  },
  false,
);
