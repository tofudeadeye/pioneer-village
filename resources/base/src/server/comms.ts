import { Socket, io } from 'socket.io-client';

import { exports } from '@lib/server';

const SOCKET_SERVER_CONNECTION = GetConvar('SOCKET_SERVER_CONNECTION', '');
const SOCKET_SERVER_KEY = GetConvar('SOCKET_SERVER_KEY', '');

const socketListeners: Map<string, Map<string, any>> = new Map();

const client: Socket<SocketServer.SocketEvents, SocketServer.Server> = io(SOCKET_SERVER_CONNECTION, {
  autoConnect: false,
  transports: ['websocket'],
  auth: {
    token: SOCKET_SERVER_KEY,
  },
});

client.on('connect_error', (err) => {
  console.error('Error connecting to server.', err);
});

client.on('disconnect', () => {
  console.log('Disconnected from socket server');
});

client.on('connect', () => {
  console.log('Connected to socket server');
  emit('socket.connected');
});

setImmediate(() => {
  client.connect();
});

export const emitSocket: Base.emitSocket = (evtName, ...params) => {
  //@ts-ignore
  client.emit(evtName, ...params);
};

export const awaitSocket: Base.awaitSocket = (evtName, ...params) =>
  new Promise((res) => {
    //@ts-ignore
    client.emit(evtName, ...params, res);
  });

export const onSocket: Base.onSocketBase = (resource, evtName, callback) => {
  if (!socketListeners.has(resource)) {
    socketListeners.set(resource, new Map());
  }
  const listeners = socketListeners.get(resource)!;
  if (listeners.has(evtName)) {
    const previousCallback = listeners.get(evtName);
    client.off(evtName as keyof SocketServer.SocketEvents, previousCallback);
  }
  listeners.set(evtName, callback);
  client.on(evtName as keyof SocketServer.SocketEvents, callback);
};

on('onResourceStop', (resource: string) => {
  const listeners = socketListeners.get(resource);
  if (listeners) {
    listeners.forEach((callback, evtName) => {
      client.off(evtName as keyof SocketServer.SocketEvents, callback);
    });
  }
});

exports<'base'>('emitSocket', emitSocket);
exports<'base'>('awaitSocket', awaitSocket);
exports<'base'>('onSocket', onSocket);
exports<'base'>('socketConnected', () => client.connected);
