import { awaitSocket, exports } from '@lib/server';

// Event handlers
onNet('jobs.register-job-from-resource', (jobData: Jobs.JobDefinition) => {
  registerJob(jobData);
});

onNet('jobs.create-task-from-resource', (jobHandle: string, taskData: Jobs.TaskDefinition) => {
  createTask(jobHandle, taskData);
});

// Exported functions
const registerJob: Jobs.ServerExports['registerJob'] = async (jobData) => {
  try {
    const result = await awaitSocket('jobs.register-job', jobData);
    return result === true;
  } catch (error) {
    console.log(`[Jobs] Job registration failed:`, jobData.handle, error);
    return false;
  }
};

const createTask: Jobs.ServerExports['createTask'] = async (jobHandle, taskData) => {
  try {
    const result = await awaitSocket('jobs.create-task', jobHandle, taskData);
    return result === true;
  } catch (error) {
    console.log(`[Jobs] Task creation failed:`, jobHandle, taskData.name, error);
    return false;
  }
};

const grantPermission: Jobs.ServerExports['grantPermission'] = async (characterId, type, typeId, grantedBy) => {
  try {
    const result = await awaitSocket('jobs.grant-permission', characterId, type, typeId, grantedBy);
    return result === true;
  } catch (error) {
    console.log(`[Jobs] Permission grant failed:`, characterId, type, typeId, error);
    return false;
  }
};

const revokePermission: Jobs.ServerExports['revokePermission'] = async (characterId, type, typeId) => {
  try {
    const result = await awaitSocket('jobs.revoke-permission', characterId, type, typeId);
    return result === true;
  } catch (error) {
    console.log(`[Jobs] Permission revoke failed:`, characterId, type, typeId, error);
    return false;
  }
};

exports<'jobs'>('registerJob', registerJob);
exports<'jobs'>('createTask', createTask);
exports<'jobs'>('grantPermission', grantPermission);
exports<'jobs'>('revokePermission', revokePermission);
