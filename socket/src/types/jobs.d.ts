// Socket perspective - what the socket server receives
declare namespace SocketIn {
  interface FromGameServer {
    ['jobs.register-job']: (jobData: any, callback: (success: boolean) => void) => void;
    ['jobs.create-task']: (jobHandle: string, taskData: any, callback: (success: boolean) => void) => void;
    ['jobs.grant-permission']: (characterId: number, type: 'JOB' | 'TASK', typeId: string, grantedBy: number, callback: (success: boolean) => void) => void;
  }
  
  interface FromClient {
    ['jobs.get-state']: (callback: (state: any) => void) => void;
    ['jobs.clock-in']: (jobHandle: string, location: { x: number; y: number; z: number }, callback: (result: any) => void) => void;
    ['jobs.clock-out']: (callback: (result: any) => void) => void;
    ['jobs.can-start-task']: (taskId: number, callback: (result: any) => void) => void;
    ['jobs.get-available-tasks']: (callback: (tasks: any[]) => void, jobHandle?: string) => void;
  }
}

// Socket perspective - what the socket server sends
declare namespace SocketOut {
  interface ToGameServer {
    ['jobs.clock-in']: (characterId: number, jobHandle: string, clockInTime: Date) => void;
    ['jobs.clock-out']: (characterId: number, jobHandle: string, hoursWorked: number, payment: number) => void;
    ['jobs.task-created']: (jobHandle: string, taskInstance: any) => void;
    ['jobs.payment-processed']: (characterId: number, amount: number, reason: string) => void;
  }
  
  interface ToClient {
    'jobs.clock-in-update': (characterId: number, jobHandle: string) => void;
    'jobs.clock-out-update': (characterId: number, hoursWorked: number, payment: number) => void;
    'jobs.task-created': (jobHandle: string, taskInstance: any) => void;
    'jobs.payment-processed': (characterId: number, amount: number, reason: string) => void;
    'jobs.task-started': (characterId: number, taskId: number) => void;
    'jobs.task-completed': (characterId: number, taskId: number, payment: number) => void;
    'jobs.permission-granted': (characterId: number, type: string, typeId: number) => void;
  }
}

// Keep backward compatibility during migration
declare namespace SocketServer {
  interface Server extends SocketIn.FromGameServer {}
  interface ServerEvents extends SocketOut.ToGameServer {}
  interface Client extends SocketOut.ToClient {}
  interface ClientEvents extends SocketIn.FromClient {}
}