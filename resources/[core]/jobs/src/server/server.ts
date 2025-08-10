import { emitSocket, awaitSocket } from '@lib/server';
import './exports';

// Job System Server
class JobsServer {
  constructor() {
    this.init();
  }

  private init(): void {
    console.log('[Jobs] Jobs server initialized');

    // Setup event handlers
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Listen for job-related events from other resources
    onNet('jobs.register-job-from-resource', (jobData: Jobs.JobDefinition) => {
      const source = global.source;
      console.log(`[Jobs] Job registration request from source ${source}:`, jobData);
      this.registerJob(jobData);
    });

    onNet('jobs.create-task-from-resource', (jobHandle: string, taskData: Jobs.TaskDefinition) => {
      const source = global.source;
      console.log(`[Jobs] Task creation request from source ${source}:`, jobHandle, taskData);
      this.createTask(jobHandle, taskData);
    });
  }

  public async registerJob(jobData: Jobs.JobDefinition): Promise<boolean> {
    try {
      // Forward to socket controller - fire and forget
      emitSocket('jobs.register-job', jobData);
      console.log(`[Jobs] Job registration sent:`, jobData.handle);
      return true;
    } catch (error) {
      console.log(`[Jobs] Job registration failed:`, jobData.handle, error);
      return false;
    }
  }

  public async createTask(jobHandle: string, taskData: Jobs.TaskDefinition): Promise<boolean> {
    try {
      // Forward to socket controller - fire and forget
      emitSocket('jobs.create-task', jobHandle, taskData);
      console.log(`[Jobs] Task creation sent:`, jobHandle, taskData.name);
      return true;
    } catch (error) {
      console.log(`[Jobs] Task creation failed:`, jobHandle, taskData.name, error);
      return false;
    }
  }

  public async grantPermission(characterId: number, type: 'JOB' | 'TASK', typeId: string, grantedBy: number): Promise<boolean> {
    try {
      // Forward to socket controller - fire and forget
      emitSocket('jobs.grant-permission', characterId, type, typeId, grantedBy);
      console.log(`[Jobs] Permission grant sent:`, characterId, type, typeId);
      return true;
    } catch (error) {
      console.log(`[Jobs] Permission grant failed:`, characterId, type, typeId, error);
      return false;
    }
  }

  public processPayment(characterId: number, amount: number, reason: string): boolean {
    // TODO: Integrate with PVBank when available
    // For now, just log the payment
    console.log(`[Jobs] TODO: Process payment for character ${characterId}: $${amount.toFixed(2)} for ${reason}`);

    // Emit event for other resources to listen to
    emitNet('jobs.payment-processed', -1, characterId, amount, reason);

    return true;
  }
}

// Initialize the jobs server
const jobsServer = new JobsServer();

// Example usage for other resources:
/*
// Register a job
exports.jobs.registerJob({
  handle: 'sheriff',
  name: 'Sheriff Department',
  description: 'Maintain law and order in the town',
  paymentType: 'HOURLY',
  paymentAmount: '25.00',
  requirements: { badge: true },
  clockInConstraints: {
    location: { x: 100, y: 200, z: 30, radius: 10 },
    hours: { start: 6, end: 22 }
  }
});

// Create a task
exports.jobs.createTask('sheriff', {
  name: 'Patrol Main Street',
  description: 'Walk patrol around the main street area',
  taskType: 'patrol',
  requirements: { badge: true },
  rewards: { money: 10 }
});

// Grant permission
exports.jobs.grantPermission(characterId, 'JOB', 'sheriff', adminCharacterId);
*/

export default jobsServer;
