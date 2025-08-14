import { Socket } from 'socket.io-client';

// UI component props and state types that require imports
export namespace UIComponents {
  export interface BaseContext {
    socket: Socket<SocketOut.ToClient, SocketIn.FromClient>;
  }

  export namespace App {
    export interface Props extends UI.BaseProps {
      socket: Socket<SocketOut.ToClient, SocketIn.FromClient>;
    }
  }

  export namespace Customization {
    export interface Props extends UI.BaseProps {
      socket: Socket<SocketOut.ToClient, SocketIn.FromClient>;
    }
  }
}