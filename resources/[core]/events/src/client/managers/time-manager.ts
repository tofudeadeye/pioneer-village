import { CronExpressionParser } from 'cron-parser';

import { onResourceStop } from '@lib/client';
import { Log } from '@lib/client/comms/ui';

const computeNextCronFire = (cron: string, from: number): number => {
  return CronExpressionParser.parse(cron, { currentDate: from }).next().getTime();
};

export class TimeManager {
  protected static instance: TimeManager;
  protected static initialized = false;
  protected static tick: number;

  static getInstance(): TimeManager {
    if (!TimeManager.instance) {
      TimeManager.instance = new TimeManager();
    }
    return TimeManager.instance;
  }

  timeEvents: Map<string, Events.TimeConfig> = new Map();
  protected lastCheckedSecond = 0;

  constructor() {
    if (TimeManager.initialized) return;

    TimeManager.tick = setTick(this.onTick.bind(this));

    onResourceStop(() => {
      clearTick(TimeManager.tick);
    });

    TimeManager.initialized = true;
  }

  onTick() {
    if (!this.timeEvents) return;

    const second = Math.floor(Date.now() / 1000);
    if (second === this.lastCheckedSecond) return;
    this.lastCheckedSecond = second;

    for (const [eventId, config] of this.timeEvents.entries()) {
      if (this.testEvent(eventId, config)) {
        emit(`events:timeEvent:${eventId}`);
      }
    }
  }

  testEvent(eventId: string, config: Events.TimeConfig) {
    const now = Date.now();
    if (config.type === 'cron') {
      if (now < config.nextFire) return false;

      config.lastFired = now;
      config.nextFire = computeNextCronFire(config.cron, now);
      Log(`Cron event ${eventId} fired at ${now}, next at ${config.nextFire}`);
      return true;
    } else if (config.type === 'time') {
      if (!config.fired && now >= config.time) {
        Log(`Time event ${eventId} fired at ${now} expected at ${config.time}`);
        if (config.deleteAfterFire) {
          this.timeEvents.delete(eventId);
        } else {
          config.fired = now;
        }
        return true;
      }
    }
    return false;
  }

  registerCronEvent(eventId: string, cron: string) {
    if (this.timeEvents.has(eventId)) {
      Log(`Time event with ID ${eventId} already exists. Overwriting.`);
    }
    try {
      const nextFire = computeNextCronFire(cron, Date.now());
      this.timeEvents.set(eventId, { type: 'cron', cron, nextFire });
      Log(`Registered cron event ${eventId} (${cron}), next at ${nextFire}`);
    } catch (err) {
      Log(`Failed to register cron event ${eventId}: invalid expression "${cron}"`, err);
    }
  }

  registerTimeEvent(eventId: string, time: number, deleteAfterFire = false) {
    if (this.timeEvents.has(eventId)) {
      Log(`Time event with ID ${eventId} already exists. Overwriting.`);
    } else {
      Log(`Registered time event ${eventId} for ${time}`);
    }
    this.timeEvents.set(eventId, { type: 'time', time, deleteAfterFire });
  }

  unregisterEvent(eventId: string) {
    if (this.timeEvents.has(eventId)) {
      this.timeEvents.delete(eventId);
      Log(`Unregistered time event ${eventId}`);
    } else {
      Log(`Attempted to unregister non-existent time event ${eventId}`);
    }
  }
}

const timeManager = TimeManager.getInstance();

export default timeManager;
