declare interface ServerExports {
  events: Events.ServerExports;
}

declare namespace Events {
  type ServerExports = {
    registerCronEvent: registerCronEvent;
    registerTimeEvent: registerTimeEvent;
    unregisterCronTimeEvent: unregisterCronTimeEvent;
  };
}
