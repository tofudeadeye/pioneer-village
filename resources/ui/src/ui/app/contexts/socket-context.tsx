import { createContext, useContext, ReactNode } from 'react';
import { Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket<UISocketEvents, SocketServer.Client & SocketServer.ClientEvents>;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ 
  children, 
  socket 
}: { 
  children: ReactNode; 
  socket: Socket<UISocketEvents, SocketServer.Client & SocketServer.ClientEvents>;
}) {
  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context.socket;
}