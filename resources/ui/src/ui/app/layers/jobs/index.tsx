import type { Socket } from 'socket.io-client';

import { onClient } from '@lib/ui';

import UIComponent from '@uiLib/ui-component';

import { Button, Container, Frame, JobCard, StatusBar } from './styled';

export default class Jobs extends UIComponent<UI.BaseProps, UI.Jobs.State, {}> {
  closeOnEscape = true;

  constructor(
    props: UI.BaseProps,
    context: { socket: Socket<UISocketEvents, SocketServer.Client & SocketServer.ClientEvents> },
  ) {
    super();

    console.log('context', context);

    this.state = {
      show: false,
      isClocked: false,
      currentJob: null,
      availableJobs: [],
      clockedInEmployees: 0,
    };

    // Listen for job state updates
    onClient('jobs.clock-in-update', (characterId: number, jobHandle: string) => {
      this.refreshJobState();
    });

    onClient('jobs.clock-out-update', (characterId: number, hoursWorked: number, payment: number) => {
      this.refreshJobState();
    });

    // Get initial job state
    setTimeout(() => {
      this.refreshJobState();
    }, 1000);
  }

  refreshJobState() {
    console.log('this', this);
    console.log('this.props', this.props);
    if (!this.props) {
      return;
    }
    const { socket } = this.props;
    socket.emit('jobs.get-state', (state: any) => {
      console.log('jobs:getState', state);
      if (!state.error) {
        this.setState({
          isClocked: state.isClocked || false,
          currentJob: state.currentJob || null,
          availableJobs: state.availableJobs || [],
          clockedInEmployees: state.clockedInEmployees || 0,
        });
      }
    });
  }

  handleClockIn(jobHandle: string) {
    const { socket } = this.context;
    socket.emit('jobs.clock-in', jobHandle, undefined, (result: any) => {
      if (result.success) {
        this.refreshJobState();
      } else {
        console.error('Failed to clock in:', result.error);
      }
    });
  }

  handleClockOut() {
    const { socket } = this.context;
    socket.emit('jobs.clock-out', (result: any) => {
      if (result.success) {
        this.refreshJobState();
      } else {
        console.error('Failed to clock out');
      }
    });
  }

  onEscape() {
    this.setState({ show: false });
  }

  render() {
    const { isClocked, currentJob, availableJobs, clockedInEmployees } = this.state;

    return (
      <Frame className={this.state.show ? 'active' : undefined}>
        <Container>
          <h2>Job Management</h2>

          <StatusBar>
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
          </StatusBar>

          {isClocked && currentJob ? (
            <div>
              <h3>Current Job: {currentJob.name}</h3>
              <p>{currentJob.description}</p>
              <p>
                <strong>Payment:</strong> {currentJob.paymentType} - ${currentJob.paymentAmount}
              </p>
              <Button onClick={() => this.handleClockOut()}>Clock Out</Button>
            </div>
          ) : (
            <div>
              <h3>Available Jobs</h3>
              {availableJobs.length === 0 ? (
                <p>No jobs available at this time.</p>
              ) : (
                availableJobs.map((job: any) => (
                  <JobCard key={job.handle}>
                    <h4>{job.name}</h4>
                    <p>{job.description}</p>
                    <p>
                      <strong>Payment:</strong> {job.paymentType} - ${job.paymentAmount}
                    </p>
                    <Button onClick={() => this.handleClockIn(job.handle)}>Clock In</Button>
                  </JobCard>
                ))
              )}
            </div>
          )}
        </Container>
      </Frame>
    );
  }
}
