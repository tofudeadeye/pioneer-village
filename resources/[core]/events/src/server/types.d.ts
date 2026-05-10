declare interface ServerExports {
  events: Events.ServerExports;
}

declare namespace Events {
  type TimeConfig =
    | {
        type: 'cron';
        cron: string;
        nextFire: number;
        lastFired?: number;
      }
    | {
        type: 'time';
        time: number;
        fired?: number;
        deleteAfterFire?: boolean;
      };

  type registerCronEvent = (eventId: string, cron: string) => void;
  type registerTimeEvent = (eventId: string, time: number, deleteAfterFire?: boolean) => void;
  type unregisterCronTimeEvent = (eventId: string) => void;

  type ServerExports = {
    registerCronEvent: registerCronEvent;
    registerTimeEvent: registerTimeEvent;
    unregisterCronTimeEvent: unregisterCronTimeEvent;
  };
}
