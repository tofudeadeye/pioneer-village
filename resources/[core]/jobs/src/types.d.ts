declare namespace UI {
  namespace Jobs {
    interface State {
      show: boolean;
      isClocked: boolean;
      currentJob: globalThis.Jobs.JobDefinition | null;
      availableJobs: globalThis.Jobs.JobDefinition[];
      clockedInEmployees: number;
    }
  }
}

declare namespace Jobs {
  interface JobDefinition {
    handle: string;
    name: string;
    description?: string;
    paymentType: 'HOURLY' | 'PER_TASK' | 'COMMISSION' | 'SALARY' | 'CALLBACK';
    paymentAmount: string;
    requirements?: Record<string, any>;
    inventory?: Record<string, any>;
    clockInConstraints?: {
      location?: {
        x: number;
        y: number;
        z: number;
        radius: number;
      };
      hours?: {
        start: number;
        end: number;
      };
      daysOfWeek?: number[];
    };
    metadata?: Record<string, any>;
  }

  interface TaskDefinition {
    handle: string;
    name: string;
    description?: string;
    taskType: string;
    requirements?: Record<string, any>;
    rewards?: Record<string, any>;
    timeConstraints?: {
      startHour?: number;
      endHour?: number;
      daysOfWeek?: number[];
    };
    repeatConfig?: {
      type: 'COOLDOWN' | 'BURST' | 'WINDOW' | 'UNLIMITED';
      cooldownMinutes?: number;
      maxPerHour?: number;
      burstSize?: number;
      burstCooldownMinutes?: number;
      maxPerWindow?: number;
      windowMinutes?: number;
      maxPerDay?: number;
      resetHour?: number;
    };
    rateLimits?: Record<string, any>;
    metadata?: Record<string, any>;
  }

  interface TaskAvailability {
    canStart: boolean;
    reason?: string;
    nextAvailableAt?: Date;
    remainingCooldown?: number;
  }

  interface ClockResult {
    success: boolean;
    hoursWorked?: number;
    payment?: number;
    error?: string;
  }
}
