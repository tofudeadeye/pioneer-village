// Register a Sheriff job
import { PVJobs } from '@lib/server';

const sheriffJob = {
  handle: 'sheriff',
  name: 'Sheriff Department',
  description: 'Maintain law and order in the town',
  paymentType: 'HOURLY',
  paymentAmount: '25.00',
  requirements: { badge: true },
  clockInConstraints: {
    location: { x: -763.370667, y: -1271.457031, z: 44.045452, radius: 10.5 },
    hours: { start: 6, end: 22 },
  },
  metadata: { department: 'law_enforcement' },
};

// Register the job
PVJobs.registerJob(sheriffJob).then((success) => {
  if (success) {
    console.log('Sheriff job registered successfully');
  } else {
    console.log('Failed to register sheriff job');
  }
});

// Create a patrol task
const patrolTask = {
  handle: 'patrol-main-street',
  name: 'Patrol Main Street',
  description: 'Walk patrol around the main street area',
  taskType: 'patrol',
  requirements: { badge: true },
  rewards: { money: 10 },
  timeConstraints: {
    startHour: 8,
    endHour: 20,
  },
  repeatConfig: {
    type: 'COOLDOWN',
    cooldownMinutes: 30,
    maxPerDay: 8,
  },
};

PVJobs.createTask('sheriff', patrolTask);
