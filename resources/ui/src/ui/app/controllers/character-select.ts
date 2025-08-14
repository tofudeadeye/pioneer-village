import { Socket } from 'socket.io-client';

export default (socket: Socket<UISocketEvents, SocketServer.Client & SocketServer.ClientEvents>) => {
  // All character-select RPC handlers and event listeners are now handled in character-select-store.ts
  // This controller is kept for consistency but all logic has been moved to the store
};