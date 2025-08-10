# Pioneer Village Job System

A comprehensive job management system for RedM servers that provides flexible employment mechanics, task management, and payment processing.

## Features

### Core Functionality
- **Job Registration**: Dynamic job creation and management
- **Clock In/Out System**: Location and time-based constraints
- **Task Management**: Flexible task creation with scheduling and rate limiting
- **Permission System**: Granular access control for jobs and tasks
- **Payment Processing**: Multiple payment types (hourly, per-task, commission, etc.)
- **UI Integration**: Clean, responsive job management interface
- **Database Persistence**: All data stored and restored on server restart

### Advanced Features
- **Time-Based Scheduling**: Tasks available only during specific hours/days
- **Rate Limiting**: Cooldown, burst, and window-based task restrictions
- **Location Constraints**: Jobs requiring specific locations for clock-in
- **Event System**: Comprehensive hooks for other resources
- **State Management**: Real-time synchronization across all clients

## Installation

1. Ensure the job system is in your `resources/[core]/jobs/` directory
2. Add `ensure jobs` to your `server.cfg`
3. The system will automatically create the necessary database tables
4. Restart your server

## Quick Start

### For Server Administrators

The job system provides several commands for players:

- `/clockin <job_handle>` - Clock in to a job
- `/clockout` - Clock out from current job
- `/jobs` - List available jobs
- `/jobstatus` - Show current job status

### For Resource Developers

```typescript
// Register a basic job
exports.jobs.registerJob({
  handle: 'sheriff',
  name: 'Sheriff Department',
  paymentType: 'HOURLY',
  paymentAmount: '25.00'
});

// Create a task
exports.jobs.createTask('sheriff', {
  name: 'Patrol Town',
  taskType: 'patrol',
  rewards: { money: 10 }
});
```

## Architecture

### Database Schema
- **Jobs**: Job definitions and configurations
- **JobTasks**: Task templates and requirements
- **JobEmployees**: Employee records and clock-in status
- **JobPermissions**: Access control for jobs and tasks
- **JobTaskInstances**: Active task instances
- **JobTaskCooldowns**: Rate limiting and cooldown tracking

### Components
- **Socket Controller** (`socket/src/controllers/jobs.ts`): Core business logic
- **Client Resource** (`resources/[core]/jobs/src/client/`): Game client integration
- **Server Resource** (`resources/[core]/jobs/src/server/`): FXServer integration
- **UI Layer** (`resources/ui/src/ui/app/layers/jobs/`): User interface

## Configuration

### Job Definition
```typescript
interface JobDefinition {
  handle: string;                    // Unique identifier
  name: string;                      // Display name
  description?: string;              // Job description
  paymentType: PaymentType;          // How employees are paid
  paymentAmount: string;             // Payment amount
  requirements?: object;             // Job requirements
  clockInConstraints?: {             // Clock-in restrictions
    location?: LocationConstraint;
    hours?: TimeConstraint;
    daysOfWeek?: number[];
  };
}
```

### Task Definition
```typescript
interface TaskDefinition {
  handle: string;                    // Unique identifier
  name: string;                      // Display name
  taskType: string;                  // Task category
  timeConstraints?: TimeConstraint;  // When task is available
  repeatConfig?: RepeatConfig;       // Rate limiting configuration
  rewards?: object;                  // Task rewards
}
```

### Rate Limiting Options

#### Cooldown-Based
```typescript
{
  type: 'COOLDOWN',
  cooldownMinutes: 10,      // Wait time between completions
  maxPerDay: 50             // Daily limit
}
```

#### Burst-Limited
```typescript
{
  type: 'BURST',
  maxPerHour: 10,           // Hourly limit
  burstSize: 3,             // Quick succession limit
  burstCooldownMinutes: 15  // Cooldown after burst
}
```

#### Window-Based
```typescript
{
  type: 'WINDOW',
  maxPerWindow: 5,          // Completions per window
  windowMinutes: 30,        // Window duration
  cooldownBetween: 2        // Minimum time between tasks
}
```

## API Reference

### Server Exports

#### `registerJob(jobData: JobDefinition): Promise<boolean>`
Register a new job or update an existing one.

#### `createTask(jobHandle: string, taskData: TaskDefinition): Promise<boolean>`
Create a new task for a specific job.

#### `grantPermission(characterId: number, type: 'JOB' | 'TASK', typeId: string, grantedBy: number): Promise<boolean>`
Grant job or task permissions to a character.

#### `processPayment(characterId: number, amount: number, reason: string): boolean`
Process a payment to a character (placeholder for bank integration).

### Client Exports

#### `getCurrentJob(): Job | null`
Get the player's current job.

#### `isCurrentlyClocked(): boolean`
Check if the player is currently clocked in.

#### `canStartTask(taskId: number): Promise<TaskAvailability>`
Check if a player can start a specific task.

#### `getAvailableTasks(jobHandle?: string): Promise<Task[]>`
Get available tasks for the player.

### Events

#### Server Events
- `jobs:clockIn` - Fired when a player clocks in
- `jobs:clockOut` - Fired when a player clocks out
- `jobs:taskCreated` - Fired when a new task is created
- `jobs:paymentProcessed` - Fired when a payment is processed

#### Client Events
- `jobs:clockInUpdate` - UI update for clock-in
- `jobs:clockOutUpdate` - UI update for clock-out

## Examples

See [EXAMPLE_USAGE.md](./EXAMPLE_USAGE.md) for comprehensive examples including:
- Basic job registration
- Advanced task creation
- Permission management
- Event handling
- UI integration

## Integration with Other Systems

### Bank System Integration
The job system is designed to integrate with a banking system. Update the `processPayment` method in the socket controller to connect with your bank system:

```typescript
// TODO: Replace with actual bank integration
// PVBank.addToCharacterAccount(characterId, amount);
```

### Inventory Integration
Jobs can specify required items in their `requirements` field. Integrate with your inventory system to check for required items before allowing clock-in or task completion.

### Permission Integration
The permission system can be extended to integrate with your existing role/permission system for more granular access control.

## Development

### Building
The resource uses TypeScript and requires building:
```bash
cd resources/[core]/jobs
npm run build
```

### Database Migrations
Database tables are automatically created when the socket server starts. The schema is defined in `socket/src/db/schema.ts`.

### Adding New Features
1. Update the database schema if needed
2. Modify the socket controller for business logic
3. Update client/server resources for game integration
4. Add UI components if needed
5. Update type definitions

## Troubleshooting

### Common Issues

1. **Jobs not appearing**: Check that the job is registered and active in the database
2. **Clock-in failing**: Verify location and time constraints are met
3. **Tasks not available**: Check task scheduling and rate limiting configuration
4. **UI not updating**: Ensure socket events are properly configured

### Debug Commands
Enable debug logging in the socket controller to troubleshoot issues:
```typescript
logInfoS('[Jobs]', 'Debug message', data);
```

## Contributing

1. Follow the existing code style and patterns
2. Add comprehensive type definitions for new features
3. Update documentation for any API changes
4. Test thoroughly with multiple job configurations
5. Consider backward compatibility

## License

This job system is part of the Pioneer Village project and follows the same licensing terms.

## Support

For support and questions:
1. Check the example usage documentation
2. Review the troubleshooting section
3. Examine the source code for implementation details
4. Create an issue with detailed reproduction steps

---

**Note**: This system is designed to be flexible and extensible. The core functionality provides a solid foundation, but specific job implementations should be created in separate resources that utilize this system's API.
