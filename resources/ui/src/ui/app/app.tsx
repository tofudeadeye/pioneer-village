import 'normalize.css';
import { Component } from 'react';
import { Socket } from 'socket.io-client';

import { Button, DisabledLayers } from '@styled/core';
import ExclamationTriangle from '@styled/fa5/solid/exclamation-triangle.svg';

import { uiSize } from '@uiLib/helpers';

import './app.scss';
import { Catcher } from './catcher';

String.prototype.GetHashKey = function (this: string): number {
  const keyLowered = this.toLowerCase();
  const length = this.length;
  let hash, i;

  for (hash = i = 0; i < length; i++) {
    hash += keyLowered.charCodeAt(i);
    hash += hash << 10;
    hash ^= hash >>> 6;
  }

  hash += hash << 3;
  hash ^= hash >>> 11;
  hash += hash << 15;

  return hash;
};

// @ts-expect-error
const requiredLayers = require.context('./layers', true, /index\.tsx$/);
const namedLayers: Record<string, any> = {};
for (const layer of requiredLayers.keys()) {
  const layerDefault = requiredLayers(layer);
  const name = layer.split('/')[1];
  namedLayers[name] = layerDefault;
}

interface CrashEntry {
  timestamp: number;
}

interface CrashData {
  [layerName: string]: CrashEntry[];
}

export default class App extends Component<UI.App.Props, UI.App.State> {
  state = {
    isFramed: !!window.frameElement,
    bg: '',
    disabledLayers: new Set<string>(),
  };

  private crashCheckInterval: number | null = null;

  constructor() {
    super();

    if (!this.state.isFramed) {
      this.setBG('daytime');
    }

    this.updateDisabledLayers();
  }

  componentWillUnmount() {
    if (this.crashCheckInterval) {
      clearInterval(this.crashCheckInterval);
    }
  }

  setBG(bg: string) {
    this.setState({ bg });
  }

  private getCrashData(): CrashData {
    try {
      const data = sessionStorage.getItem('ui-crash-data');
      // console.log('getCrashData', data);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to get crash data:', error);
      return {};
    }
  }

  private cleanOldCrashes(crashes: CrashEntry[]): CrashEntry[] {
    const oneMinuteAgo = Date.now() - 60 * 1000;
    return crashes.filter((crash) => crash.timestamp > oneMinuteAgo);
  }

  private updateDisabledLayers() {
    const crashData = this.getCrashData();
    const newDisabledLayers = new Set<string>();

    for (const [layerName, crashes] of Object.entries(crashData)) {
      // Handle both old format (numbers) and new format (arrays)
      let recentCrashes: CrashEntry[] = [];

      if (Array.isArray(crashes)) {
        // New format - filter by time
        recentCrashes = this.cleanOldCrashes(crashes);
      }

      // Disable layer if it has 3 or more crashes in the last minute
      if (recentCrashes.length >= 3) {
        newDisabledLayers.add(layerName);
        console.warn(`Layer "${layerName}" disabled due to ${recentCrashes.length} crashes in the last minute`);
      }
    }

    // Update state if disabled layers changed
    if (
      newDisabledLayers.size !== this.state.disabledLayers.size ||
      [...newDisabledLayers].some((layer) => !this.state.disabledLayers.has(layer))
    ) {
      this.setState({ disabledLayers: newDisabledLayers });
    }
  }

  private isLayerDisabled(layerName: string): boolean {
    return this.state.disabledLayers.has(layerName);
  }

  getChildContext(): { socket: Socket<SocketServer.Client & SocketServer.ClientEvents, UISocketEvents> } {
    return {
      socket: this.props.socket,
    };
  }

  renderLayers(): [Record<string, any>, string[]] {
    const layersEnabled: Record<string, any> = {};
    const layersDisabled: string[] = [];

    for (const [name, LayerComponent] of Object.entries(namedLayers)) {
      if (this.isLayerDisabled(name)) {
        layersDisabled.push(name);
      } else {
        layersEnabled[name] = LayerComponent;
      }
    }

    return [layersEnabled, layersDisabled];
  }

  render() {
    const [layersEnabled, layersDisabled] = this.renderLayers();

    return (
      <div id="app" className={`${this.state.bg ? `app--${this.state.bg}` : ''} app--16-9`}>
        {!this.state.isFramed && (
          <div style={{ position: 'absolute', top: 0, right: 0 }}>
            <Button onClick={() => this.setBG('daytime')}>Daytime</Button>
            <Button onClick={() => this.setBG('inside')}>Inside</Button>
            <Button onClick={() => this.setBG('nighttime')}>Nighttime</Button>
            {this.state.disabledLayers.size > 0 && (
              <div style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
                Disabled: {Array.from(this.state.disabledLayers).join(', ')}
              </div>
            )}
          </div>
        )}
        {layersDisabled.length > 0 && (
          <DisabledLayers>
            <p>
              <ExclamationTriangle width={uiSize(12)} />
            </p>
            <p>Broken UI Layers:</p>
            {layersDisabled.map((name) => (
              <p key={name}>{name}</p>
            ))}
          </DisabledLayers>
        )}
        {Object.entries(layersEnabled).map(([name, layer]) => {
          return (
            <Catcher key={name} layer={name} reloadWindow={this.state.isFramed}>
              <layer.default socket={this.props.socket} />
            </Catcher>
          );
        })}
      </div>
    );
  }
}
