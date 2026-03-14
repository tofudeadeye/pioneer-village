import { Socket } from 'socket.io-client';

interface BirdState {
  status: 'available' | 'delivering' | 'returning';
  sendLocked: boolean;
}

interface BirdStoreState {
  birds: Map<number, BirdState>;
}

type StateListener = (state: BirdStoreState) => void;

class BirdStore {
  private static instance: BirdStore;
  private socket: Socket<SocketOut.ToClient, SocketIn.FromClient> | null = null;
  private state: BirdStoreState;
  private listeners = new Set<StateListener>();
  private initialized = false;

  private constructor() {
    this.state = {
      birds: new Map(),
    };
  }

  static getInstance(): BirdStore {
    if (!BirdStore.instance) {
      BirdStore.instance = new BirdStore();
    }
    return BirdStore.instance;
  }

  initialize(socket: Socket<SocketOut.ToClient, SocketIn.FromClient>): void {
    if (this.initialized) {
      this.cleanup();
    }

    this.socket = socket;
    this.initialized = true;

    this.setupSocketHandlers();
    this.fetchActiveDeliveries();
  }

  private setupSocketHandlers(): void {
    if (!this.socket) return;

    this.socket.on('carrier-birds.event', this.handleBirdEvent);
  }

  private handleBirdEvent = (data: CarrierBirds.BirdEvent): void => {
    const birds = new Map(this.state.birds);

    switch (data.type) {
      case 'send':
        birds.set(data.birdInventoryId, { status: 'delivering', sendLocked: true });
        break;
      case 'return':
        birds.set(data.birdInventoryId, { status: 'available', sendLocked: false });
        break;
    }

    this.updateState({ birds });
  };

  fetchActiveDeliveries(): void {
    if (!this.socket) return;

    this.socket.emit('carrier-birds.get-active', (deliveries) => {
      const birds = new Map(this.state.birds);

      for (const delivery of deliveries) {
        const status = delivery.state === 'RETURNING' ? 'returning' : 'delivering';
        birds.set(delivery.pigeonItemId, { status, sendLocked: true });
      }

      this.updateState({ birds });
    });
  }

  sendBird(birdId: number, destinationId: number): void {
    if (!this.socket) return;

    const current = this.getBirdState(birdId);
    if (current.status !== 'available') return;

    const birds = new Map(this.state.birds);
    birds.set(birdId, { status: 'available', sendLocked: true });
    this.updateState({ birds });

    this.socket.emit('carrier-birds.send', birdId, destinationId, (result) => {
      const updatedBirds = new Map(this.state.birds);

      if (result.success) {
        updatedBirds.set(birdId, { status: 'delivering', sendLocked: true });
      } else {
        updatedBirds.set(birdId, { status: 'available', sendLocked: false });
      }

      this.updateState({ birds: updatedBirds });
    });
  }

  getBirdState(birdId: number): BirdState {
    return this.state.birds.get(birdId) || { status: 'available', sendLocked: false };
  }

  private updateState(newState: Partial<BirdStoreState>): void {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach((listener) => listener(this.state));
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): BirdStoreState {
    return this.state;
  }

  cleanup(): void {
    if (this.socket) {
      this.socket.off('carrier-birds.event', this.handleBirdEvent);
    }
    this.listeners.clear();
    this.initialized = false;
  }
}

export default BirdStore.getInstance();
