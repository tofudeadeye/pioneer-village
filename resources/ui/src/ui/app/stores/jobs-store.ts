import { Socket } from 'socket.io-client';

import { onClient } from '@lib/ui';

interface JobsState {
  show: boolean;
  isClocked: boolean;
  currentJob: Jobs.JobDefinition | null;
  availableJobs: Jobs.JobDefinition[];
  clockedInEmployees: number;
  activeTasks: Jobs.TaskDefinition[];
  taskAvailability: Map<string, Jobs.TaskAvailability>;
}

type StateListener = (state: JobsState) => void;

class JobsStore {
  private static instance: JobsStore;
  private socket: Socket<SocketOut.ToClient, SocketIn.FromClient> | null = null;
  private state: JobsState;
  private listeners = new Set<StateListener>();
  private initialized = false;
  private clientHandlersSetup = false;
  private refreshInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.state = {
      show: false,
      isClocked: false,
      currentJob: null,
      availableJobs: [],
      clockedInEmployees: 0,
      activeTasks: [],
      taskAvailability: new Map(),
    };
  }

  static getInstance(): JobsStore {
    if (!JobsStore.instance) {
      JobsStore.instance = new JobsStore();
    }
    return JobsStore.instance;
  }

  initialize(socket: Socket<SocketOut.ToClient, SocketIn.FromClient>): void {
    if (this.initialized) {
      this.cleanup();
    }

    this.socket = socket;
    this.initialized = true;

    this.setupClientHandlers();

    setTimeout(() => {
      if (this.state.show) {
        this.refreshJobState();
      }
    }, 1000);

    this.refreshInterval = setInterval(() => {
      if (this.state.show) {
        this.refreshJobState();
      }
    }, 30000);
  }

  private setupClientHandlers(): void {
    if (this.clientHandlersSetup) return;
    this.clientHandlersSetup = true;

    onClient('jobs.toggle', this.handleToggle);
    onClient('jobs.show', this.handleShow);
    onClient('jobs.hide', this.handleHide);

    onClient('jobs.clock-in-update', () => {
      this.refreshJobState();
    });

    onClient('jobs.clock-out-update', () => {
      this.refreshJobState();
    });

    onClient('jobs.task-created', () => {
      this.refreshJobState();
    });
  }

  private handleToggle = (): void => {
    const newShow = !this.state.show;
    this.updateState({ show: newShow });
    if (newShow) {
      this.refreshJobState();
    }
  };

  private handleShow = (): void => {
    this.updateState({ show: true });
    this.refreshJobState();
  };

  private handleHide = (): void => {
    this.updateState({ show: false });
  };

  refreshJobState = (): void => {
    if (!this.socket) return;

    this.socket.emit('jobs.get-state', (state) => {
      if (!state.error) {
        this.updateState({
          isClocked: state.isClocked || false,
          currentJob: state.currentJob || null,
          availableJobs: state.availableJobs || [],
          clockedInEmployees: state.clockedInEmployees || 0,
        });
      }
    });
  };

  performClockIn(jobHandle: string): Promise<Jobs.ClockResult> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }

      this.socket.emit('jobs.clock-in', jobHandle, undefined, (result) => {
        resolve(result);
      });
    });
  }

  performClockOut(): Promise<Jobs.ClockResult> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }

      this.socket.emit('jobs.clock-out', (result) => {
        resolve(result);
      });
    });
  }

  toggleVisibility(): void {
    this.handleToggle();
  }

  show(): void {
    this.handleShow();
  }

  hide(): void {
    this.handleHide();
  }

  refresh(): void {
    this.refreshJobState();
  }

  updateState(newState: Partial<JobsState>): void {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach((listener) => listener(this.state));
  }

  close(): void {
    this.hide();
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): JobsState {
    return this.state;
  }

  cleanup(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this.listeners.clear();
    this.initialized = false;
  }
}

export default JobsStore.getInstance();
