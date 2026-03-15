import { Socket } from 'socket.io-client';
import { emitClient, onClientCall } from '@lib/ui';

export default (socket: Socket<SocketOut.ToClient, SocketIn.FromClient>) => {
  socket.on('jobs.clock-in-update', (characterId, jobHandle) => {
    emitClient('jobs.clock-in-update', characterId, jobHandle);
  });

  socket.on('jobs.clock-out-update', (characterId, hoursWorked, payment) => {
    emitClient('jobs.clock-out-update', characterId, hoursWorked, payment);
  });

  socket.on('jobs.task-created', (jobHandle, taskInstance) => {
    emitClient('jobs.task-created', jobHandle, taskInstance);
  });

  socket.on('jobs.payment-processed', (characterId, amount, reason) => {
    emitClient('jobs.payment-processed', characterId, amount, reason);
  });

  socket.on('jobs.task-started', (characterId, taskId) => {
    emitClient('jobs.task-started', characterId, taskId);
  });

  socket.on('jobs.task-completed', (characterId, taskId, payment) => {
    emitClient('jobs.task-completed', characterId, taskId, payment);
  });

  socket.on('jobs.permission-granted', (characterId, type, typeId) => {
    emitClient('jobs.permission-granted', characterId, type, typeId);
  });

  type SocketForward = keyof SocketIn.FromClient;

  const forwards: SocketForward[] = [
    'jobs.clock-in',
    'jobs.clock-out',
    'jobs.get-state',
    'jobs.can-start-task',
    'jobs.get-available-tasks',
    'jobs.assign-task',
    'jobs.start-task',
    'jobs.complete-task',
    'jobs.get-pay-slips',
  ];

  for (const forward of forwards) {
    // @ts-ignore
    onClientCall(forward, (...args) => {
      return new Promise((resolve) => {
        // @ts-ignore
        socket.emit(forward, ...args, (data) => {
          resolve(data);
        });
      });
    });
  }
};
