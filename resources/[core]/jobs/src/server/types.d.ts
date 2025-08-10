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
