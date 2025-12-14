/*

Geyser
30-60 minutes interval
Callback/Event
Last Called/Happened

*/
import { logInfo } from '../helpers';
import { serverNamespace, userNamespace } from '../server';
import Events from './events';

const INTERVAL = 60e3; // 60e3 = 1 Minute

class Cron {
  static readonly instance: Cron = new Cron();
  protected interval?: NodeJS.Timeout;
  protected crons = new Map<string, CronData>();
  protected nextCalls = new Map<string, number>();

  initialized = false;

  constructor() {
    this.interval = setInterval(this.checkEvents.bind(this), INTERVAL);
  }

  cleanUp(): void {
    if (!this.interval) return;
    clearInterval(this.interval);
  }

  get currentInterval() {
    return Math.round(Date.now() / INTERVAL);
  }

  registerEvent(id: string, cron: CronData) {
    if (cron.intervalRange && cron.intervalRange >= cron.interval) {
      logInfo('cron', `Invalid interval range for event ${id}`);
      return;
    }
    logInfo('cron', `Registering cron event: ${id}`);
    this.crons.set(id, cron);
    this.setNextCall(id, cron);
  }

  checkEvents() {
    const currentInterval = this.currentInterval;
    for (const [id, nextCall] of this.nextCalls.entries()) {
      if (nextCall <= currentInterval) {
        logInfo('cron', `Cron event due: ${id}`);
        this.fireEvent(id);
      }
    }
  }

  fireEvent(id: string) {
    const cron = this.crons.get(id);
    if (!cron) return;

    logInfo('cron', `[${this.currentInterval}] Firing cron event: ${id}`);
    if (cron.type === 'server') {
      serverNamespace.emit(cron.eventName);
    } else if (cron.type === 'client') {
      userNamespace.emit('__client__', cron.eventName);
    } else if (cron.type === 'socket') {
      Events.emit(cron.eventName);
    }
    this.setNextCall(id, cron);
  }

  setNextCall(id: string, data: CronData) {
    let nextInterval = this.currentInterval + data.interval;
    if (data.intervalRange) {
      nextInterval += Math.round(data.intervalRange - Math.random() * 2);
    }
    this.nextCalls.set(id, nextInterval);
  }
}

export default Cron.instance;
