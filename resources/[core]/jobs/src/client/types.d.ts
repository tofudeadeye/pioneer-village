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

// Client perspective - RPC calls to various destinations
declare namespace ClientRPC {
  interface Socket {
    ['jobs.clock-in']: (jobHandle: string, location: { x: number; y: number; z: number }) => Jobs.ClockResult;
    ['jobs.clock-out']: () => Jobs.ClockResult;
    ['jobs.get-state']: () => UI.Jobs.State & { error?: string };
    ['jobs.can-start-task']: (taskId: number) => Jobs.TaskAvailability;
    ['jobs.get-available-tasks']: (jobHandle?: string) => Jobs.TaskDefinition[];
  }
}

// Client perspective - events received from various sources
declare namespace ClientIn {
  interface FromSocket {
    ['jobs.clock-in-update']: (characterId: number, jobHandle: string) => void;
    ['jobs.clock-out-update']: (characterId: number, hoursWorked: number, payment: number) => void;
    ['jobs.task-created']: (jobHandle: string, taskInstance: any) => void;
    ['jobs.payment-processed']: (characterId: number, amount: number, reason: string) => void;
    ['jobs.task-started']: (characterId: number, taskId: number) => void;
    ['jobs.task-completed']: (characterId: number, taskId: number, payment: number) => void;
    ['jobs.permission-granted']: (characterId: number, type: string, typeId: number) => void;
  }
}

// Raw Socket.io events for UI layer typing - DEDUPLICATED
// Note: SocketIO.Events eliminated - use ClientIn.FromSocket directly
// Events are defined in socket types: SocketOut.ToClient
// declare namespace SocketIO {
//   interface Events extends SocketOut.ToClient {
//     ['jobs.clock-in-update']: Jobs.Events.ClockInUpdate;
//     ['jobs.clock-out-update']: Jobs.Events.ClockOutUpdate;
//     ['jobs.task-created']: Jobs.Events.TaskCreated;
//     ['jobs.payment-processed']: Jobs.Events.PaymentProcessed;
//   }
// }