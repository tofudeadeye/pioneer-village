// Import exports to register them
import './exports';

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
    timeWindow: { start: '08:00', end: '20:00' }
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
// exports.jobs.grantPermission(characterId, 'JOB', 'sheriff', adminCharacterId);
*/