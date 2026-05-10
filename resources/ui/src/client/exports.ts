import { PVInit } from '@lib/client';
import { exports } from '@lib/client';

interface PendingCallback {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timeout: NodeJS.Timeout;
}

const callListeners: Map<string, Map<string, (...args: any[]) => any>> = new Map();
const eventListeners: Map<string, Map<string, (...args: any[]) => void>> = new Map();
const pendingCallbacks: Map<number, PendingCallback> = new Map();
let callId = 0;

const emitUI: UI.emitUI = (evtName, ...args) =>
  SendNUIMessage({
    type: 'event',
    evtName,
    args,
  });

const focusUI: UI.focusUI = (hasFocus, hasCursor) => SetNuiFocus(hasFocus, hasCursor);

const onUICall: UI.onUICall = (evtName, callback) => {
  const resource = GetInvokingResource();
  if (!callListeners.has(resource)) {
    callListeners.set(resource, new Map());
  }
  const listeners = callListeners.get(resource)!;
  if (listeners.has(evtName)) {
    listeners.delete(evtName);
  }
  console.log(`registering listener ${resource}/${evtName}`);
  listeners.set(evtName, callback as (...args: any[]) => any);
};

const onUI: UI.onUI = (evtName, callback) => {
  const resource = GetInvokingResource();
  if (!eventListeners.has(resource)) {
    eventListeners.set(resource, new Map());
  }
  const listeners = eventListeners.get(resource)!;
  if (listeners.has(evtName)) {
    listeners.delete(evtName);
  }
  listeners.set(evtName, callback as (...args: any[]) => void);
};

const awaitUI: UI.awaitUI = (evtName, ...args) => {
  const cId = callId++;
  const promise = new Promise<any>((resolve, reject) => {
    pendingCallbacks.set(cId, {
      resolve,
      reject,
      timeout: setTimeout(() => {
        reject(new Error(`RPC call timeout to UI with event ${evtName}`));
      }, 10e3),
    });
  });

  promise.finally(() => {
    pendingCallbacks.delete(cId);
  });

  SendNUIMessage({
    type: 'rpc',
    cId,
    evtName,
    args,
  });

  return promise;
};

on('onResourceStop', (resource: string) => {
  callListeners.delete(resource);
  eventListeners.delete(resource);
});

RegisterNuiCallbackType('uiResponse');
on(
  `__cfx_nui:uiResponse`,
  async (
    { cId, success, response }: { cId: number; success: boolean; response: unknown },
    cb: (res: unknown) => void,
  ) => {
    const callbackInfo = pendingCallbacks.get(cId);
    if (!callbackInfo) {
      return cb({});
    }
    const { resolve, reject, timeout } = callbackInfo;
    clearTimeout(timeout);
    if (success) {
      resolve(response);
    } else {
      reject(new Error(String(response)));
    }
    pendingCallbacks.delete(cId);
    cb({});
  },
);

RegisterNuiCallbackType('uiEvent');
on(
  `__cfx_nui:uiEvent`,
  async ({ evtName, params }: { evtName: string; params: unknown[] }, cb: (res: unknown) => void) => {
    eventListeners.forEach((listeners) => {
      const listener = listeners.get(evtName);
      if (listener) {
        listener(...params);
      }
    });
    cb({});
  },
);

RegisterNuiCallbackType('uiRequest');
on(
  `__cfx_nui:uiRequest`,
  async ({ evtName, params }: { cId: number; evtName: string; params: unknown[] }, cb: (res: unknown) => void) => {
    let processed = false;
    let success = false;
    let response: unknown = null;
    console.log(`Processing UI callback for ${evtName}`);

    callListeners.forEach((listeners) => {
      if (processed) {
        return;
      }

      const listener = listeners.get(evtName);
      if (!listener) {
        return;
      }

      processed = true;

      (async () => {
        console.log(`Attempting to resolve listener for ${evtName}`);
        try {
          response = await Promise.resolve(listener(...params));
          success = true;
        } catch (e: unknown) {
          response = (e instanceof Error ? e.message : String(e)) || `Failed to call ${evtName}`;
        }
        console.log(`Response from ${evtName}, success: ${success}`);
        cb({
          success,
          response,
        });
      })();
    });
    if (!processed) {
      cb({
        success: false,
        response: `Unable to find call handler for ${evtName}`,
      });
    }
  },
);

// Handle nui.close event
onUI('nui.close', () => {
  console.log('Closing UI');
  SetNuiFocus(false, false);
});

// Handle ui.ready event
onUI('ui.ready', () => {
  PVInit.resolve('ui::ready');
});

// Handle form answer events
onUI('form.answer', (formEvent) => {
  focusUI(false, false);
  console.log('formEvent', formEvent);
});

// Export all functions for @lib/client/comms/ui to use
exports<'ui'>('onUICall', onUICall);
exports<'ui'>('onUI', onUI);
exports<'ui'>('awaitUI', awaitUI);
exports<'ui'>('emitUI', emitUI);
exports<'ui'>('focusUI', focusUI);
