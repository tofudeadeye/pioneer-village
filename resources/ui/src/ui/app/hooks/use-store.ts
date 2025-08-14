import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

/**
 * Custom hook for using stores in UI components
 * Handles subscription and initialization automatically
 * 
 * @param store - The store instance to use
 * @param socket - Optional socket connection for initialization
 * @returns Current state of the store
 * 
 * @example
 * const hudState = useStore(hudStore, socket);
 * const targetState = useStore(targetStore, socket);
 */
export function useStore<TState>(
  store: {
    getState: () => TState;
    subscribe: (listener: (state: TState) => void) => () => void;
    initialize?: (socket: Socket) => void;
  },
  socket?: Socket | null,
): TState {
  const [state, setState] = useState<TState>(store.getState());

  useEffect(() => {
    // Subscribe to store updates
    const unsubscribe = store.subscribe(setState);

    // Initialize store with socket if both are available
    if (socket && store.initialize) {
      store.initialize(socket);
    }

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [store, socket]);

  return state;
}

/**
 * Custom hook for using multiple stores at once
 * Useful when a component needs state from multiple stores
 * 
 * @param stores - Object of store instances
 * @param socket - Optional socket connection for initialization
 * @returns Object with current states of all stores
 * 
 * @example
 * const { hud, target } = useStores({ hud: hudStore, target: targetStore }, socket);
 */
export function useStores<
  TStores extends Record<string, {
    getState: () => any;
    subscribe: (listener: (state: any) => void) => () => void;
    initialize?: (socket: Socket) => void;
  }>
>(
  stores: TStores,
  socket?: Socket | null,
): { [K in keyof TStores]: ReturnType<TStores[K]['getState']> } {
  const [states, setStates] = useState(() => {
    const initialStates: any = {};
    for (const [key, store] of Object.entries(stores)) {
      initialStates[key] = store.getState();
    }
    return initialStates;
  });

  useEffect(() => {
    const unsubscribes: Array<() => void> = [];

    // Subscribe to each store
    for (const [key, store] of Object.entries(stores)) {
      const unsubscribe = store.subscribe((newState) => {
        setStates((prev: any) => ({
          ...prev,
          [key]: newState,
        }));
      });
      unsubscribes.push(unsubscribe);

      // Initialize store with socket if both are available
      if (socket && store.initialize) {
        store.initialize(socket);
      }
    }

    // Cleanup all subscriptions on unmount
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [stores, socket]);

  return states;
}