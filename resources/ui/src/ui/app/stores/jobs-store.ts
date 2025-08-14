import { Socket } from 'socket.io-client';
import { emitClient, onClient, onClientCall } from '@lib/ui';

// Store state interface
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

    // Get initial state after a short delay to ensure connection is ready
    setTimeout(() => {
      this.refreshJobState();
    }, 1000);

    // Set up periodic refresh
    this.refreshInterval = setInterval(() => {
      if (this.state.show) {
        this.refreshJobState();
      }
    }, 30000); // Refresh every 30 seconds when visible
  }

  private setupSocketHandlers(): void {
    if (!this.socket) return;

    // Handle clock in updates
    this.socket.on('jobs.clock-in-update', this.handleClockInUpdate);

    // Handle clock out updates
    this.socket.on('jobs.clock-out-update', this.handleClockOutUpdate);

    // Handle task created
    this.socket.on('jobs.task-created', this.handleTaskCreated);

    // Handle payment processed
    this.socket.on('jobs.payment-processed', this.handlePaymentProcessed);
  }

  private setupClientHandlers(): void {
    // Only set up client handlers once
    if (this.clientHandlersSetup) {
      return;
    }
    this.clientHandlersSetup = true;

    // Handle show/hide from client
    onClient('jobs.toggle', this.handleToggle);
    onClient('jobs.show', this.handleShow);
    onClient('jobs.hide', this.handleHide);

    // Register RPC handlers
    onClientCall('jobs.clock-in', this.clockIn);
    onClientCall('jobs.clock-out', this.clockOut);
    onClientCall('jobs.get-state', this.getJobState);
    onClientCall('jobs.can-start-task', this.canStartTask);
    onClientCall('jobs.get-available-tasks', this.getAvailableTasks);
  }

  // Handle clock in update from socket
  private handleClockInUpdate = (characterId: number, jobHandle: string): void => {
    // Emit to client for notifications
    emitClient('jobs.clock-in-update', characterId, jobHandle);
    
    // Refresh state to get updated employee count
    this.refreshJobState();
  };

  // Handle clock out update from socket
  private handleClockOutUpdate = (characterId: number, hoursWorked: number, payment: number): void => {
    // Emit to client for notifications
    emitClient('jobs.clock-out-update', characterId, hoursWorked, payment);
    
    // Refresh state to get updated employee count
    this.refreshJobState();
  };

  // Handle task created from socket
  private handleTaskCreated = (jobHandle: string, taskInstance: any): void => {
    // Emit to client for notifications
    emitClient('jobs.task-created', jobHandle, taskInstance);
    
    // Refresh state if this is for current job
    if (this.state.currentJob?.handle === jobHandle) {
      this.refreshJobState();
    }
  };

  // Handle payment processed from socket
  private handlePaymentProcessed = (characterId: number, amount: number, reason: string): void => {
    // Emit to client for notifications
    emitClient('jobs.payment-processed', characterId, amount, reason);
  };

  // Toggle visibility
  private handleToggle = (): void => {
    const newShow = !this.state.show;
    this.updateState({ show: newShow });
    
    if (newShow) {
      this.refreshJobState();
    }
  };

  // Show the jobs UI
  private handleShow = (): void => {
    this.updateState({ show: true });
    this.refreshJobState();
  };

  // Hide the jobs UI
  private handleHide = (): void => {
    this.updateState({ show: false });
  };

  // Refresh job state from server
  private refreshJobState = (): void => {
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

  // Clock in to a job
  private clockIn = (jobHandle: string, location: { x: number; y: number; z: number }): Promise<Jobs.ClockResult> => {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }

      this.socket.emit('jobs.clock-in', jobHandle, location, (result) => {
        if (result.success) {
          this.refreshJobState();
        }
        resolve(result);
      });
    });
  };

  // Clock out from current job
  private clockOut = (): Promise<Jobs.ClockResult> => {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }

      this.socket.emit('jobs.clock-out', (result) => {
        if (result.success) {
          this.refreshJobState();
        }
        resolve(result);
      });
    });
  };

  // Get current job state
  private getJobState = (): Promise<UI.Jobs.State & { error?: string }> => {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ 
          error: 'Not connected',
          show: false,
          isClocked: false,
          currentJob: null,
          availableJobs: [],
          clockedInEmployees: 0
        });
        return;
      }

      this.socket.emit('jobs.get-state', (state) => {
        resolve(state);
      });
    });
  };

  // Check if a task can be started
  private canStartTask = (taskId: number): Promise<Jobs.TaskAvailability> => {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ canStart: false, reason: 'Not connected' });
        return;
      }

      this.socket.emit('jobs.can-start-task', taskId, (result) => {
        // Update task availability map
        const taskAvailability = new Map(this.state.taskAvailability);
        taskAvailability.set(String(taskId), result);
        this.updateState({ taskAvailability });
        
        resolve(result);
      });
    });
  };

  // Get available tasks for a job
  private getAvailableTasks = (jobHandle?: string): Promise<Jobs.TaskDefinition[]> => {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve([]);
        return;
      }

      this.socket.emit('jobs.get-available-tasks', (tasks: Jobs.TaskDefinition[]) => {
        this.updateState({ activeTasks: tasks });
        resolve(tasks);
      }, jobHandle || this.state.currentJob?.handle);
    });
  };

  // Public API methods
  public async performClockIn(jobHandle: string, location: { x: number; y: number; z: number }): Promise<Jobs.ClockResult> {
    return this.clockIn(jobHandle, location);
  }

  public async performClockOut(): Promise<Jobs.ClockResult> {
    return this.clockOut();
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

  public refresh(): void {
    this.refreshJobState();
  }

  // Update state and notify listeners
  updateState(newState: Partial<JobsState>): void {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(listener => listener(this.state));
  }

  // Close jobs UI (for escape key compatibility)
  close(): void {
    this.hide();
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
  getState(): JobsState {
    return this.state;
  }

  // Cleanup when store is destroyed
  cleanup(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }

    if (this.socket) {
      // Remove socket handlers
      this.socket.off('jobs.clock-in-update', this.handleClockInUpdate);
      this.socket.off('jobs.clock-out-update', this.handleClockOutUpdate);
      this.socket.off('jobs.task-created', this.handleTaskCreated);
      this.socket.off('jobs.payment-processed', this.handlePaymentProcessed);
    }

    this.listeners.clear();
    this.initialized = false;
  }
}

export default JobsStore.getInstance();