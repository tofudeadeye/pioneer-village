import { Socket } from 'socket.io-client';
import { emitClient, onClient } from '@lib/ui';

// Store state interface matching the component's state
interface InteractState {
  show: boolean;
  pois: UI.Interact.POI[];
  active: string | null;
  interactionInProgress: boolean;
  lastInteractionTime: number;
}

type StateListener = (state: InteractState) => void;

class InteractStore {
  private static instance: InteractStore;
  private socket: Socket<SocketOut.ToClient, SocketIn.FromClient> | null = null;
  private state: InteractState;
  private listeners = new Set<StateListener>();
  private initialized = false;
  private interactionCooldown = 500; // ms between interactions

  private constructor() {
    this.state = {
      show: true,
      pois: [],
      active: null,
      interactionInProgress: false,
      lastInteractionTime: 0,
    };
  }

  static getInstance(): InteractStore {
    if (!InteractStore.instance) {
      InteractStore.instance = new InteractStore();
    }
    return InteractStore.instance;
  }

  // Initialize the store with socket connection
  initialize(socket: Socket<SocketOut.ToClient, SocketIn.FromClient>): void {
    if (this.initialized) {
      this.cleanup();
    }

    this.socket = socket;
    this.initialized = true;

    // Set up socket event handlers
    this.setupSocketHandlers();
    
    // Set up client event handlers
    this.setupClientHandlers();

    // Emit startup event
    emitClient('interact.startup');
  }

  private setupSocketHandlers(): void {
    if (!this.socket) return;

    // Socket handlers for interact events would go here if needed
    // Currently interact seems to be client-side only
  }

  private setupClientHandlers(): void {
    // Handle POI updates from client
    onClient('interact.pois', this.handlePoisUpdate);

    // Handle active POI change from client
    onClient('interact.active', this.handleActiveUpdate);

    // Handle interaction trigger from client
    onClient('interact.trigger', this.handleInteractionTrigger);

    // Handle visibility toggle
    onClient('interact.toggle', this.handleToggle);
    onClient('interact.show', this.handleShow);
    onClient('interact.hide', this.handleHide);

    // Handle interaction complete
    onClient('interact.complete', this.handleInteractionComplete);
  }

  // Handle POIs update from client
  private handlePoisUpdate = (pois: UI.Interact.POI[]): void => {
    // Sort POIs by distance for consistent rendering
    const sortedPois = [...pois].sort((a, b) => a.distance - b.distance);
    
    // Check if active POI is still in range
    let active = this.state.active;
    if (active && !sortedPois.find(poi => poi.id === active)) {
      active = null;
    }

    this.updateState({
      pois: sortedPois,
      active,
    });
  };

  // Handle active POI change from client
  private handleActiveUpdate = (active: string | null): void => {
    // Validate that the active POI exists in current POIs
    if (active && !this.state.pois.find(poi => poi.id === active)) {
      console.warn(`Attempting to set active POI ${active} that doesn't exist`);
      return;
    }

    this.updateState({
      active,
    });
  };

  // Handle interaction trigger from client
  private handleInteractionTrigger = (poiId: string): void => {
    // Check cooldown
    const now = Date.now();
    if (now - this.state.lastInteractionTime < this.interactionCooldown) {
      return;
    }

    // Check if POI exists and is the active one
    const poi = this.state.pois.find(p => p.id === poiId);
    if (!poi || this.state.active !== poiId) {
      return;
    }

    // Check if already in progress
    if (this.state.interactionInProgress) {
      return;
    }

    // Check distance
    if (poi.distance >= 5) {
      return;
    }

    // Set interaction in progress
    this.updateState({
      interactionInProgress: true,
      lastInteractionTime: now,
    });

    // Emit interaction event to client
    emitClient('interact.execute', poiId, poi.label, poi.key);
  };

  // Handle interaction complete
  private handleInteractionComplete = (): void => {
    this.updateState({
      interactionInProgress: false,
    });
  };

  // Toggle visibility
  private handleToggle = (): void => {
    this.updateState({
      show: !this.state.show,
    });
  };

  // Show the interact UI
  private handleShow = (): void => {
    this.updateState({
      show: true,
    });
  };

  // Hide the interact UI
  private handleHide = (): void => {
    this.updateState({
      show: false,
    });
  };

  // Public API methods
  public updatePois(pois: UI.Interact.POI[]): void {
    this.handlePoisUpdate(pois);
  }

  public setActive(poiId: string | null): void {
    this.handleActiveUpdate(poiId);
  }

  public triggerInteraction(poiId: string): void {
    this.handleInteractionTrigger(poiId);
  }

  public completeInteraction(): void {
    this.handleInteractionComplete();
  }

  public toggleVisibility(): void {
    this.handleToggle();
  }

  public show(): void {
    this.handleShow();
  }

  public hide(): void {
    this.handleHide();
  }

  public getActivePoi(): UI.Interact.POI | null {
    if (!this.state.active) return null;
    return this.state.pois.find(poi => poi.id === this.state.active) || null;
  }

  public getNearbyPois(maxDistance: number = 5): UI.Interact.POI[] {
    return this.state.pois.filter(poi => poi.distance < maxDistance);
  }

  public getClosestPoi(): UI.Interact.POI | null {
    if (this.state.pois.length === 0) return null;
    return this.state.pois[0]; // Already sorted by distance
  }

  public canInteract(): boolean {
    if (!this.state.active) return false;
    if (this.state.interactionInProgress) return false;
    
    const poi = this.getActivePoi();
    if (!poi) return false;
    
    return poi.distance < 5;
  }

  // Update state and notify listeners
  updateState(newState: Partial<InteractState>): void {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(listener => listener(this.state));
  }

  // Set POIs (required by component)
  setPois(pois: UI.Interact.POI[]): void {
    this.updatePois(pois);
  }

  // Subscribe to state changes
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state); // Call immediately with current state
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Get current state
  getState(): InteractState {
    return this.state;
  }

  // Cleanup when store is destroyed
  cleanup(): void {
    // No socket handlers to clean up for interact currently
    this.listeners.clear();
    this.initialized = false;
  }
}

export default InteractStore.getInstance();