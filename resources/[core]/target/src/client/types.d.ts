// Client perspective - RPC calls to various destinations
declare namespace ClientRPC {
  interface Socket {
    // Add target RPC calls here when needed
  }
}

// Client perspective - events received from various sources
declare namespace ClientIn {
  interface FromSocket {
    ['target.state']: (interactEvent: UI.TargetLayer.Event) => void;
  }
}

// Client perspective - events sent to various destinations
declare namespace ClientOut {
  interface ToSocket {
    // Add target events to socket here when needed
  }
}

// Raw Socket.io events for UI layer typing - DEDUPLICATED
// Note: SocketIO.Events eliminated - use ClientIn.FromSocket directly

declare interface ClientExports {
  target: Target.ClientExports;
}

declare namespace Target {
  interface Item {
    id: string;
    label: string;
    icon: string;
    event: string;
    parameters: Record<string, any>;
  }

  interface IsEnabledData {
    distance: number;
    coords: {
      buffer: {
        type: string;
        data: number[];
      };
    };
    entity: number;
    model: number;
    type: number;
    playerPed: number;
  }

  type Options = {
    distance: number;
    throttle?: number;
    disabledThrottle?: number;
    enabledThrottle?: number;
    isEnabled?: (data: IsEnabledData) => boolean;
  };

  interface Menu {
    id: string;
    type: 'flag' | 'model' | 'entity' | 'zone';
    group: Array<number | string>;
    data: Item[];
    options: Options;
  }

  type AddTarget = (data: Target.Menu) => string;
  type RemoveTarget = (id: string) => void;
  type GetEntityPlayerIsLookingAt = (
    distance: number,
    radius: number,
    flags: number,
    ignore?: number,
  ) => Promise<number>;

  type ClientExports = {
    AddTarget: AddTarget;
    RemoveTarget: RemoveTarget;
    GetEntityPlayerIsLookingAt: GetEntityPlayerIsLookingAt;
  };
}
