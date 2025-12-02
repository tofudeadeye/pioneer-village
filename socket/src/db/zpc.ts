import { Socket } from 'socket.io';

import { logInfo, logInfoS } from '../helpers';
import { serverNamespace } from '../server';

type Sender = keyof SocketOut.ToGameServer;
type Receiver = keyof SocketIn.FromGameServer;
type SenderParams<T extends Sender> = Parameters<SocketOut.ToGameServer[T]>;
type ReceiverParams<T extends Receiver> = Parameters<SocketIn.FromGameServer[T]>;

class ZPC {
  static readonly instance: ZPC = new ZPC();

  private socket?: Socket<SocketIn.FromGameServer, SocketOut.ToGameServer>;

  constructor() {
    if (ZPC.instance) {
      throw new Error('Error: Instantiation failed: Use ZPC.Instance instead of new.');
    }
  }

  init() {
    if (this.socket && !this.socket.disconnected) {
      return;
    }
    serverNamespace.on('connection', (socket) => {
      this.socket = socket;
      logInfo('[ZPC]', 'Connected', this.socket.id);
    });
  }

  async awaitServer<S extends Sender, R extends Receiver>(
    receiverEvent: R,
    senderEvent: S,
    ...senderParams: SenderParams<S>
  ): Promise<ReceiverParams<R>> {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    const rtn = new Promise<ReceiverParams<R>>((resolve, reject) => {
      const callback = (...receiverParams: ReceiverParams<R>) => {
        logInfo('[ZPC]', '.awaitServer callback', senderEvent, receiverEvent, ...receiverParams);
        // TODO: This wont work going forward because it wont work for all events but we only have 1 right now.
        if (senderParams[0] === receiverParams[0]) {
          resolve(receiverParams);
          this.socket!.off(receiverEvent, callback);
        }
      };

      // @ts-ignore
      this.socket!.on(receiverEvent, callback);
    });

    logInfo('[ZPC]', '.awaitServer emit', receiverEvent, senderEvent, ...senderParams);

    console.log(`serverNamespace.emit('${senderEvent}', ${senderParams.join(', ')});`);
    serverNamespace.emit(senderEvent, ...senderParams);

    return rtn;
  }
}

ZPC.instance.init();

export default ZPC.instance;
