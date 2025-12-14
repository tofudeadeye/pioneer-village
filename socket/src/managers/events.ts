type CallbackFunction = () => void;

export class Events {
  static readonly instance: Events = new Events();
  protected static EVENTS = new Map<string, CallbackFunction[]>();

  initialized = false;

  constructor() {
    this.init();
  }

  async init() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
  }

  register(name: string, callback: CallbackFunction) {
    if (!Events.EVENTS.has(name)) {
      Events.EVENTS.set(name, []);
    }

    const listeners = Events.EVENTS.get(name);
    if (listeners && !listeners.includes(callback)) {
      listeners.push(callback);
    }
  }

  emit(name: string) {
    // console.log(`Emitting event: ${name}`);
    const listeners = Events.EVENTS.get(name);
    // console.log(`Found ${listeners ? listeners.length : 0} listeners for event: ${name}`);
    if (listeners) {
      for (const listener of listeners) {
        // console.log(`Calling listener for event: ${name}`);
        listener();
      }
    }
  }
}

export default Events.instance;
