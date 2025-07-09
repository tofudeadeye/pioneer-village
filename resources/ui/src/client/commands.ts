RegisterCommand(
  'ui-r',
  () => {
    console.log('Restarting UI...');
    SendNUIMessage({
      type: 'event',
      evtName: 'nui.restart',
      args: [],
    });
  },
  false,
);
