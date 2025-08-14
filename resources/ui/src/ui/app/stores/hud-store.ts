import { Socket } from 'socket.io-client';
import { emitClient, onClient, onClientCall } from '@lib/ui';

// Store state interface matching the HUD component's state
interface HUDState {
  show: boolean;
  crosshair: boolean;
  health: number;
  isHot: boolean;
  isCold: boolean;
  bleeding: boolean;
  brokenBone: boolean;
  infection: number;
  food: number;
  drink: number;
  stamina: number;
  moveSpeed: number;
  horseSpeed: number;
  speakVolume: number;
  isSpeaking: boolean;
}

type StateListener = (state: HUDState) => void;

class HUDStore {
  private static instance: HUDStore;
  private socket: Socket<SocketOut.ToClient, SocketIn.FromClient> | null = null;
  private state: HUDState;
  private listeners = new Set<StateListener>();
  private initialized = false;

  private constructor() {
    this.state = {
      show: true,
      crosshair: false,
      health: 100,
      isHot: false,
      isCold: false,
      bleeding: false,
      brokenBone: false,
      infection: 0,
      food: 100,
      drink: 100,
      stamina: 100,
      moveSpeed: 100,
      horseSpeed: 0,
      speakVolume: 2,
      isSpeaking: false,
    };
  }

  static getInstance(): HUDStore {
    if (!HUDStore.instance) {
      HUDStore.instance = new HUDStore();
    }
    return HUDStore.instance;
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
  }

  private setupSocketHandlers(): void {
    if (!this.socket) return;

    // Socket handlers can be added here if needed for real-time HUD updates
    // Example:
    // this.socket.on('hud.health-update', this.handleHealthUpdate);
  }

  private setupClientHandlers(): void {
    // Handle HUD state updates from client
    onClient('hud.state', this.handleHUDState);
  }

  // Handle HUD state update from client
  private handleHUDState = (event: UI.HUD.Event): void => {
    if (!event) return;
    
    this.updateState(event);
  };

  // Update health value
  setHealth(health: number): void {
    this.updateState({ health });
  }

  // Update food value
  setFood(food: number): void {
    this.updateState({ food });
  }

  // Update drink value
  setDrink(drink: number): void {
    this.updateState({ drink });
  }

  // Update stamina value
  setStamina(stamina: number): void {
    this.updateState({ stamina });
  }

  // Update movement speed
  setMoveSpeed(moveSpeed: number): void {
    this.updateState({ moveSpeed });
  }

  // Update horse speed
  setHorseSpeed(horseSpeed: number): void {
    this.updateState({ horseSpeed });
  }

  // Update temperature status
  setTemperature(isHot: boolean, isCold: boolean): void {
    this.updateState({ isHot, isCold });
  }

  // Update medical conditions
  setMedicalConditions(bleeding: boolean, brokenBone: boolean, infection: number): void {
    this.updateState({ bleeding, brokenBone, infection });
  }

  // Update speaking status
  setSpeaking(isSpeaking: boolean, speakVolume?: number): void {
    const updates: Partial<HUDState> = { isSpeaking };
    if (speakVolume !== undefined) {
      updates.speakVolume = speakVolume;
    }
    this.updateState(updates);
  }

  // Update crosshair visibility
  setCrosshair(crosshair: boolean): void {
    this.updateState({ crosshair });
  }

  // Show/hide HUD
  setShow(show: boolean): void {
    this.updateState({ show });
  }

  // Batch update multiple values
  updateValues(updates: Partial<HUDState>): void {
    this.updateState(updates);
  }

  // Update state and notify listeners
  updateState(newState: Partial<HUDState>): void {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(listener => listener(this.state));
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
  getState(): HUDState {
    return this.state;
  }

  // Get specific state value
  getValue<K extends keyof HUDState>(key: K): HUDState[K] {
    return this.state[key];
  }

  // Check if player is in critical health
  isCriticalHealth(): boolean {
    return this.state.health < 25;
  }

  // Check if player needs food or drink
  needsNourishment(): boolean {
    return this.state.food < 85 || this.state.drink < 85;
  }

  // Check if player has any medical conditions
  hasMedicalConditions(): boolean {
    return this.state.bleeding || this.state.brokenBone || this.state.infection > 0;
  }

  // Check if player has temperature issues
  hasTemperatureIssues(): boolean {
    return this.state.isHot || this.state.isCold;
  }

  // Check if stamina is low
  isLowStamina(): boolean {
    return this.state.stamina < 90;
  }

  // Reset HUD to default values
  reset(): void {
    this.updateState({
      show: true,
      crosshair: false,
      health: 100,
      isHot: false,
      isCold: false,
      bleeding: false,
      brokenBone: false,
      infection: 0,
      food: 100,
      drink: 100,
      stamina: 100,
      moveSpeed: 100,
      horseSpeed: 0,
      speakVolume: 2,
      isSpeaking: false,
    });
  }

  // Cleanup when store is destroyed
  cleanup(): void {
    if (this.socket) {
      // Remove socket handlers if any were added
      // Example:
      // this.socket.off('hud.health-update', this.handleHealthUpdate);
    }

    this.listeners.clear();
    this.initialized = false;
  }
}

export default HUDStore.getInstance();