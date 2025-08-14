import { Socket } from 'socket.io-client';

// The interact store now handles all events directly when initialized
// This controller is kept for backward compatibility but most functionality
// has been moved to the interact-store.ts

export default (socket: Socket<SocketOut.ToClient, SocketIn.FromClient>) => {
  // The interact store handles these events directly now
  // This controller file can be kept minimal or eventually removed
  // when all resources are updated to use the store pattern
};