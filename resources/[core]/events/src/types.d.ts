declare interface RPC {}

declare namespace Events {
  type TimeConfig =
    | {
        type: 'cron';
        resource: string;
        cron: string;
        nextFire: number;
        lastFired?: number;
      }
    | {
        type: 'time';
        resource: string;
        time: number;
        fired?: number;
        deleteAfterFire?: boolean;
      };

  type register = (identifier: string, event: string, callback: (...args: number[]) => void) => void;
  type unregister = (identifier: string, event: string) => void;
  type keyRegister = (command: string, name: string, method: string, key: string) => void;
  type registerCronEvent = (eventId: string, cron: string) => string;
  type registerTimeEvent = (eventId: string, time: number, deleteAfterFire?: boolean) => string;
  type unregisterCronTimeEvent = (eventId: string) => void;
}
