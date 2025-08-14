import { Socket } from 'socket.io-client';
import { emitClient, onClient, onClientCall } from '@lib/ui';
import { debounce } from 'lodash';

// Store state interface
interface ChatState {
  show: boolean;
  partialShow: boolean;
  autoScroll: boolean;
  currentChannel: string;
  currentInput: string;
  suggestions: UI.Chat.Suggestions;
  messages: UI.Chat.Message[];
}

type StateListener = (state: ChatState) => void;

class ChatStore {
  private static instance: ChatStore;
  private socket: Socket<SocketOut.ToClient, SocketIn.FromClient> | null = null;
  private state: ChatState;
  private listeners = new Set<StateListener>();
  private pastMessages: string[] = [];
  private currentPastMessageIndex = -1;
  private closePartialDebounced: ReturnType<typeof debounce>;
  private initialized = false;

  private constructor() {
    this.state = {
      show: false,
      partialShow: false,
      autoScroll: true,
      currentChannel: 'general',
      currentInput: '',
      suggestions: {
        '/ooc': {
          description: 'Out of Character',
        },
        '/emote': {
          description: 'Play an emote animation',
          children: ['sit1', 'sit2', 'sit3', 'sit4', 'sit5', 'dance', 'dance2', 'dance3'],
        },
        '/me': {
          description: 'Show me popup on character.',
        },
      },
      messages: [],
    };

    // Create debounced function for closing partial view
    this.closePartialDebounced = debounce(() => {
      this.updateState((prevState) => {
        if (prevState.partialShow) {
          return { ...prevState, partialShow: false };
        }
        return prevState;
      });
    }, 3000);
  }

  static getInstance(): ChatStore {
    if (!ChatStore.instance) {
      ChatStore.instance = new ChatStore();
    }
    return ChatStore.instance;
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

    // Handle incoming chat messages
    this.socket.on('chatMessage', this.handleChatMessage);
  }

  private setupClientHandlers(): void {
    // Handle chat state updates from client
    onClient('chat.state', this.handleChatState);
  }

  // Handle incoming chat message from socket
  private handleChatMessage = (message: UI.Chat.Message): void => {
    this.updateState((prevState) => {
      const newState = {
        ...prevState,
        messages: [...prevState.messages, message],
      };
      if (!prevState.show) {
        newState.partialShow = true;
      }
      return newState;
    });

    if (!this.state.show) {
      this.closePartialDebounced();
    }
  };

  // Handle chat state update from client
  private handleChatState = (event: UI.Chat.Event): void => {
    if (!this.state.show && event.show) {
      // Focus will be handled by the component
      this.updateState((prevState) => ({ 
        ...prevState, 
        ...event,
        partialShow: false 
      }));
    } else {
      this.updateState((prevState) => ({ ...prevState, ...event }));
    }
  };

  // Send a chat message
  sendMessage(text: string, channel?: string): void {
    if (!this.socket || !text) return;

    const activeChannel = channel || this.state.currentChannel;
    
    // Add to past messages history
    this.pastMessages.unshift(text);
    if (this.pastMessages.length > 50) {
      this.pastMessages = this.pastMessages.slice(0, 50);
    }
    this.currentPastMessageIndex = -1;

    // Send the message
    this.socket.emit('chatSend', {
      channel: activeChannel,
      text,
    });

    // Clear current input
    this.updateState((prevState) => ({ ...prevState, currentInput: '' }));
  }

  // Close chat
  close(): void {
    this.toggleChat(false);
  }

  // Handle mouse wheel for scroll control
  handleMouseWheel(event: WheelEvent, messagesElement: HTMLElement | null): void {
    if (!messagesElement) return;
    
    const { deltaY } = event;
    const scrollTop = messagesElement.scrollTop;
    const scrollHeight = messagesElement.scrollHeight;
    const clientHeight = messagesElement.clientHeight;
    
    // Check if we're at the bottom
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;
    
    if (deltaY > 0 && isAtBottom) {
      // Scrolling down and at bottom, enable auto-scroll
      this.setAutoScroll(true);
    } else if (deltaY < 0) {
      // Scrolling up, disable auto-scroll
      this.setAutoScroll(false);
    }
  }

  // Select channel (alias for setChannel for backwards compatibility)
  selectChannel(channel: string): void {
    this.setChannel(channel);
  }

  // Get previous message from history
  getPreviousMessage(): string | null {
    if (this.currentPastMessageIndex < this.pastMessages.length - 1) {
      this.currentPastMessageIndex++;
      return this.pastMessages[this.currentPastMessageIndex];
    }
    return null;
  }

  // Get next message from history
  getNextMessage(): string | null {
    if (this.currentPastMessageIndex > -1) {
      this.currentPastMessageIndex--;
      return this.pastMessages[this.currentPastMessageIndex] || null;
    }
    return null;
  }

  // Navigate message history
  navigateHistory(direction: 'up' | 'down'): string {
    if (direction === 'up') {
      if (this.currentPastMessageIndex < this.pastMessages.length - 1) {
        this.currentPastMessageIndex++;
        return this.pastMessages[this.currentPastMessageIndex];
      }
    } else {
      if (this.currentPastMessageIndex > -1) {
        this.currentPastMessageIndex--;
        return this.pastMessages[this.currentPastMessageIndex] || '';
      }
    }
    return '';
  }

  // Reset history navigation
  resetHistoryNavigation(): void {
    this.currentPastMessageIndex = -1;
  }

  // Set current channel
  setChannel(channel: string): void {
    this.updateState((prevState) => ({ ...prevState, currentChannel: channel }));
  }

  // Set current input
  setCurrentInput(input: string): void {
    this.updateState((prevState) => ({ ...prevState, currentInput: input }));
  }

  // Toggle chat visibility
  toggleChat(show?: boolean): void {
    const newShow = show !== undefined ? show : !this.state.show;
    this.updateState((prevState) => ({ 
      ...prevState, 
      show: newShow,
      partialShow: newShow ? false : prevState.partialShow
    }));

    if (!newShow) {
      emitClient('chat.closed');
    }
  }

  // Set auto-scroll
  setAutoScroll(autoScroll: boolean): void {
    this.updateState((prevState) => ({ ...prevState, autoScroll }));
  }

  // Add a message locally (for system messages, etc.)
  addMessage(message: UI.Chat.Message): void {
    this.updateState((prevState) => ({
      ...prevState,
      messages: [...prevState.messages, message],
    }));
  }

  // Clear all messages
  clearMessages(): void {
    this.updateState((prevState) => ({ ...prevState, messages: [] }));
  }

  // Clear messages for a specific channel
  clearChannelMessages(channel: string): void {
    this.updateState((prevState) => ({
      ...prevState,
      messages: prevState.messages.filter(msg => msg.channel !== channel),
    }));
  }

  // Get messages for a specific channel
  getChannelMessages(channel: string): UI.Chat.Message[] {
    return this.state.messages.filter(msg => msg.channel === channel);
  }

  // Update suggestions
  setSuggestions(suggestions: UI.Chat.Suggestions): void {
    this.updateState((prevState) => ({ ...prevState, suggestions }));
  }

  // Add a suggestion
  addSuggestion(key: string, suggestion: UI.Chat.SuggestionEntry): void {
    this.updateState((prevState) => ({
      ...prevState,
      suggestions: {
        ...prevState.suggestions,
        [key]: suggestion,
      },
    }));
  }

  // Remove a suggestion
  removeSuggestion(key: string): void {
    this.updateState((prevState) => {
      const suggestions = { ...prevState.suggestions };
      delete suggestions[key];
      return { ...prevState, suggestions };
    });
  }

  // Update state helper with callback support
  private updateState(updater: ((state: ChatState) => ChatState) | ChatState): void {
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
  getState(): ChatState {
    return this.state;
  }

  // Get past messages history
  getPastMessages(): string[] {
    return [...this.pastMessages];
  }

  // Cleanup when store is destroyed
  cleanup(): void {
    if (this.socket) {
      // Remove socket handlers
      this.socket.off('chatMessage', this.handleChatMessage);
    }

    // Cancel debounced functions
    this.closePartialDebounced.cancel();

    // Clear state
    this.pastMessages = [];
    this.currentPastMessageIndex = -1;
    this.listeners.clear();
    this.initialized = false;

    // Reset to initial state
    this.state = {
      show: false,
      partialShow: false,
      autoScroll: true,
      currentChannel: 'general',
      currentInput: '',
      suggestions: this.state.suggestions, // Keep suggestions
      messages: [],
    };
  }
}

export default ChatStore.getInstance();