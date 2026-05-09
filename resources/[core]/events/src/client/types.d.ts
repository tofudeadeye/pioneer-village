declare interface ClientExports {
  events: Events.ClientExports;
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

  type register = (identifier: string, event: string, callback: (...args: number[]) => void) => void;
  type unregister = (identifier: string, event: string) => void;
  type keyRegister = (command: string, name: string, method: string, key: string) => void;
  type registerCronEvent = (eventId: string, cron: string) => void;
  type registerTimeEvent = (eventId: string, time: number, deleteAfterFire?: boolean) => void;
  type unregisterCronTimeEvent = (eventId: string) => void;

  type ClientExports = {
    register: register;
    unregister: unregister;
    keyRegister: keyRegister;
    registerCronEvent: registerCronEvent;
    registerTimeEvent: registerTimeEvent;
    unregisterCronTimeEvent: unregisterCronTimeEvent;
  };
}
