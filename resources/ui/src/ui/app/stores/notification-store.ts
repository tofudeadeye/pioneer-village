import { Socket } from 'socket.io-client';
import { onClient } from '@lib/ui';

// Store state interface
interface NotificationState {
  show: boolean;
  active: boolean;
  notifications: UI.Notification.Notification[];
  currentNotification: UI.Notification.Notification | null;
}

type StateListener = (state: NotificationState) => void;

class NotificationStore {
  private static instance: NotificationStore;
  private socket: Socket<SocketOut.ToClient, SocketIn.FromClient> | null = null;
  private state: NotificationState;
  private listeners = new Set<StateListener>();
  private activeTimeout: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private initialized = false;

  private constructor() {
    this.state = {
      show: true,
      active: false,
      notifications: [],
      currentNotification: null,
    };
  }

  static getInstance(): NotificationStore {
    if (!NotificationStore.instance) {
      NotificationStore.instance = new NotificationStore();
    }
    return NotificationStore.instance;
  }

  // Initialize the store with socket connection
  initialize(socket: Socket<SocketOut.ToClient, SocketIn.FromClient>): void {
    if (this.initialized) {
      this.cleanup();
    }

    this.socket = socket;
    this.initialized = true;

    // Set up socket event handlers
    this.setupSocketHandlers();
    
    // Set up client event handlers
    this.setupClientHandlers();
  }

  private setupSocketHandlers(): void {
    if (!this.socket) return;

    // Handle incoming notifications from socket
    this.socket.on('notification.notify', this.handleSocketNotification);
  }

  private setupClientHandlers(): void {
    // Handle notification events from client
    onClient('notification.state', this.handleNotificationState);
    onClient('notification.notify', this.handleClientNotification);
  }

  // Handle notification from socket
  private handleSocketNotification = (data: UI.Notification.Notification): void => {
    this.addNotification(data);
  };

  // Handle notification from client
  private handleClientNotification = (
    text: string,
    duration?: number,
    bgColor?: string,
    fgColor?: string,
    centered?: boolean
  ): void => {
    this.addNotification({
      text,
      duration: duration || 3000,
      bgColor: bgColor || 'blue',
      fgColor: fgColor || 'white',
      centered: centered || false,
    });
  };

  // Handle notification state update from client
  private handleNotificationState = (event: UI.Notification.Event): void => {
    this.updateState((prevState) => ({ ...prevState, ...event }));
  };

  // Add a notification to the queue
  addNotification(notification: UI.Notification.Notification): void {
    // Ensure defaults are set
    const completeNotification: UI.Notification.Notification = {
      text: notification.text,
      duration: notification.duration || 3000,
      bgColor: notification.bgColor || 'blue',
      fgColor: notification.fgColor || 'white',
      centered: notification.centered || false,
    };

    this.updateState((prevState) => ({
      ...prevState,
      notifications: [...prevState.notifications, completeNotification],
    }));

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processNextNotification();
    }
  }

  // Process the next notification in the queue
  private processNextNotification(): void {
    if (this.isProcessing || this.state.notifications.length === 0) {
      return;
    }

    this.isProcessing = true;

    this.updateState((prevState) => {
      const notifications = [...prevState.notifications];
      const notification = notifications.shift();

      if (!notification) {
        this.isProcessing = false;
        return prevState;
      }

      // Clear any existing timeout
      if (this.activeTimeout) {
        clearTimeout(this.activeTimeout);
        this.activeTimeout = null;
      }

      // Set timeout to hide the notification
      this.activeTimeout = setTimeout(() => {
        this.hideCurrentNotification();
      }, notification.duration);

      return {
        ...prevState,
        notifications,
        currentNotification: notification,
        active: true,
      };
    });
  }

  // Hide the current notification and process the next one
  private hideCurrentNotification(): void {
    this.updateState((prevState) => ({
      ...prevState,
      active: false,
      currentNotification: null,
    }));

    // Clear timeout reference
    if (this.activeTimeout) {
      clearTimeout(this.activeTimeout);
      this.activeTimeout = null;
    }

    this.isProcessing = false;

    // Process next notification after a brief delay
    setTimeout(() => {
      this.processNextNotification();
    }, 100);
  }

  // Clear all notifications
  clearNotifications(): void {
    // Clear any active timeout
    if (this.activeTimeout) {
      clearTimeout(this.activeTimeout);
      this.activeTimeout = null;
    }

    this.isProcessing = false;

    this.updateState((prevState) => ({
      ...prevState,
      notifications: [],
      currentNotification: null,
      active: false,
    }));
  }

  // Remove a specific notification from the queue
  removeNotification(index: number): void {
    this.updateState((prevState) => ({
      ...prevState,
      notifications: prevState.notifications.filter((_, i) => i !== index),
    }));
  }

  // Skip the current notification
  skipCurrent(): void {
    if (this.state.currentNotification) {
      this.hideCurrentNotification();
    }
  }

  // Get the number of queued notifications
  getQueueLength(): number {
    return this.state.notifications.length;
  }

  // Check if there's an active notification
  hasActiveNotification(): boolean {
    return this.state.active && this.state.currentNotification !== null;
  }

  // Toggle notification visibility
  toggleVisibility(show?: boolean): void {
    const newShow = show !== undefined ? show : !this.state.show;
    this.updateState((prevState) => ({ ...prevState, show: newShow }));
  }

  // Create a quick notification helper
  notify(
    text: string,
    options?: {
      duration?: number;
      bgColor?: string;
      fgColor?: string;
      centered?: boolean;
    }
  ): void {
    this.addNotification({
      text,
      duration: options?.duration || 3000,
      bgColor: options?.bgColor || 'blue',
      fgColor: options?.fgColor || 'white',
      centered: options?.centered || false,
    });
  }

  // Create notification with success styling
  notifySuccess(text: string, duration?: number, centered?: boolean): void {
    this.addNotification({
      text,
      duration: duration || 3000,
      bgColor: 'green',
      fgColor: 'white',
      centered: centered || false,
    });
  }

  // Create notification with error styling
  notifyError(text: string, duration?: number, centered?: boolean): void {
    this.addNotification({
      text,
      duration: duration || 5000,
      bgColor: 'red',
      fgColor: 'white',
      centered: centered || false,
    });
  }

  // Create notification with warning styling
  notifyWarning(text: string, duration?: number, centered?: boolean): void {
    this.addNotification({
      text,
      duration: duration || 4000,
      bgColor: 'yellow',
      fgColor: 'black',
      centered: centered || false,
    });
  }

  // Create notification with info styling
  notifyInfo(text: string, duration?: number, centered?: boolean): void {
    this.addNotification({
      text,
      duration: duration || 3000,
      bgColor: 'blue',
      fgColor: 'white',
      centered: centered || false,
    });
  }

  // Show notification (sets active to true)
  showNotification(): void {
    this.updateState((prevState) => ({
      ...prevState,
      active: true,
    }));
  }

  // Hide notification (sets active to false)
  hideNotification(): void {
    this.updateState((prevState) => ({
      ...prevState,
      active: false,
    }));
  }

  // Update state helper with callback support
  private updateState(updater: ((state: NotificationState) => NotificationState) | NotificationState): void {
    if (typeof updater === 'function') {
      this.state = updater(this.state);
    } else {
      this.state = updater;
    }
    this.notifyListeners();
  }

  // Notify all listeners of state change
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Subscribe to state changes
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state); // Call immediately with current state
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Get current state
  getState(): NotificationState {
    return this.state;
  }

  // Cleanup when store is destroyed
  cleanup(): void {
    // Clear any active timeout
    if (this.activeTimeout) {
      clearTimeout(this.activeTimeout);
      this.activeTimeout = null;
    }

    // Clear all listeners
    this.listeners.clear();
    this.isProcessing = false;
    this.initialized = false;

    // Reset to initial state
    this.state = {
      show: true,
      active: false,
      notifications: [],
      currentNotification: null,
    };
  }
}

export default NotificationStore.getInstance();