import { eq } from 'drizzle-orm';

import { db } from '../db/connection';
import { type JobSchemaType, JobsSchema } from '../db/schema';
import { logInfoC, logInfoS } from '../helpers';
import jobSystemManager from '../managers/jobs';
import { serverNamespace, userNamespace } from '../server';

export default () => {
  // Restore state on startup
  jobSystemManager.restoreState();

  // Server namespace events (for FXServer communication)
  serverNamespace.on('connection', (socket) => {
    logInfoS('[Jobs]', 'Game server connected');

    // Job registration from other resources
    socket.on('jobs.register-job', async (jobData: any, cb = () => {}) => {
      logInfoS('[Jobs]', 'registerJob', jobData.handle, jobData.name);

      try {
        // Insert or update job in database
        const existingJobs = await db.select().from(JobsSchema).where(eq(JobsSchema.handle, jobData.handle));

        let job: JobSchemaType;
        if (existingJobs.length > 0) {
          // Update existing job
          const updatedJobs = await db
            .update(JobsSchema)
            .set({ ...jobData, updatedAt: new Date() })
            .where(eq(JobsSchema.handle, jobData.handle))
            .returning();
          job = updatedJobs[0];
        } else {
          // Insert new job
          const newJobs = await db.insert(JobsSchema).values(jobData).returning();
          job = newJobs[0];
        }

        // Register in memory
        const registeredJob = jobSystemManager.registerJob(job);
        cb(registeredJob ? true : false);
      } catch (error) {
        logInfoS('[Jobs]', 'Job registration failed:', error);
        cb(false);
      }
    });

    // Task creation from other resources
    socket.on('jobs.create-task', async (jobHandle: string, taskData: any, cb = () => {}) => {
      logInfoS('[Jobs]', 'createTask', jobHandle, taskData.name);

      try {
        const taskInstance = await jobSystemManager.createTask(jobHandle, taskData);
        cb(taskInstance ? true : false);
      } catch (error) {
        logInfoS('[Jobs]', 'Task creation failed:', error);
        cb(false);
      }
    });

    // Permission management
    socket.on(
      'jobs.grant-permission',
      async (characterId: number, type: 'JOB' | 'TASK', typeId: string, grantedBy: number, cb = () => {}) => {
        logInfoS('[Jobs]', 'grantPermission', characterId, type, typeId);

        try {
          const success = await jobSystemManager.grantPermission(characterId, type, typeId, grantedBy);
          cb(success);
        } catch (error) {
          logInfoS('[Jobs]', 'Permission grant failed:', error);
          cb(false);
        }
      },
    );
  });

  // User namespace events (for UI communication)
  userNamespace.on('connection', (socket) => {
    logInfoC('[Jobs]', 'User connected', socket.id, socket.data);

    // Send initial job state to client
    socket.on('jobs.get-state', (cb = () => {}) => {
      const characterId = socket.data?.character?.id;
      if (!characterId) {
        cb({ error: 'No character data' });
        return;
      }

      const isClocked = jobSystemManager.isCharacterClockedIn(characterId);
      const currentJob = jobSystemManager.getCharacterJob(characterId);
      const availableJobs = Array.from(jobSystemManager.getRegisteredJobs().values());

      cb({
        isClocked,
        currentJob,
        availableJobs,
        clockedInEmployees: jobSystemManager.getClockedInEmployees().size,
      });
    });

    // Clock in request
    socket.on(
      'jobs.clock-in',
      async (jobHandle: string, location?: { x: number; y: number; z: number }, cb = () => {}) => {
        const characterId = socket.data?.character?.id;
        if (!characterId) {
          cb({ success: false, error: 'No character data' });
          return;
        }

        logInfoC('[Jobs]', 'clockIn', characterId, jobHandle);

        const success = await jobSystemManager.clockIn(characterId, jobHandle, location);

        if (success) {
          // Update UI for all clients
          userNamespace.emit('__client__', 'jobs.clock-in-update', characterId, jobHandle);
        }

        cb({ success, error: success ? null : 'Clock in failed' });
      },
    );

    // Clock out request
    socket.on('jobs.clock-out', async (cb = () => {}) => {
      const characterId = socket.data?.character?.id;
      if (!characterId) {
        cb({ success: false, error: 'No character data' });
        return;
      }

      logInfoC('[Jobs]', 'clockOut', characterId);

      const result = await jobSystemManager.clockOut(characterId);

      if (result.success && result.hoursWorked !== undefined && result.payment !== undefined) {
        // Update UI for all clients
        userNamespace.emit('__client__', 'jobs.clock-out-update', characterId, result.hoursWorked, result.payment);
      }

      cb(result);
    });

    // Task availability check
    socket.on('jobs.can-start-task', async (taskId: number, cb = () => {}) => {
      const characterId = socket.data?.character?.id;
      if (!characterId) {
        cb({ canStart: false, reason: 'No character data' });
        return;
      }

      const result = await jobSystemManager.canStartTask(characterId, taskId);
      cb(result);
    });

    // Get available tasks
    socket.on('jobs.get-available-tasks', async (jobHandle?: string, cb = () => {}) => {
      const characterId = socket.data?.character?.id;
      if (!characterId) {
        cb([]);
        return;
      }

      // In real implementation, this would query available tasks from database
      // For now, return empty array
      cb([]);
    });
  });
};
