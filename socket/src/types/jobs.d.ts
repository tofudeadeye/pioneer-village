declare namespace SocketServer {
  interface Server {
    ['jobs.register-job']: (jobData: any, callback: (success: boolean) => void) => void;
    ['jobs.create-task']: (jobHandle: string, taskData: any, callback: (success: boolean) => void) => void;
    ['jobs.grant-permission']: (characterId: number, type: 'JOB' | 'TASK', typeId: string, grantedBy: number, callback: (success: boolean) => void) => void;
  }

  interface ServerEvents {
    ['jobs.clock-in']: (characterId: number, jobHandle: string, clockInTime: Date) => void;
    ['jobs.clock-out']: (characterId: number, jobHandle: string, hoursWorked: number, payment: number) => void;
    ['jobs.task-created']: (jobHandle: string, taskInstance: any) => void;
    ['jobs.payment-processed']: (characterId: number, amount: number, reason: string) => void;
  }

  interface Client {
    ['jobs.get-state']: (callback: (state: any) => void) => void;
    ['jobs.clock-in']: (jobHandle: string, location: { x: number; y: number; z: number }, callback: (result: any) => void) => void;
    ['jobs.clock-out']: (callback: (result: any) => void) => void;
    ['jobs.can-start-task']: (taskId: number, callback: (result: any) => void) => void;
    ['jobs.get-available-tasks']: (jobHandle?: string, callback: (tasks: any[]) => void) => void;
  }

  interface ClientEvents {
    ['jobs.clock-in-update']: (characterId: number, jobHandle: string) => void;
    ['jobs.clock-out-update']: (characterId: number, hoursWorked: number, payment: number) => void;
    ['jobs.task-created']: (jobHandle: string, taskInstance: any) => void;
    ['jobs.payment-processed']: (characterId: number, amount: number, reason: string) => void;
  }
}