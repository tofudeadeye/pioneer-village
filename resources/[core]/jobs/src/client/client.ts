import { PVGame } from '@lib/client';
import { Log, awaitUI, onUI } from '@lib/client/comms/ui';

import './exports';

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

    onUI('jobs.payment-processed', (characterId: number, amount: number, reason: string) => {
      Log('[Jobs]', `Payment processed for character ${characterId}: $${amount.toFixed(2)} - ${reason}`);
    });
  }

  private getCharacterId(): number {
    // Get character ID from the game manager
    return PVGame.characterId || 0;
  }

  private getPlayerPosition(): { x: number; y: number; z: number } {
    const playerPed = PlayerPedId();
    const [x, y, z] = GetEntityCoords(playerPed, false);
    return { x, y, z };
  }

  private async clockIn(jobHandle: string): Promise<void> {
    if (this.isClocked) {
      this.showNotification('You are already clocked in to a job. Clock out first.');
      return;
    }

    const location = this.getPlayerPosition();

    try {
      const result = await awaitUI('jobs.clock-in', jobHandle, location);
      if (result.success) {
        this.showNotification(`Successfully clocked in to ${jobHandle}`);
        this.isClocked = true;
        this.getJobState();
      } else {
        this.showNotification(`Failed to clock in: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      this.showNotification('Failed to clock in: Network error');
      Log('[Jobs]', 'Clock in error:', error);
    }
  }

  private async clockOut(): Promise<void> {
    if (!this.isClocked) {
      this.showNotification('You are not clocked in to any job.');
      return;
    }

    try {
      const result = await awaitUI('jobs.clock-out');
      if (result.success) {
        const hoursWorked = result.hoursWorked || 0;
        const payment = result.payment || 0;
        this.showNotification(`Clocked out! Worked ${hoursWorked.toFixed(2)} hours. Earned $${payment.toFixed(2)}`);
        this.isClocked = false;
        this.currentJob = null;
      } else {
        this.showNotification('Failed to clock out.');
      }
    } catch (error) {
      this.showNotification('Failed to clock out: Network error');
      Log('[Jobs]', 'Clock out error:', error);
    }
  }

  private async showJobsList(): Promise<void> {
    try {
      const state = await awaitUI('jobs.get-state');
      if (state.error) {
        this.showNotification('Failed to get job information.');
        return;
      }

      const availableJobs = state.availableJobs || [];

      if (availableJobs.length === 0) {
        this.showNotification('No jobs available.');
        return;
      }

      Log('[Jobs]', 'Available Jobs:');
      availableJobs.forEach((job: Jobs.JobDefinition) => {
        Log('[Jobs]', `- ${job.handle}: ${job.name} (${job.paymentType}: $${job.paymentAmount})`);
      });

      this.showNotification(`Found ${availableJobs.length} available jobs. Check console for details.`);
    } catch (error) {
      this.showNotification('Failed to get job information.');
      Log('[Jobs]', 'Show jobs list error:', error);
    }
  }

  private async showJobStatus(): Promise<void> {
    try {
      const state = await awaitUI('jobs.get-state');
      if (state.error) {
        this.showNotification('Failed to get job status.');
        return;
      }

      if (state.isClocked && state.currentJob) {
        const job = state.currentJob;
        this.showNotification(`Currently working: ${job.name} (${job.handle})`);
        Log('[Jobs]', `Job Status: ${job.name} - ${job.description || 'No description'}`);
        Log('[Jobs]', `Payment: ${job.paymentType} - $${job.paymentAmount}`);
      } else {
        this.showNotification('You are not currently working any job.');
      }

      Log('[Jobs]', `Total clocked-in employees: ${state.clockedInEmployees || 0}`);
    } catch (error) {
      this.showNotification('Failed to get job status.');
      Log('[Jobs]', 'Show job status error:', error);
    }
  }

  private async getJobState(): Promise<void> {
    try {
      const state = await awaitUI('jobs.get-state');
      if (state.error) {
        Log('[Jobs]', 'Failed to get job state:', state.error);
        return;
      }

      this.isClocked = state.isClocked || false;
      this.currentJob = state.currentJob || null;

      Log('[Jobs]', 'Job state updated:', { isClocked: this.isClocked, currentJob: this.currentJob?.handle });
    } catch (error) {
      Log('[Jobs]', 'Get job state error:', error);
    }
  }

  private showNotification(message: string): void {
    // This would show a notification to the player
    // For now, just log it
    Log('[Jobs]', `Notification: ${message}`);

    // You could also emit to UI for a proper notification
    // emitUI('notification:show', { message, type: 'info' });
  }

  // Public methods for other resources to use
  public getCurrentJob(): Jobs.JobDefinition | null {
    return this.currentJob;
  }

  public isCurrentlyClocked(): boolean {
    return this.isClocked;
  }

  public async canStartTask(taskId: number): Promise<Jobs.TaskAvailability> {
    try {
      return await awaitUI('jobs.can-start-task', taskId);
    } catch (error) {
      Log('[Jobs]', 'Can start task error:', error);
      return { canStart: false, reason: 'Network error' };
    }
  }

  public async getAvailableTasks(jobHandle?: string): Promise<Jobs.TaskDefinition[]> {
    try {
      return await awaitUI('jobs.get-available-tasks', jobHandle);
    } catch (error) {
      Log('[Jobs]', 'Get available tasks error:', error);
      return [];
    }
  }
}

// Initialize the jobs client
const jobsClient = new JobsClient();

// Export the client instance
export default jobsClient;
