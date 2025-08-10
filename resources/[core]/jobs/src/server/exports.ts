import { exports } from '@lib/server';
import jobsServer from './server';

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