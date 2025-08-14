import { Socket } from 'socket.io-client';
import { emitClient, onClient } from '@lib/ui';

// Store state interface
interface FormState {
  show: boolean;
  title: string;
  text: string;
}

type StateListener = (state: FormState) => void;

class FormStore {
  private static instance: FormStore;
  private socket: Socket<UISocketEvents, SocketServer.Client & SocketServer.ClientEvents> | null = null;
  private state: FormState;
  private listeners = new Set<StateListener>();
  private initialized = false;

  private constructor() {
    this.state = {
      show: false,
      title: '',
      text: '',
    };
  }

  static getInstance(): FormStore {
    if (!FormStore.instance) {
      FormStore.instance = new FormStore();
    }
    return FormStore.instance;
  }

  // Initialize the store with socket connection
  initialize(socket: Socket<UISocketEvents, SocketServer.Client & SocketServer.ClientEvents>): void {
    if (this.initialized) {
      this.cleanup();
    }

    this.socket = socket;
    this.initialized = true;

    // Set up client event handlers
    this.setupClientHandlers();
  }

  private setupClientHandlers(): void {
    // Handle form state updates from client
    onClient('form.state', this.handleFormState);
  }

  // Handle form state update from client
  private handleFormState = (event: UI.Form.Event): void => {
    this.updateState(event);
  };

  // Update text in the form
  updateText(text: string): void {
    this.updateState({ text });
  }

  // Submit the form
  submit(): void {
    const { title, text } = this.state;
    this.updateState({ show: false });
    emitClient('form.answer', { title, text });
  }

  // Close the form (escape key handling)
  close(): void {
    this.updateState({ show: false });
  }

  // Update state and notify listeners
  updateState(newState: Partial<FormState>): void {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(listener => listener(this.state));
  }

  // Set text (alias for updateText for compatibility)
  setText(text: string): void {
    this.updateText(text);
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
  getState(): FormState {
    return this.state;
  }

  // Cleanup when store is destroyed
  cleanup(): void {
    // Note: onClient doesn't provide cleanup mechanism
    // so we just clear internal state
    this.listeners.clear();
    this.initialized = false;
  }
}

export default FormStore.getInstance();