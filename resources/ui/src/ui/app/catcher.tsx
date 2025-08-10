import { Component, PropsWithChildren } from 'react';
import type { ErrorInfo } from 'react';

import { Snackbar } from '@styled/core';

interface CrashEntry {
  timestamp: number;
}

interface CrashData {
  [layerName: string]: CrashEntry[];
}

// TODO: Might need a better way than reload the window but re-rendering with preact seems to be problematic.
export class Catcher extends Component<UI.Catcher.Props, UI.Catcher.State> {
  constructor(props: UI.Catcher.Props) {
    super(props);

    this.state = {
      errored: false,
      layer: props.layer || '',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errored: true });

    console.log('ComponentDidCatch');
    console.error('error', error);
    console.info('errorInfo', errorInfo);

    if (this.props.reloadWindow) {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  private updateCrashCount(layerName: string): void {
    try {
      // Get existing crash data from sessionStorage
      const existingData = sessionStorage.getItem('ui-crash-data');
      let crashData: CrashData = {};

      if (existingData) {
        const parsed = JSON.parse(existingData);

        // Migrate old format (numbers) to new format (arrays)
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === 'number') {
            // Convert old count to array of crash entries (assume they all happened now)
            crashData[key] = Array.from({ length: Math.min(value as number, 10) }, () => ({
              timestamp: Date.now(),
            }));
          } else if (Array.isArray(value)) {
            // Keep existing array format
            crashData[key] = value as CrashEntry[];
          }
        }
      }

      // Initialize array for this layer if it doesn't exist
      if (!crashData[layerName]) {
        crashData[layerName] = [];
      }

      // Ensure it's an array (safety check)
      if (!Array.isArray(crashData[layerName])) {
        crashData[layerName] = [];
      }

      // Add new crash entry with current timestamp
      crashData[layerName].push({
        timestamp: Date.now(),
      });

      // Clean up old entries (older than 5 minutes to keep storage lean)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      crashData[layerName] = crashData[layerName].filter((crash) => crash.timestamp > fiveMinutesAgo);

      // Store updated data back in sessionStorage
      sessionStorage.setItem('ui-crash-data', JSON.stringify(crashData));

      console.log(`Crash recorded for layer "${layerName}". Recent crashes: ${crashData[layerName].length}`);
    } catch (error) {
      console.error('Failed to update crash count:', error);
    }
  }

  render(props: PropsWithChildren<any>, state: Readonly<any>) {
    if (state.errored) {
      const layerName = state.layer;
      if (state.layer) {
        // Record crash with timestamp
        this.updateCrashCount(layerName);
      }

      return (
        <Snackbar bgColor="red" color="black">
          {state.layer}: UI Crash ... Restarting
        </Snackbar>
      );
    }
    return props.children;
  }
}
