import { Socket } from 'socket.io-client';
import { emitClient, onClientCall } from '@lib/ui';

export default (socket: Socket<UISocketEvents, SocketServer.Client & SocketServer.ClientEvents>) => {
  // Handle job state updates from socket
  socket.on('jobs.clock-in-update', (characterId: number, jobHandle: string) => {
    emitClient('jobs.clock-in-update', characterId, jobHandle);
  });

  socket.on('jobs.clock-out-update', (characterId: number, hoursWorked: number, payment: number) => {
    emitClient('jobs.clock-out-update', characterId, hoursWorked, payment);
  });

  // Forward job-related events to client
  socket.on('jobs.task-created', (jobHandle: string, taskInstance: any) => {
    emitClient('jobs.task-created', jobHandle, taskInstance);
  });

  socket.on('jobs.payment-processed', (characterId: number, amount: number, reason: string) => {
    emitClient('jobs.payment-processed', characterId, amount, reason);
  });

  // Handle RPC calls from client
  onClientCall('jobs.clock-in', (jobHandle: string, location: { x: number; y: number; z: number }) => {
    return new Promise((resolve) => {
      socket.emit('jobs.clock-in', jobHandle, location, (result: Jobs.ClockResult) => {
        resolve(result);
      });
    });
  });

  onClientCall('jobs.clock-out', () => {
    return new Promise((resolve) => {
      socket.emit('jobs.clock-out', (result: Jobs.ClockResult) => {
        resolve(result);
      });
    });
  });

  onClientCall('jobs.get-state', () => {
    return new Promise((resolve) => {
      socket.emit('jobs.get-state', (state: UI.Jobs.State & { error?: string }) => {
        resolve(state);
      });
    });
  });

  onClientCall('jobs.can-start-task', (taskId: number) => {
    return new Promise((resolve) => {
      socket.emit('jobs.can-start-task', taskId, (result: Jobs.TaskAvailability) => {
        resolve(result);
      });
    });
  });

  onClientCall('jobs.get-available-tasks', (jobHandle?: string) => {
    return new Promise((resolve) => {
      socket.emit('jobs.get-available-tasks', jobHandle, (tasks: Jobs.TaskDefinition[]) => {
        resolve(tasks);
      });
    });
  });
};
