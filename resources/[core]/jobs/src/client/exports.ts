import { PVGame, exports } from '@lib/client';
import { awaitUI, emitUI, onUI } from '@lib/client/comms/ui';

class JobsClient {
  private currentJob: Jobs.JobDefinition | null = null;
  private isClocked = false;

  constructor() {
    this.init();
  }

  private init(): void {
    this.registerCommands();
    this.setupEventHandlers();
    this.getJobState();
  }

  private registerCommands(): void {
    RegisterCommand(
      'clockin',
      (_source: number, args: string[]) => {
        const jobHandle = args[0];
        if (!jobHandle) {
          this.notify('Usage: /clockin <job_handle>', 'error');
          return;
        }
        this.clockIn(jobHandle);
      },
      false,
    );

    RegisterCommand(
      'clockout',
      () => {
        this.clockOut();
      },
      false,
    );

    RegisterCommand(
      'jobs',
      () => {
        this.showJobsList();
      },
      false,
    );

    RegisterCommand(
      'jobstatus',
      () => {
        this.showJobStatus();
      },
      false,
    );
  }

  private setupEventHandlers(): void {
    onUI('jobs.clock-in-update', (characterId, jobHandle) => {
      if (characterId === this.getCharacterId()) {
        this.isClocked = true;
        this.getJobState();
        this.notify(`Clocked in to ${jobHandle}`, 'success');
      }
    });

    onUI('jobs.clock-out-update', (characterId, hoursWorked, payment) => {
      if (characterId === this.getCharacterId()) {
        this.isClocked = false;
        this.currentJob = null;
        this.notify(`Clocked out! Worked ${hoursWorked.toFixed(2)} hours. Earned $${payment.toFixed(2)}`, 'success');
      }
    });

    onUI('jobs.task-created', (_jobHandle, _taskInstance) => {
      // Task created events are informational for the client
    });

    onUI('jobs.task-started', (characterId, taskId) => {
      if (characterId === this.getCharacterId()) {
        this.notify(`Started task #${taskId}`, 'info');
      }
    });

    onUI('jobs.task-completed', (characterId, _taskId, payment) => {
      if (characterId === this.getCharacterId()) {
        this.notify(`Task completed! Earned $${payment.toFixed(2)}`, 'success');
      }
    });

    onUI('jobs.payment-processed', (characterId, amount, reason) => {
      if (characterId === this.getCharacterId()) {
        this.notify(`Pay slip: $${amount.toFixed(2)} — ${reason}`, 'info');
      }
    });

    onUI('jobs.permission-granted', (characterId, type, typeId) => {
      if (characterId === this.getCharacterId()) {
        this.notify(`Permission granted: ${type} ${typeId}`, 'info');
      }
    });
  }

  private async clockIn(jobHandle: string): Promise<void> {
    try {
      const ped = PlayerPedId();
      const [x, y, z] = GetEntityCoords(ped, false);
      const location = { x, y, z };
      const result = await awaitUI('jobs.clock-in', jobHandle, location);
      if (!result.success) {
        this.notify(`Failed to clock in: ${result.error}`, 'error');
      }
    } catch (error) {
      this.notify('Failed to clock in', 'error');
    }
  }

  private async clockOut(): Promise<void> {
    try {
      const result = await awaitUI('jobs.clock-out');
      if (!result.success) {
        this.notify(`Failed to clock out: ${result.error}`, 'error');
      }
    } catch (error) {
      this.notify('Failed to clock out', 'error');
    }
  }

  private async getJobState(): Promise<void> {
    try {
      const state = await awaitUI('jobs.get-state');
      if (state && !state.error) {
        this.currentJob = state.currentJob;
        this.isClocked = state.isClocked;
      }
    } catch (error) {
      // State refresh failure is non-critical
    }
  }

  private async showJobsList(): Promise<void> {
    try {
      const tasks = await awaitUI('jobs.get-available-tasks');
      if (tasks && Array.isArray(tasks) && tasks.length > 0) {
        const taskList = tasks.map((task: Jobs.TaskDefinition) => task.name).join(', ');
        this.notify(`Available: ${taskList}`, 'info', 10000);
      } else {
        this.notify('No tasks available', 'info');
      }
    } catch (error) {
      this.notify('Error getting jobs list', 'error');
    }
  }

  private showJobStatus(): void {
    if (this.isClocked && this.currentJob) {
      this.notify(`Currently working: ${this.currentJob.name}`, 'info');
    } else {
      this.notify('Not currently clocked in', 'info');
    }
  }

  private getCharacterId(): number {
    const id = PVGame.characterId();
    return id ?? 0;
  }

  private notify(message: string, type: 'info' | 'success' | 'error' = 'success', duration = 5000): void {
    const colors: Record<string, { bg: string; fg: string }> = {
      success: { bg: '#2d5a2d', fg: '#ffffff' },
      error: { bg: '#5a2d2d', fg: '#ffffff' },
      info: { bg: '#2d2d5a', fg: '#ffffff' },
    };
    const color = colors[type] || colors.info;
    emitUI('notification.notify', message, duration, color.bg, color.fg, false);
  }

  public getCurrentJob(): Jobs.JobDefinition | null {
    return this.currentJob;
  }

  public isCurrentlyClocked(): boolean {
    return this.isClocked;
  }

  public async canStartTask(taskId: number): Promise<Jobs.TaskAvailability> {
    try {
      return await awaitUI('jobs.can-start-task', taskId);
    } catch (_error) {
      return { canStart: false, reason: 'Error checking task availability' };
    }
  }

  public async getAvailableTasks(jobHandle?: string): Promise<Jobs.TaskDefinition[]> {
    try {
      const handle = jobHandle || this.currentJob?.handle;
      if (!handle) return [];
      return await awaitUI('jobs.get-available-tasks', handle);
    } catch (_error) {
      return [];
    }
  }
}

const jobsClient = new JobsClient();

const getCurrentJob: Jobs.ClientExports['getCurrentJob'] = () => jobsClient.getCurrentJob();
const isCurrentlyClocked: Jobs.ClientExports['isCurrentlyClocked'] = () => jobsClient.isCurrentlyClocked();
const canStartTask: Jobs.ClientExports['canStartTask'] = (taskId) => jobsClient.canStartTask(taskId);
const getAvailableTasks: Jobs.ClientExports['getAvailableTasks'] = (jobHandle) =>
  jobsClient.getAvailableTasks(jobHandle);

exports<'jobs'>('getCurrentJob', getCurrentJob);
exports<'jobs'>('isCurrentlyClocked', isCurrentlyClocked);
exports<'jobs'>('canStartTask', canStartTask);
exports<'jobs'>('getAvailableTasks', getAvailableTasks);
