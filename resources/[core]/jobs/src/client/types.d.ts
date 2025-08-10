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

  namespace Events {
    type ClockInUpdate = (characterId: number, jobHandle: string) => void;
    type ClockOutUpdate = (characterId: number, hoursWorked: number, payment: number) => void;
    type TaskCreated = (jobHandle: string, taskInstance: any) => void;
    type PaymentProcessed = (characterId: number, amount: number, reason: string) => void;
  }
}

declare interface UIRPC {
  ['jobs.clock-in']: (jobHandle: string, location: { x: number; y: number; z: number }) => Jobs.ClockResult;
  ['jobs.clock-out']: () => Jobs.ClockResult;
  ['jobs.get-state']: () => UI.Jobs.State & { error?: string };
  ['jobs.can-start-task']: (taskId: number) => Jobs.TaskAvailability;
  ['jobs.get-available-tasks']: (jobHandle?: string) => Jobs.TaskDefinition[];
}

declare interface UIEvents {
  ['jobs.clock-in-update']: Jobs.Events.ClockInUpdate;
  ['jobs.clock-out-update']: Jobs.Events.ClockOutUpdate;
  ['jobs.task-created']: Jobs.Events.TaskCreated;
  ['jobs.payment-processed']: Jobs.Events.PaymentProcessed;
}

declare interface ClientForwardEvents {
  ['jobs.clock-in-update']: Jobs.Events.ClockInUpdate;
  ['jobs.clock-out-update']: Jobs.Events.ClockOutUpdate;
  ['jobs.task-created']: Jobs.Events.TaskCreated;
  ['jobs.payment-processed']: Jobs.Events.PaymentProcessed;
}

declare interface SocketForwardEvents {
  ['jobs.clock-in-update']: Jobs.Events.ClockInUpdate;
  ['jobs.clock-out-update']: Jobs.Events.ClockOutUpdate;
  ['jobs.task-created']: Jobs.Events.TaskCreated;
  ['jobs.payment-processed']: Jobs.Events.PaymentProcessed;
}
