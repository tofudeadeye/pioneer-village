import { Socket } from 'socket.io-client';
import { onClient } from '@lib/ui';

// Store state interface
interface DoctorState {
  show: boolean;
  entity: number;
  boneStatus: UI.Doctor.BoneStatus[];
  inspecting: number;
  inspected: boolean[];
}

type StateListener = (state: DoctorState) => void;

const SPEEDS = {
  slowest: 7500,
  slower: 2000,
  slow: 1500,
  normal: 1250,
  fast: 1000,
  faster: 750,
  fastest: 500,
};

const boneInspectSpeed: Record<string, keyof typeof SPEEDS> = {
  SKEL_HEAD: 'slower',
  SKEL_L_CALF: 'fast',
  SKEL_L_CLAVICLE: 'normal',
  SKEL_L_FOOT: 'normal',
  SKEL_L_FOREARM: 'fastest',
  SKEL_L_HAND: 'fast',
  SKEL_L_THIGH: 'slow',
  SKEL_L_UPPERARM: 'faster',
  SKEL_NECK1: 'slower',
  SKEL_PENIS00: 'slowest',
  SKEL_R_CALF: 'fast',
  SKEL_R_CLAVICLE: 'normal',
  SKEL_R_FOOT: 'normal',
  SKEL_R_FOREARM: 'fastest',
  SKEL_R_HAND: 'fast',
  SKEL_R_THIGH: 'slow',
  SKEL_R_UPPERARM: 'faster',
  SKEL_SPINE4: 'slower',
};

class DoctorStore {
  private static instance: DoctorStore;
  private socket: Socket<UISocketEvents, SocketServer.Client & SocketServer.ClientEvents> | null = null;
  private state: DoctorState;
  private listeners = new Set<StateListener>();
  private inspectTimeout: NodeJS.Timeout | null = null;
  private initialized = false;

  private constructor() {
    this.state = {
      show: false,
      entity: 0,
      boneStatus: [],
      inspecting: -1,
      inspected: [],
    };
  }

  static getInstance(): DoctorStore {
    if (!DoctorStore.instance) {
      DoctorStore.instance = new DoctorStore();
    }
    return DoctorStore.instance;
  }

  // Initialize the store with socket connection
  initialize(socket: Socket<UISocketEvents, SocketServer.Client & SocketServer.ClientEvents>): void {
    if (this.initialized) {
      this.cleanup();
    }

    this.socket = socket;
    this.initialized = true;

    // Set up client event handlers
    this.setupClientHandlers();
  }

  private setupClientHandlers(): void {
    // Handle doctor state updates from client
    onClient('doctor.state', this.handleDoctorState);
  }

  // Handle doctor state update from client
  private handleDoctorState = (event: UI.Doctor.Event): void => {
    let updatedEvent = { ...event };
    
    // Reset inspected array when entity changes
    if (event.entity && event.entity !== this.state.entity) {
      if (event.boneStatus?.length) {
        updatedEvent.inspected = new Array(event.boneStatus.length).fill(false);
      }
    }

    this.updateState(updatedEvent);
  };

  // Start inspecting a bone
  inspect(index: number): void {
    // Don't inspect if already inspecting or already inspected
    if (this.state.inspecting !== -1 || this.state.inspected[index]) {
      return;
    }

    const { boneStatus, inspected } = this.state;
    const bone = boneStatus[index];

    if (bone) {
      const newInspected = [...inspected];
      newInspected[index] = true;

      // Start inspecting
      this.updateState({
        inspecting: index,
      });

      // Calculate inspection time
      const speed = SPEEDS[boneInspectSpeed[bone.name]] || 500;

      // Set timeout to complete inspection
      this.inspectTimeout = setTimeout(() => {
        this.updateState({
          inspecting: -1,
          inspected: newInspected,
        });
        this.inspectTimeout = null;
      }, speed);
    }
  }

  // Get bone health color based on inspection status and health
  getBoneHealthColor(boneIndex: number, bone: UI.Doctor.BoneStatus): string {
    if (this.state.inspected[boneIndex]) {
      if (bone.health < 20) {
        return 'red';
      }
      if (bone.health < 60) {
        return 'orange';
      }
      return 'green';
    }
    return 'white';
  }

  // Get inspection speed for a bone
  getBoneInspectSpeed(boneName: string): keyof typeof SPEEDS {
    return boneInspectSpeed[boneName] || 'normal';
  }

  // Close the doctor UI (escape key handling)
  close(): void {
    // Clear any pending inspection
    if (this.inspectTimeout) {
      clearTimeout(this.inspectTimeout);
      this.inspectTimeout = null;
    }
    
    this.updateState({ show: false });
  }

  // Update state and notify listeners
  updateState(newState: Partial<DoctorState>): void {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(listener => listener(this.state));
  }

  // Set inspecting state
  setInspecting(index: number): void {
    this.updateState({ inspecting: index });
  }

  // Finish inspection
  finishInspection(inspected: boolean[]): void {
    this.updateState({ 
      inspecting: -1,
      inspected 
    });
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
  getState(): DoctorState {
    return this.state;
  }

  // Cleanup when store is destroyed
  cleanup(): void {
    // Clear any pending inspection timeout
    if (this.inspectTimeout) {
      clearTimeout(this.inspectTimeout);
      this.inspectTimeout = null;
    }
    
    // Note: onClient doesn't provide cleanup mechanism
    // so we just clear internal state
    this.listeners.clear();
    this.initialized = false;
  }
}

export default DoctorStore.getInstance();
export { boneInspectSpeed };