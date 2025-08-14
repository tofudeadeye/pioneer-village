import { Socket } from 'socket.io-client';
import { emitClient, onClient, onClientCall } from '@lib/ui';

// Store state interface
interface CharacterSelectState {
  show: boolean;
  characters: UI.CharacterSelect.CharacterData[];
  selectedCharacterId: number | null;
  isCreating: boolean;
  isDeleting: boolean;
  deleteConfirmId: number | null;
}

// State listener type
type StateListener = (state: CharacterSelectState) => void;

class CharacterSelectStore {
  private static instance: CharacterSelectStore;
  private state: CharacterSelectState;
  private listeners = new Set<StateListener>();
  private initialized = false;
  private socket: Socket<UISocketEvents, SocketServer.Client & SocketServer.ClientEvents> | null = null;

  private constructor() {
    
    this.state = {
      show: false,
      characters: [],
      selectedCharacterId: null,
      isCreating: false,
      isDeleting: false,
      deleteConfirmId: null,
    };
  }

  static getInstance(): CharacterSelectStore {
    if (!CharacterSelectStore.instance) {
      CharacterSelectStore.instance = new CharacterSelectStore();
    }
    return CharacterSelectStore.instance;
  }

  // Initialize the store with socket connection
  initialize(socket: Socket<UISocketEvents, SocketServer.Client & SocketServer.ClientEvents>): void {
    if (this.initialized) {
      this.cleanup();
    }

    this.socket = socket;
    this.initialized = true;

    // Set up event handlers
    this.setupSocketListeners();
    this.setupClientListeners();
  }

  // Setup socket event listeners
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Handle character list updates from socket
    this.socket.on('character-select.characters', (characters: UI.CharacterSelect.CharacterData[]) => {
      this.updateState({
        ...this.state,
        characters,
      });
    });

    // Handle character creation response
    this.socket.on('character-select.created', (character: UI.CharacterSelect.CharacterData) => {
      const characters = [...this.state.characters, character];
      this.updateState({
        ...this.state,
        characters,
        isCreating: false,
      });
    });

    // Handle character deletion response
    this.socket.on('character-select.deleted', (characterId: number) => {
      const characters = this.state.characters.filter(c => c.id !== characterId);
      this.updateState({
        ...this.state,
        characters,
        isDeleting: false,
        deleteConfirmId: null,
      });
    });
  }

  // Setup client event listeners
  private setupClientListeners(): void {
    // Handle state updates from game client
    onClient('character-select.state', (newState: Partial<UI.CharacterSelect.State>) => {
      this.updateState({
        ...this.state,
        ...newState,
      });
    });

    // Register RPC handler for getting characters
    onClientCall('getCharacters', () => {
      return new Promise((resolve) => {
        if (this.socket) {
          this.socket.emit('getCharacters', (characters) => {
            this.updateState({
              ...this.state,
              characters,
            });
            resolve(characters);
          });
        } else {
          resolve([]);
        }
      });
    });

    // Register RPC handler for creating a character
    onClientCall('createCharacter', (character, face) => {
      return new Promise((resolve) => {
        if (this.socket) {
          this.updateState({
            ...this.state,
            isCreating: true,
          });
          this.socket.emit('createCharacter', character, face, () => {
            this.updateState({
              ...this.state,
              isCreating: false,
            });
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }

  // Choose a character
  chooseCharacter(characterId: number): void {
    this.updateState({
      ...this.state,
      show: false,
      selectedCharacterId: characterId,
    });
    emitClient('character-select.choose', characterId);
  }

  // Create a new character
  createCharacter(): void {
    this.updateState({
      ...this.state,
      show: false,
      isCreating: true,
    });
    emitClient('character-select.create');
  }

  // Delete a character
  deleteCharacter(characterId: number): void {
    if (this.state.deleteConfirmId === characterId) {
      // Second click - actually delete
      if (this.socket) {
        this.updateState({
          ...this.state,
          isDeleting: true,
        });
        this.socket.emit('character-select.delete', characterId, () => {
          const characters = this.state.characters.filter(c => c.id !== characterId);
          this.updateState({
            ...this.state,
            characters,
            isDeleting: false,
            deleteConfirmId: null,
          });
        });
      }
    } else {
      // First click - set for confirmation
      this.updateState({
        ...this.state,
        deleteConfirmId: characterId,
      });
      // Clear confirmation after 3 seconds
      setTimeout(() => {
        if (this.state.deleteConfirmId === characterId) {
          this.updateState({
            ...this.state,
            deleteConfirmId: null,
          });
        }
      }, 3000);
    }
  }

  // Cancel delete confirmation
  cancelDeleteConfirm(): void {
    this.updateState({
      ...this.state,
      deleteConfirmId: null,
    });
  }

  // Update state and notify listeners
  private updateState(newState: CharacterSelectState): void {
    this.state = newState;
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
  getState(): CharacterSelectState {
    return this.state;
  }

  // Cleanup when store is destroyed
  cleanup(): void {
    if (this.socket) {
      // Remove socket handlers
      this.socket.off('character-select.characters');
      this.socket.off('character-select.created');
      this.socket.off('character-select.deleted');
    }

    this.listeners.clear();
    this.initialized = false;
  }

  // Required abstract method implementations from BaseSocketHandler
  protected onDestroy(): void {
    this.cleanup();
  }
}

export default CharacterSelectStore.getInstance();