import { awaitSocket, exports } from '@lib/server';

class JobsServer {
  constructor() {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    onNet('jobs.register-job-from-resource', (jobData: Jobs.JobDefinition) => {
      this.registerJob(jobData);
    });

    onNet('jobs.create-task-from-resource', (jobHandle: string, taskData: Jobs.TaskDefinition) => {
      this.createTask(jobHandle, taskData);
    });
  }

  public async registerJob(jobData: Jobs.JobDefinition): Promise<boolean> {
    try {
      const result = await awaitSocket('jobs.register-job', jobData);
      return result === true;
    } catch (error) {
      console.log(`[Jobs] Job registration failed:`, jobData.handle, error);
      return false;
    }
  }

  public async createTask(jobHandle: string, taskData: Jobs.TaskDefinition): Promise<boolean> {
    try {
      const result = await awaitSocket('jobs.create-task', jobHandle, taskData);
      return result === true;
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
      const result = await awaitSocket('jobs.grant-permission', characterId, type, typeId, grantedBy);
      return result === true;
    } catch (error) {
      console.log(`[Jobs] Permission grant failed:`, characterId, type, typeId, error);
      return false;
    }
  }

  public async revokePermission(characterId: number, type: 'JOB' | 'TASK', typeId: string): Promise<boolean> {
    try {
      const result = await awaitSocket('jobs.revoke-permission', characterId, type, typeId);
      return result === true;
    } catch (error) {
      console.log(`[Jobs] Permission revoke failed:`, characterId, type, typeId, error);
      return false;
    }
  }
}

const jobsServer = new JobsServer();

const registerJob: Jobs.ServerExports['registerJob'] = (jobData) => jobsServer.registerJob(jobData);
const createTask: Jobs.ServerExports['createTask'] = (jobHandle, taskData) =>
  jobsServer.createTask(jobHandle, taskData);
const grantPermission: Jobs.ServerExports['grantPermission'] = (characterId, type, typeId, grantedBy) =>
  jobsServer.grantPermission(characterId, type, typeId, grantedBy);

const revokePermission: Jobs.ServerExports['revokePermission'] = (characterId, type, typeId) =>
  jobsServer.revokePermission(characterId, type, typeId);

exports<'jobs'>('registerJob', registerJob);
exports<'jobs'>('createTask', createTask);
exports<'jobs'>('grantPermission', grantPermission);
exports<'jobs'>('revokePermission', revokePermission);
