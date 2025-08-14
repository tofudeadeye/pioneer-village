import { useState, useEffect, useCallback } from 'react';
import jobsStore from '../../stores/jobs-store';
import { useEscapeKey } from '../../hooks/use-game-events';
import styles from './styles.module.scss';

export default function Jobs() {
  const [state, setState] = useState(jobsStore.getState());

  useEffect(() => {
    const unsubscribe = jobsStore.subscribe(setState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Store handles all events
    // Get initial job state
    setTimeout(() => {
      refreshJobState();
    }, 1000);
  }, []);

  // Handle escape key
  const onEscape = useCallback(() => {
    jobsStore.close();
  }, []);

  useEscapeKey(state.show, onEscape);

  const refreshJobState = () => {
    jobsStore.refresh();
  };

  const handleClockIn = (jobHandle: string) => {
    // Use dummy location since we don't have actual position data in the UI
    const location = { x: 0, y: 0, z: 0 };
    jobsStore.performClockIn(jobHandle, location);
  };

  const handleClockOut = () => {
    jobsStore.performClockOut();
  };

  const { isClocked, currentJob, availableJobs, clockedInEmployees } = state;

  return (
    <div className={`${styles.frame} ${state.show ? 'active' : ''}`}>
      <div className={styles.container}>
        <h2>Job Management</h2>

        <div className={styles.statusBar}>
          <div>
            <strong>Status:</strong> {isClocked ? 'Clocked In' : 'Not Working'}
          </div>
          {currentJob && (
            <div>
              <strong>Current Job:</strong> {currentJob.name} ({currentJob.handle})
            </div>
          )}
          <div>
            <strong>Total Employees Online:</strong> {clockedInEmployees}
          </div>
        </div>

        {isClocked && currentJob ? (
          <div>
            <h3>Current Job: {currentJob.name}</h3>
            <p>{currentJob.description}</p>
            <p>
              <strong>Payment:</strong> {currentJob.paymentType} - ${currentJob.paymentAmount}
            </p>
            <button className={styles.button} onClick={handleClockOut}>Clock Out</button>
          </div>
        ) : (
          <div>
            <h3>Available Jobs</h3>
            {availableJobs.length === 0 ? (
              <p>No jobs available at this time.</p>
            ) : (
              availableJobs.map((job: any) => (
                <div className={styles.jobCard} key={job.handle}>
                  <h4>{job.name}</h4>
                  <p>{job.description}</p>
                  <p>
                    <strong>Payment:</strong> {job.paymentType} - ${job.paymentAmount}
                  </p>
                  <button className={styles.button} onClick={() => handleClockIn(job.handle)}>Clock In</button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}