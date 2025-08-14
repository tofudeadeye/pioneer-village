import { exports, PVGame } from '@lib/client';
import { Log, awaitUI, onUI } from '@lib/client/comms/ui';

// Job System Client
class JobsClient {
  private currentJob: Jobs.JobDefinition | null = null;
  private isClocked = false;

  constructor() {
    this.init();
  }

  private init(): void {
    Log('[Jobs]', 'Jobs client initialized');

    // Register commands
    this.registerCommands();

    // Listen for server events
    this.setupEventHandlers();

    // Get initial state
    this.getJobState();
  }

  private registerCommands(): void {
    // Clock in command
    RegisterCommand(
      'clockin',
      (source: number, args: string[]) => {
        const jobHandle = args[0];
        if (!jobHandle) {
          Log('[Jobs]', 'Usage: /clockin <job_handle>');
          return;
        }

        this.clockIn(jobHandle);
      },
      false,
    );

    // Clock out command
    RegisterCommand(
      'clockout',
      (source: number, args: string[]) => {
        this.clockOut();
      },
      false,
    );

    // Jobs list command
    RegisterCommand(
      'jobs',
      (source: number, args: string[]) => {
        this.showJobsList();
      },
      false,
    );

    // Job status command
    RegisterCommand(
      'jobstatus',
      (source: number, args: string[]) => {
        this.showJobStatus();
      },
      false,
    );
  }

  private setupEventHandlers(): void {
    // Listen for job state updates from socket
    onUI('jobs.clock-in-update', (characterId: number, jobHandle: string) => {
      Log('[Jobs]', `Character ${characterId} clocked in to ${jobHandle}`);
      if (characterId === this.getCharacterId()) {
        this.isClocked = true;
        this.getJobState(); // Refresh state
      }
    });

    onUI('jobs.clock-out-update', (characterId: number, hoursWorked: number, payment: number) => {
      Log(
        '[Jobs]',
        `Character ${characterId} clocked out. Hours: ${hoursWorked.toFixed(2)}, Payment: $${payment.toFixed(2)}`,
      );
      if (characterId === this.getCharacterId()) {
        this.isClocked = false;
        this.currentJob = null;

        // Show payment notification
        this.showNotification(`Clocked out! Worked ${hoursWorked.toFixed(2)} hours. Earned $${payment.toFixed(2)}`);
      }
    });

    // Listen for other job events
    onUI('jobs.task-created', (jobHandle: string, taskInstance: any) => {
      Log('[Jobs]', `New task created for job ${jobHandle}`);
    });

    onUI('jobs.task-started', (characterId: number, taskId: number) => {
      if (characterId === this.getCharacterId()) {
        Log('[Jobs]', `Started task ${taskId}`);
      }
    });

    onUI('jobs.task-completed', (characterId: number, taskId: number, payment: number) => {
      if (characterId === this.getCharacterId()) {
        Log('[Jobs]', `Completed task ${taskId}. Earned $${payment.toFixed(2)}`);
        this.showNotification(`Task completed! Earned $${payment.toFixed(2)}`);
      }
    });

    onUI('jobs.permission-granted', (characterId: number, type: string, typeId: number) => {
      if (characterId === this.getCharacterId()) {
        Log('[Jobs]', `Granted permission for ${type} ${typeId}`);
      }
    });
  }

  private async clockIn(jobHandle: string): Promise<void> {
    try {
      const ped = PlayerPedId();
      const [x, y, z] = GetEntityCoords(ped, false);
      const location = { x, y, z };
      const result = await awaitUI('jobs.clock-in', jobHandle, location);
      if (result.success) {
        Log('[Jobs]', `Successfully clocked in to ${jobHandle}`);
        this.showNotification(`Clocked in to ${jobHandle}`);
      } else {
        Log('[Jobs]', `Failed to clock in: ${result.error}`);
        this.showNotification(`Failed to clock in: ${result.error}`, 'error');
      }
    } catch (error) {
      Log('[Jobs]', 'Error clocking in:', error);
      this.showNotification('Failed to clock in', 'error');
    }
  }

  private async clockOut(): Promise<void> {
    try {
      const result = await awaitUI('jobs.clock-out');
      if (result.success) {
        Log('[Jobs]', 'Successfully clocked out');
      } else {
        Log('[Jobs]', `Failed to clock out: ${result.error}`);
        this.showNotification(`Failed to clock out: ${result.error}`, 'error');
      }
    } catch (error) {
      Log('[Jobs]', 'Error clocking out:', error);
      this.showNotification('Failed to clock out', 'error');
    }
  }

  private async getJobState(): Promise<void> {
    try {
      const state = await awaitUI('jobs.get-state');
      if (state) {
        this.currentJob = state.currentJob;
        this.isClocked = state.isClocked;
        Log('[Jobs]', 'Job state updated:', state);
      }
    } catch (error) {
      Log('[Jobs]', 'Error getting job state:', error);
    }
  }

  private async showJobsList(): Promise<void> {
    try {
      const tasks = await awaitUI('jobs.get-available-tasks');
      Log('[Jobs]', 'Available tasks:', tasks);

      // Show in notification
      if (tasks && Array.isArray(tasks) && tasks.length > 0) {
        const taskList = tasks.map((task: Jobs.TaskDefinition) => `- ${task.name}`).join('\n');
        this.showNotification(`Available Tasks:\n${taskList}`, 'info', 10000);
      } else {
        this.showNotification('No tasks available', 'info');
      }
    } catch (error) {
      Log('[Jobs]', 'Error getting jobs list:', error);
    }
  }

  private showJobStatus(): void {
    if (this.isClocked && this.currentJob) {
      this.showNotification(`Currently working: ${this.currentJob.name}`, 'info');
    } else {
      this.showNotification('Not currently clocked in to any job', 'info');
    }
  }

  private getCharacterId(): number {
    const id = PVGame.characterId();
    return id ?? 0; // Return 0 if null, or handle appropriately
  }

  private showNotification(message: string, type: 'info' | 'success' | 'error' = 'success', duration = 5000): void {
    // This would integrate with your notification system
    Log('[Jobs]', `[${type.toUpperCase()}] ${message}`);
    // TODO: Implement actual notification UI
  }

  // Public methods for exports
  public getCurrentJob(): Jobs.JobDefinition | null {
    return this.currentJob;
  }

  public isCurrentlyClocked(): boolean {
    return this.isClocked;
  }

  public async canStartTask(taskId: number): Promise<Jobs.TaskAvailability> {
    // Check if player can start a specific task
    return {
      canStart: true,
      reason: undefined,
    };
  }

  public async getAvailableTasks(jobHandle?: string): Promise<Jobs.TaskDefinition[]> {
    // Get available tasks for current or specified job
    const handle = jobHandle || this.currentJob?.handle;
    if (!handle) return [];

    // TODO: Get actual tasks from server
    return [];
  }
}

// Initialize the jobs client
const jobsClient = new JobsClient();

// Export functions for other resources to use
const getCurrentJob: Jobs.ClientExports['getCurrentJob'] = () => jobsClient.getCurrentJob();
const isCurrentlyClocked: Jobs.ClientExports['isCurrentlyClocked'] = () => jobsClient.isCurrentlyClocked();
const canStartTask: Jobs.ClientExports['canStartTask'] = (taskId) => jobsClient.canStartTask(taskId);
const getAvailableTasks: Jobs.ClientExports['getAvailableTasks'] = (jobHandle) =>
  jobsClient.getAvailableTasks(jobHandle);

// Register exports
exports<'jobs'>('getCurrentJob', getCurrentJob);
exports<'jobs'>('isCurrentlyClocked', isCurrentlyClocked);
exports<'jobs'>('canStartTask', canStartTask);
exports<'jobs'>('getAvailableTasks', getAvailableTasks);