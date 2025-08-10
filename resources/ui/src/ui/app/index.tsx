import { render } from 'react';
import { Socket } from 'socket.io-client';

import { emitClient, onClient } from '@lib/ui';

import App from './app';
import BaseController from './controllers/base';
import DoorController from './controllers/doors';
import InventoryController from './controllers/inventory';
import JobsController from './controllers/jobs';
import StableController from './controllers/stable';
import WorldController from './controllers/world';

export default (socket: Socket<UISocketEvents, SocketServer.Client & SocketServer.ClientEvents>) => {
  render(<App socket={socket} />, document.body);

  const restartUI = () => {
    window.location.reload();
  };

  onClient('nui.restart', () => {
    sessionStorage.clear();
    restartUI();
  });

  onClient('__socket__', (name, ...args) => {
    console.log('__socket__', name, ...args);
    // @ts-ignore
    socket.emit(name, ...args);
  });

  socket.on('__client__', (name, ...args) => {
    console.log('__client__', name, ...args);
    emitClient(name, ...args);
  });

  DoorController(socket);
  JobsController(socket);
  StableController(socket);
  WorldController(socket);
  BaseController(socket);

  // @ts-ignore
  if (module.hot) {
    // @ts-ignore
    module.hot.accept('./app', () => {
      console.log('Accepting the updated App module!');
      restartUI();
    });
  }

  emitClient('ui.ready');
};
