import { PVJobs } from '@lib/client';

on('jobs:client:clock-in', async (type: string, data: { jobHandle: string }) => {
  console.log('Clocking in', type, data);

  const tasks = await PVJobs.clockIn(data.jobHandle, { x: 0, y: 0, z: 0 });
});

on('jobs:client:tasks', async (type: string, data: { jobHandle: string }) => {
  console.log('Tasks', type, data);

  const tasks = await PVJobs.getAvailableTasks(data.jobHandle);

  console.log('Available tasks for sheriff:', tasks);
});

on('jobs:client:clock-out', (type: string, data: { jobHandle: string }) => {
  console.log('Clocking out', type, data);

  PVJobs.clockOut();
});
