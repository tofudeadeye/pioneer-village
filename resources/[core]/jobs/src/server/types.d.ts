declare interface ServerExports {
  jobs: Jobs.ServerExports;
}

declare namespace Jobs {
  interface ServerExports {
    registerJob: (jobData: Jobs.JobDefinition) => Promise<boolean>;
    createTask: (jobHandle: string, taskData: Jobs.TaskDefinition) => Promise<boolean>;
    grantPermission: (characterId: number, type: 'JOB' | 'TASK', typeId: string, grantedBy: number) => Promise<boolean>;
    processPayment: (characterId: number, amount: number, reason: string) => boolean;
  }
}

// Server perspective - events sent to socket
declare namespace ServerOut {
  interface ToSocket {
    ['jobs.register-job']: (jobData: any) => void;
    ['jobs.create-task']: (jobHandle: string, taskData: any) => void;
    ['jobs.grant-permission']: (characterId: number, type: 'JOB' | 'TASK', typeId: string, grantedBy: number) => void;
    ['jobs.process-payment']: (characterId: number, amount: number, reason: string) => void;
  }
}

// Extend the base ServerEvents
declare namespace SocketServer {
  interface ServerEvents {
    ['jobs.register-job']: ServerOut.ToSocket['jobs.register-job'];
    ['jobs.create-task']: ServerOut.ToSocket['jobs.create-task'];
    ['jobs.grant-permission']: ServerOut.ToSocket['jobs.grant-permission'];
    ['jobs.process-payment']: ServerOut.ToSocket['jobs.process-payment'];
  }
}
