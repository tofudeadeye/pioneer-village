import { CronExpressionParser } from 'cron-parser';
import { onResourceStop } from 'lib/client';

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

  resourceEvents: Map<string, string[]> = new Map();
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
      console.log(`Cron event ${eventId} fired at ${now}, next at ${config.nextFire}`);
      return true;
    } else if (config.type === 'time') {
      if (!config.fired && now >= config.time) {
        console.log(`Time event ${eventId} fired at ${now} expected at ${config.time}`);
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
    // NOTE: console.log('registerCronEvent called by:', GetInvokingResource());
    if (this.timeEvents.has(eventId)) {
      console.log(`Time event with ID ${eventId} already exists. Overwriting.`);
    }
    try {
      const nextFire = computeNextCronFire(cron, Date.now());
      this.timeEvents.set(eventId, { type: 'cron', cron, nextFire });
      console.log(`Registered cron event ${eventId} (${cron}), next at ${nextFire}`);
    } catch (err) {
      console.log(`Failed to register cron event ${eventId}: invalid expression "${cron}"`, err);
    }
  }

  registerTimeEvent(eventId: string, time: number, deleteAfterFire = false) {
    if (this.timeEvents.has(eventId)) {
      console.log(`Time event with ID ${eventId} already exists. Overwriting.`);
    } else {
      console.log(`Registered time event ${eventId} for ${time}`);
    }
    this.timeEvents.set(eventId, { type: 'time', time, deleteAfterFire });
  }

  unregisterEvent(eventId: string) {
    if (this.timeEvents.has(eventId)) {
      this.timeEvents.delete(eventId);
      console.log(`Unregistered time event ${eventId}`);
    } else {
      console.log(`Attempted to unregister non-existent time event ${eventId}`);
    }
  }
}

const timeManager = TimeManager.getInstance();

export default timeManager;
