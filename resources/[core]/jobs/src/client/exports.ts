import { exports } from '@lib/client';

import jobsClient from './client';

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
