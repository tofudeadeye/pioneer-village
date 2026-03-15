declare interface ServerExports {
  jobs: Jobs.ServerExports;
}

declare namespace Jobs {
  interface ServerExports {
    registerJob: (jobData: Jobs.JobDefinition) => Promise<boolean>;
    createTask: (jobHandle: string, taskData: Jobs.TaskDefinition) => Promise<boolean>;
    grantPermission: (characterId: number, type: 'JOB' | 'TASK', typeId: string, grantedBy: number) => Promise<boolean>;
    revokePermission: (characterId: number, type: 'JOB' | 'TASK', typeId: string) => Promise<boolean>;
  }
}

declare namespace ServerOut {
  interface ToSocket {
    ['jobs.register-job']: (jobData: Jobs.JobDefinition) => Promise<boolean>;
    ['jobs.create-task']: (jobHandle: string, taskData: Jobs.TaskDefinition) => Promise<boolean>;
    ['jobs.grant-permission']: (
      characterId: number,
      type: 'JOB' | 'TASK',
      typeId: string,
      grantedBy: number,
    ) => Promise<boolean>;
    ['jobs.revoke-permission']: (characterId: number, type: 'JOB' | 'TASK', typeId: string) => Promise<boolean>;
  }
}
