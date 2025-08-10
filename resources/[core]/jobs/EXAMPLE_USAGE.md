# Job System Usage Examples

This document provides examples of how other resources can integrate with the job system.

## Basic Job Registration

### Server-side (in another resource's server script):

```typescript
// Register a Sheriff job
const sheriffJob = {
  handle: 'sheriff',
  name: 'Sheriff Department',
  description: 'Maintain law and order in the town',
  paymentType: 'HOURLY',
  paymentAmount: '25.00',
  requirements: { badge: true },
  clockInConstraints: {
    location: { x: -275.0, y: 804.0, z: 118.0, radius: 10 },
    hours: { start: 6, end: 22 }
  },
  metadata: { department: 'law_enforcement' }
};

// Register the job
exports.jobs.registerJob(sheriffJob).then((success) => {
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
    endHour: 20
  },
  repeatConfig: {
    type: 'COOLDOWN',
    cooldownMinutes: 30,
    maxPerDay: 8
  }
};

exports.jobs.createTask('sheriff', patrolTask);
```

### Client-side (in another resource's client script):

```typescript
// Check if player is currently working
const isWorking = exports.jobs.isCurrentlyClocked();
const currentJob = exports.jobs.getCurrentJob();

if (isWorking && currentJob?.handle === 'sheriff') {
  // Player is working as sheriff
  console.log('Player is on duty as sheriff');
  
  // Check if they can start a patrol task
  exports.jobs.canStartTask(1).then((availability) => {
    if (availability.canStart) {
      // Show patrol prompt
    } else {
      console.log('Cannot start patrol:', availability.reason);
    }
  });
}
```

## Advanced Examples

### Saloon Job with Dynamic Tasks

```typescript
// Server-side
const saloonJob = {
  handle: 'saloon',
  name: 'Saloon Worker',
  description: 'Serve drinks and maintain the saloon',
  paymentType: 'HOURLY',
  paymentAmount: '15.00',
  clockInConstraints: {
    location: { x: -312.0, y: 805.0, z: 118.0, radius: 15 },
    hours: { start: 16, end: 26 } // 4 PM to 2 AM
  }
};

exports.jobs.registerJob(saloonJob);

// Generate random cleaning tasks
setInterval(() => {
  const dirtyTables = getDirtyTables(); // Your custom function
  
  dirtyTables.forEach((table, index) => {
    const cleaningTask = {
      handle: `clean-table-${table.id}`,
      name: 'Clean Table',
      description: `Clean table ${table.id}`,
      taskType: 'cleaning',
      requirements: { rag: true },
      rewards: { money: 5 },
      repeatConfig: {
        type: 'BURST',
        maxPerHour: 12,
        burstSize: 4,
        burstCooldownMinutes: 10
      },
      metadata: { tableId: table.id, location: table.position }
    };
    
    exports.jobs.createTask('saloon', cleaningTask);
  });
}, 300000); // Every 5 minutes
```

### Permission-Based Job Access

```typescript
// Grant sheriff job permission to a character
exports.jobs.grantPermission(characterId, 'JOB', 'sheriff', adminCharacterId);

// Grant specific task permission
exports.jobs.grantPermission(characterId, 'TASK', 'arrest-warrant', sheriffCharacterId);
```

## Event Handling

### Listen for Job Events

```typescript
// Server-side
AddEventHandler('jobs:clockIn', (characterId, jobHandle, clockInTime) => {
  console.log(`Character ${characterId} clocked in to ${jobHandle}`);
  
  if (jobHandle === 'sheriff') {
    // Give sheriff equipment
    giveSheriffBadge(characterId);
    giveSheriffWeapons(characterId);
  }
});

AddEventHandler('jobs:clockOut', (characterId, jobHandle, hoursWorked, payment) => {
  console.log(`Character ${characterId} clocked out from ${jobHandle}`);
  console.log(`Worked ${hoursWorked} hours, earned $${payment}`);
  
  if (jobHandle === 'sheriff') {
    // Remove sheriff equipment
    removeSheriffEquipment(characterId);
  }
});

AddEventHandler('jobs:paymentProcessed', (characterId, amount, reason) => {
  console.log(`Payment processed: Character ${characterId} received $${amount} for ${reason}`);
  
  // You could integrate with your bank system here
  // BankSystem.addMoney(characterId, amount);
});
```

## Commands Integration

The job system provides these commands out of the box:

- `/clockin <job_handle>` - Clock in to a job
- `/clockout` - Clock out from current job
- `/jobs` - List available jobs
- `/jobstatus` - Show current job status

## UI Integration

Other resources can trigger the jobs UI:

```typescript
// Client-side
emitUI('jobs:show'); // Show the jobs management UI
```

## Database Integration

The job system automatically handles:
- Job registration and storage
- Employee clock-in/out tracking
- Task instance management
- Permission management
- Cooldown tracking

All data is persisted in the database and restored on server restart.

## Best Practices

1. **Job Handles**: Use descriptive, unique handles (e.g., 'sheriff', 'saloon-worker', 'bank-teller')

2. **Payment Types**:
   - `HOURLY`: Fixed hourly rate
   - `PER_TASK`: Payment per completed task
   - `COMMISSION`: Percentage-based payment
   - `SALARY`: Fixed daily/weekly salary
   - `CALLBACK`: Custom payment logic

3. **Clock-in Constraints**:
   - Use location constraints for jobs that require being at a specific place
   - Use time constraints for jobs with specific working hours
   - Combine both for realistic job requirements

4. **Task Design**:
   - Make tasks meaningful and engaging
   - Use appropriate cooldowns to prevent spam
   - Consider burst limits for repetitive tasks
   - Provide clear descriptions and requirements

5. **Permission Management**:
   - Grant job permissions through proper channels (hiring process)
   - Use task-specific permissions for specialized duties
   - Regularly audit permissions for security

This job system provides a solid foundation for creating immersive employment experiences in your RedM server.
