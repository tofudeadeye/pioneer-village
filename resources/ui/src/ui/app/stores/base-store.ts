import { Socket } from 'socket.io-client';
import { onClient, onClientCall, emitClient } from '@lib/ui';

// Zustand store type
interface ZustandStore<T> {
  getState: () => T;
  setState: (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void;
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;
}

/**
 * Base class for all UI layer stores
 * Provides common functionality for socket and client event handling
 */
export abstract class BaseSocketHandler<TState> {
  protected socket: Socket;
  protected store: ZustandStore<TState>;
  private cleanupFunctions: Array<() => void> = [];

  constructor(socket: Socket, store: ZustandStore<TState>) {
    this.socket = socket;
    this.store = store;
    this.initialize();
  }

  /**
   * Initialize all event listeners
   * Subclasses should override setupSocketListeners and setupClientListeners
   */
  private initialize() {
    this.setupSocketListeners();
    this.setupClientListeners();
  }

  /**
   * Setup socket event listeners
   * Override in subclass to register socket.on handlers
   */
  protected abstract setupSocketListeners(): void;

  /**
   * Setup client event listeners
   * Override in subclass to register onClient handlers
   */
  protected abstract setupClientListeners(): void;

  /**
   * Register a socket event listener with automatic cleanup
   */
  protected registerSocketListener<T = unknown>(event: string, handler: (data: T) => void) {
    this.socket.on(event, handler);
    this.cleanupFunctions.push(() => this.socket.off(event, handler));
  }

  /**
   * Register a client event listener
   * Note: onClient doesn't provide cleanup, so we track for documentation
   */
  protected registerClientListener<T extends keyof ClientIn.FromSocket>(
    event: T,
    handler: (...args: Parameters<ClientIn.FromSocket[T]>) => void
  ) {
    onClient(event, handler);
    // No cleanup available for onClient
  }

  /**
   * Register a client RPC call handler
   */
  protected registerClientCall<T extends keyof ClientRPC.Socket>(
    event: T,
    handler: (...args: Parameters<ClientRPC.Socket[T]>) => Promise<ReturnType<ClientRPC.Socket[T]>> | ReturnType<ClientRPC.Socket[T]>
  ) {
    onClientCall(event, handler);
    // No cleanup available for onClientCall
  }

  /**
   * Update store state
   */
  protected setState(updater: ((state: TState) => Partial<TState>) | Partial<TState>) {
    this.store.setState(updater);
  }

  /**
   * Get current store state
   */
  protected getState(): TState {
    return this.store.getState();
  }

  /**
   * Emit event to client
   */
  protected emitToClient<T extends keyof ClientIn.FromSocket>(
    event: T,
    ...args: Parameters<ClientIn.FromSocket[T]>
  ) {
    emitClient(event, ...args);
  }

  /**
   * Cleanup all event listeners
   */
  public destroy() {
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];
    this.onDestroy();
  }

  /**
   * Override in subclass for additional cleanup
   */
  protected onDestroy(): void {
    // Override in subclass if needed
  }
}

/**
 * Helper type for store actions
 */
export interface StoreActions {
  [key: string]: (...args: unknown[]) => void | Promise<void>;
}