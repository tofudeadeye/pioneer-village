import { and, eq, isNotNull, isNull } from 'drizzle-orm';

import { db } from '../db/connection';
import { type JobEmployeeSchemaType, JobEmployeesSchema, type JobSchemaType, JobsSchema } from '../db/schema';
import { logInfoS } from '../helpers';

// Job System State Management
class JobSystemManager {
  static readonly instance: JobSystemManager = new JobSystemManager();

  private registeredJobs: Map<string, JobSchemaType> = new Map();
  private clockedInEmployees: Map<number, { jobId: number; clockedInAt: Date }> = new Map();
  private taskScheduler: NodeJS.Timeout | null = null;

  constructor() {
    if (JobSystemManager.instance) {
      throw new Error('Error: Instantiation failed: Use JobSystemManager.instance instead of new.');
    }
    this.startTaskScheduler();
  }

  // Job Registration
  registerJob(jobData: JobSchemaType): JobSchemaType | null {
    try {
      // Validate job data
      if (!jobData.handle || !jobData.name) {
        throw new Error('Job handle and name are required');
      }

      // Check if job already exists
      if (this.registeredJobs.has(jobData.handle)) {
        logInfoS('[Jobs]', `Job ${jobData.handle} already registered, updating...`);
      }

      // Store in memory for quick access
      this.registeredJobs.set(jobData.handle, jobData);

      logInfoS('[Jobs]', `Registered job: ${jobData.handle} - ${jobData.name}`);
      return jobData;
    } catch (error) {
      logInfoS('[Jobs]', `Failed to register job: ${error}`);
      return null;
    }
  }

  // Clock In/Out Management
  async clockIn(
    characterId: number,
    jobHandle: string,
    location?: { x: number; y: number; z: number },
  ): Promise<boolean> {
    try {
      const job = this.registeredJobs.get(jobHandle);
      if (!job) {
        throw new Error(`Job ${jobHandle} not found`);
      }

      // Check if already clocked in
      if (this.clockedInEmployees.has(characterId)) {
        throw new Error('Already clocked in to a job');
      }

      // Validate clock-in constraints
      if (!this.validateClockInConstraints(job, location)) {
        throw new Error('Clock-in constraints not met');
      }

      // Clock in
      const clockInTime = new Date();

      // Update or create employee record in database
      const existingEmployees = await db
        .select()
        .from(JobEmployeesSchema)
        .where(
          and(
            eq(JobEmployeesSchema.characterId, characterId),
            eq(JobEmployeesSchema.jobId, job.id),
            isNull(JobEmployeesSchema.firedAt),
          ),
        );

      if (existingEmployees.length > 0) {
        // Update existing employee record
        await db
          .update(JobEmployeesSchema)
          .set({ clockedInAt: clockInTime })
          .where(eq(JobEmployeesSchema.id, existingEmployees[0].id));
      } else {
        // Create new employee record
        await db.insert(JobEmployeesSchema).values({
          characterId,
          jobId: job.id,
          clockedInAt: clockInTime,
          hiredAt: clockInTime,
        });
      }

      // Update in-memory state
      this.clockedInEmployees.set(characterId, {
        jobId: job.id,
        clockedInAt: clockInTime,
      });

      logInfoS('[Jobs]', `Character ${characterId} clocked in to ${jobHandle}`);

      return true;
    } catch (error) {
      logInfoS('[Jobs]', `Clock in failed: ${error}`);
      return false;
    }
  }

  async clockOut(characterId: number): Promise<{ success: boolean; hoursWorked?: number; payment?: number }> {
    try {
      const clockInData = this.clockedInEmployees.get(characterId);
      if (!clockInData) {
        throw new Error('Not clocked in to any job');
      }

      const clockOutTime = new Date();
      const hoursWorked = (clockOutTime.getTime() - clockInData.clockedInAt.getTime()) / (1000 * 60 * 60);

      // Calculate payment
      const job = Array.from(this.registeredJobs.values()).find((j) => j.id === clockInData.jobId);
      let payment = 0;

      if (job && job.paymentType === 'HOURLY' && job.paymentAmount) {
        payment = parseFloat(job.paymentAmount) * hoursWorked;
      }

      // Update database - clear clock-in time and update total hours
      const currentEmployee = await db
        .select()
        .from(JobEmployeesSchema)
        .where(
          and(
            eq(JobEmployeesSchema.characterId, characterId),
            eq(JobEmployeesSchema.jobId, clockInData.jobId),
            isNull(JobEmployeesSchema.firedAt),
          ),
        );

      if (currentEmployee.length > 0) {
        const currentHours = currentEmployee[0].totalHoursWorked || '0';
        const newTotalHours = parseFloat(currentHours) + hoursWorked;
        await db
          .update(JobEmployeesSchema)
          .set({
            clockedInAt: null,
            totalHoursWorked: newTotalHours.toString(),
          })
          .where(eq(JobEmployeesSchema.id, currentEmployee[0].id));
      }

      // Remove from clocked in list
      this.clockedInEmployees.delete(characterId);

      logInfoS(
        '[Jobs]',
        `Character ${characterId} clocked out. Hours: ${hoursWorked.toFixed(2)}, Payment: $${payment.toFixed(2)}`,
      );

      // Process payment
      if (payment > 0) {
        this.processPayment(characterId, payment, 'Hourly wages');
      }

      return { success: true, hoursWorked, payment };
    } catch (error) {
      logInfoS('[Jobs]', `Clock out failed: ${error}`);
      return { success: false };
    }
  }

  // Task Management
  async createTask(jobHandle: string, taskData: any): Promise<any | null> {
    try {
      const job = this.registeredJobs.get(jobHandle);
      if (!job) {
        throw new Error(`Job ${jobHandle} not found`);
      }

      // Create task instance
      const taskInstance = {
        taskId: taskData.id || 0,
        status: 'AVAILABLE',
        createdAt: new Date(),
        scheduledFor: taskData.scheduledFor || new Date(),
        expiresAt: taskData.expiresAt,
        metadata: taskData.metadata || {},
      };

      // In a real implementation, this would insert to database
      logInfoS('[Jobs]', `Created task instance for job ${jobHandle}`);

      return taskInstance;
    } catch (error) {
      logInfoS('[Jobs]', `Task creation failed: ${error}`);
      return null;
    }
  }

  async canStartTask(
    characterId: number,
    taskId: number,
  ): Promise<{
    canStart: boolean;
    reason?: string;
    nextAvailableAt?: Date;
    remainingCooldown?: number;
  }> {
    try {
      // Check permissions
      const hasPermission = await this.checkPermission(characterId, 'TASK', taskId.toString());
      if (!hasPermission) {
        return { canStart: false, reason: 'No permission for this task' };
      }

      // Check cooldowns (simplified for now)
      // In real implementation, this would check the jobTaskCooldowns table

      return { canStart: true };
    } catch (error) {
      return { canStart: false, reason: 'Error checking task availability' };
    }
  }

  // Permission System
  async checkPermission(characterId: number, type: 'JOB' | 'TASK', typeId: string): Promise<boolean> {
    try {
      // In real implementation, this would query the database
      // For now, return true for basic functionality
      return true;
    } catch (error) {
      logInfoS('[Jobs]', `Permission check failed: ${error}`);
      return false;
    }
  }

  async grantPermission(
    characterId: number,
    type: 'JOB' | 'TASK',
    typeId: string,
    grantedBy: number,
  ): Promise<boolean> {
    try {
      // In real implementation, this would insert to jobPermissions table
      logInfoS('[Jobs]', `Granted ${type} permission ${typeId} to character ${characterId}`);
      return true;
    } catch (error) {
      logInfoS('[Jobs]', `Permission grant failed: ${error}`);
      return false;
    }
  }

  // Payment Processing
  private processPayment(characterId: number, amount: number, reason: string): void {
    try {
      // TODO: Integrate with PVBank when available
      // PVBank.addToCharacterAccount(characterId, amount);

      // Temporary hardcoded implementation for testing
      logInfoS('[Jobs]', `TODO: Pay character ${characterId} $${amount.toFixed(2)} for ${reason}`);
    } catch (error) {
      logInfoS('[Jobs]', `Payment processing failed: ${error}`);
    }
  }

  // Constraint Validation
  private validateClockInConstraints(job: JobSchemaType, location?: { x: number; y: number; z: number }): boolean {
    try {
      const constraints = job.clockInConstraints as any;

      // Check location constraints
      if (constraints.location && location) {
        const distance = Math.sqrt(
          Math.pow(location.x - constraints.location.x, 2) +
            Math.pow(location.y - constraints.location.y, 2) +
            Math.pow(location.z - constraints.location.z, 2),
        );

        if (distance > (constraints.location.radius || 5)) {
          return false;
        }
      }

      // Check time constraints
      if (constraints.hours) {
        const currentHour = new Date().getHours();
        if (currentHour < constraints.hours.start || currentHour > constraints.hours.end) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logInfoS('[Jobs]', `Constraint validation failed: ${error}`);
      return false;
    }
  }

  // Task Scheduler
  private startTaskScheduler(): void {
    // Run every minute to update task availability
    this.taskScheduler = setInterval(() => {
      this.updateTaskAvailability();
      this.processResets();
      this.cleanupExpiredTasks();
    }, 60000); // 1 minute

    logInfoS('[Jobs]', 'Task scheduler started');
  }

  private updateTaskAvailability(): void {
    // Update task availability based on time constraints
    // This would query the database and update task instances
  }

  private processResets(): void {
    // Reset hourly/daily counters for rate limiting
    const now = new Date();

    // Process hourly resets
    if (now.getMinutes() === 0) {
      logInfoS('[Jobs]', 'Processing hourly resets');
      // Reset hourly counters in jobTaskCooldowns
    }

    // Process daily resets
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      logInfoS('[Jobs]', 'Processing daily resets');
      // Reset daily counters in jobTaskCooldowns
    }
  }

  private cleanupExpiredTasks(): void {
    // Clean up expired task instances
    // This would delete expired tasks from the database
  }

  // State Restoration
  async restoreState(): Promise<void> {
    try {
      // Restore registered jobs from database
      const allJobs = await db.select().from(JobsSchema).where(eq(JobsSchema.active, true));

      for (const job of allJobs) {
        this.registeredJobs.set(job.handle, job);
      }

      // Restore clocked-in employees
      const clockedInEmployees = await db
        .select()
        .from(JobEmployeesSchema)
        .where(and(isNull(JobEmployeesSchema.firedAt), isNotNull(JobEmployeesSchema.clockedInAt)));

      for (const employee of clockedInEmployees) {
        if (employee.clockedInAt) {
          this.clockedInEmployees.set(employee.characterId, {
            jobId: employee.jobId,
            clockedInAt: employee.clockedInAt,
          });
        }
      }

      logInfoS(
        '[Jobs]',
        `Restored ${this.registeredJobs.size} jobs and ${this.clockedInEmployees.size} clocked-in employees`,
      );
    } catch (error) {
      logInfoS('[Jobs]', `State restoration failed: ${error}`);
    }
  }

  // Getters for external access
  getRegisteredJobs(): Map<string, JobSchemaType> {
    return this.registeredJobs;
  }

  getClockedInEmployees(): Map<number, { jobId: number; clockedInAt: Date }> {
    return this.clockedInEmployees;
  }

  isCharacterClockedIn(characterId: number): boolean {
    return this.clockedInEmployees.has(characterId);
  }

  getCharacterJob(characterId: number): JobSchemaType | null {
    const clockInData = this.clockedInEmployees.get(characterId);
    if (!clockInData) return null;

    return Array.from(this.registeredJobs.values()).find((job) => job.id === clockInData.jobId) || null;
  }
}

export default JobSystemManager.instance;
