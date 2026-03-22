import { PVJobs } from '@lib/client';
import { Log } from '@lib/client/comms/ui';

on('jobs:client:clock-in', async (type: string, data: { jobHandle: string }) => {
  Log('Clocking in', type, data);

  const tasks = await PVJobs.clockIn(data.jobHandle, { x: 0, y: 0, z: 0 });
});

on('jobs:client:tasks', async (type: string, data: { jobHandle: string }) => {
  Log('Tasks', type, data);

  const tasks = await PVJobs.getAvailableTasks(data.jobHandle);

  Log('Available tasks for sheriff:', tasks);
});

on('jobs:client:clock-out', (type: string, data: { jobHandle: string }) => {
  Log('Clocking out', type, data);

  PVJobs.clockOut();
});
