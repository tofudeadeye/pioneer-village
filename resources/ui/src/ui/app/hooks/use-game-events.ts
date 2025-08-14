import { useCallback, useEffect, useRef } from 'react';

import { emitClient, onClient } from '@lib/ui';

import EventBus from '../lib/event-bus';

// Hook for registering client event listeners
export function useClientEvent<T extends keyof ClientIn.FromSocket>(
  eventName: T,
  handler: (...args: Parameters<ClientIn.FromSocket[T]>) => void,
  deps: React.DependencyList = [],
) {
  const handlerRef = useRef(handler);

  // Update the handler ref when it changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const wrappedHandler = (...args: Parameters<ClientIn.FromSocket[T]>) => {
      handlerRef.current(...args);
    };

    // Register the event listener only once
    onClient(eventName, wrappedHandler);

    // Note: The onClient function doesn't return an unsubscribe function,
    // and we're intentionally only registering once to avoid duplicate handlers
    // The handler ref pattern ensures we always call the latest handler
    return () => {
      // In a real implementation, we'd need to remove the listener from the eventListeners map
      // but since the lib doesn't expose that, we rely on the component unmounting
    };
  }, [eventName]); // Only depend on eventName, not on other deps
}

// Hook for escape key handling
export function useEscapeKey(show: boolean | undefined, onEscape?: () => void, preventNuiClose: boolean = false) {
  const handleEscape = useCallback<() => void>(() => {
    if (!show) return;

    if (onEscape) {
      onEscape();
    }

    // Default behavior is to close NUI unless explicitly prevented
    if (!preventNuiClose) {
      emitClient('nui.close');
    }
  }, [show, onEscape, preventNuiClose]);

  useEffect(() => {
    if (!onEscape && preventNuiClose) return; // Only skip if no callback AND NUI close is prevented

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleEscape();
      }
    };

    EventBus.on<KeyboardEvent>('keyup', handleKeyUp);

    return () => {
      EventBus.off('keyup', handleKeyUp);
    };
  }, [handleEscape, onEscape, preventNuiClose]);
}

// Hook for emitting client events (returns stable function)
export function useEmitClient() {
  return useCallback<
    <T extends keyof ClientIn.FromSocket>(eventName: T, ...args: Parameters<ClientIn.FromSocket[T]>) => void
  >(
    (eventName, ...args) => {
      emitClient(eventName, ...args);
    },
    [],
  );
}
