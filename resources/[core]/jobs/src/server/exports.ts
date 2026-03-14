import { exports, emitSocket, awaitSocket } from '@lib/server';

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

  public async grantPermission(
    characterId: number,
    type: 'JOB' | 'TASK',
    typeId: string,
    grantedBy: number,
  ): Promise<boolean> {
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
    // Process payment through socket
    emitSocket('jobs.process-payment', characterId, amount, reason);
    console.log(`[Jobs] Payment processed:`, characterId, amount, reason);

    // You might also want to emit this to the client
    // TriggerClientEvent('jobs.payment-received', playerId, amount, reason);

    return true;
  }
}

// Initialize the jobs server
const jobsServer = new JobsServer();

// Export functions for other resources to use
const registerJob: Jobs.ServerExports['registerJob'] = (jobData) => jobsServer.registerJob(jobData);
const createTask: Jobs.ServerExports['createTask'] = (jobHandle, taskData) => jobsServer.createTask(jobHandle, taskData);
const grantPermission: Jobs.ServerExports['grantPermission'] = (characterId, type, typeId, grantedBy) => jobsServer.grantPermission(characterId, type, typeId, grantedBy);
const processPayment: Jobs.ServerExports['processPayment'] = (characterId, amount, reason) => jobsServer.processPayment(characterId, amount, reason);

// Register exports
exports<'jobs'>('registerJob', registerJob);
exports<'jobs'>('createTask', createTask);
exports<'jobs'>('grantPermission', grantPermission);
exports<'jobs'>('processPayment', processPayment);