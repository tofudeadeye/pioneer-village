declare interface ClientExports {
  jobs: Jobs.ClientExports;
}

declare namespace Jobs {
  interface ClientExports {
    getCurrentJob: () => Jobs.JobDefinition | null;
    isCurrentlyClocked: () => boolean;
    canStartTask: (taskId: number) => Promise<Jobs.TaskAvailability>;
    getAvailableTasks: (jobHandle?: string) => Promise<Jobs.TaskDefinition[]>;
  }
}

// Client perspective - RPC calls to various destinations
declare namespace ClientRPC {
  interface Socket {
    ['jobs.clock-in']: (jobHandle: string, location: { x: number; y: number; z: number }) => Promise<Jobs.ClockResult>;
    ['jobs.clock-out']: () => Promise<Jobs.ClockResult>;
    ['jobs.get-state']: () => Promise<UI.Jobs.State & { error?: string }>;
    ['jobs.can-start-task']: (taskId: number) => Promise<Jobs.TaskAvailability>;
    ['jobs.get-available-tasks']: (jobHandle?: string) => Promise<Jobs.TaskDefinition[]>;
  }
}

// Client perspective - events received from various sources
declare namespace ClientIn {
  interface FromSocket {
    ['jobs.clock-in-update']: (characterId: number, jobHandle: string) => void;
    ['jobs.clock-out-update']: (characterId: number, hoursWorked: number, payment: number) => void;
    ['jobs.task-created']: (jobHandle: string, taskInstance: Jobs.TaskInstance) => void;
    ['jobs.payment-processed']: (characterId: number, amount: number, reason: string) => void;
    ['jobs.task-started']: (characterId: number, taskId: number) => void;
    ['jobs.task-completed']: (characterId: number, taskId: number, payment: number) => void;
    ['jobs.permission-granted']: (characterId: number, type: string, typeId: number) => void;
  }
}
