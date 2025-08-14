import { Socket } from 'socket.io-client';
import { clamp } from '@lib/math';
import { emitClient, onClient, onClientCall } from '@lib/ui';

// Store state interface matching the component's state
interface InventoryState {
  show: boolean;
  characterId: number;
  clothingInventory: string;
  mainInventory: string;
  targetInventory: string;
  inventories: Map<string, UI.Inventory.LoadData>;
  inventoriesWeight: Map<string, number>;
  tooltipItem: UI.Inventory.ItemData | null;
  tooltipBelow: boolean;
  tooltipX: number;
  tooltipY: number;
}

// Request tracking
interface MoveRequest {
  sourceIdentifier: string;
  oldSlot: number;
  targetIdentifier: string;
  newSlot: number;
}

type StateListener = (state: InventoryState) => void;

class InventoryStore {
  private static instance: InventoryStore;
  private socket: Socket<SocketOut.ToClient, SocketIn.FromClient> | null = null;
  private state: InventoryState;
  private listeners = new Set<StateListener>();
  private subscriptions = new Set<string>();
  private worldSubscribed = false;
  private requestId = 0;
  private requests = new Map<number, MoveRequest>();
  private items: Inventory.UIItems = {};
  private failedImages = new Set<string>();
  private initialized = false;

  private constructor() {
    this.state = {
      show: false,
      characterId: 0,
      clothingInventory: '',
      mainInventory: '',
      targetInventory: '',
      inventories: new Map(),
      inventoriesWeight: new Map(),
      tooltipItem: null,
      tooltipBelow: false,
      tooltipX: 0,
      tooltipY: 0,
    };
  }

  static getInstance(): InventoryStore {
    if (!InventoryStore.instance) {
      InventoryStore.instance = new InventoryStore();
    }
    return InventoryStore.instance;
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

    // Emit startup event
    emitClient('inventory.startup');
  }

  private setupSocketHandlers(): void {
    if (!this.socket) return;

    // Handle inventory load
    this.socket.on('inventory.load', this.handleInventoryLoad);

    // Handle item add
    this.socket.on('inventory.item-add', this.handleItemAdd);

    // Handle item move
    this.socket.on('inventory.item-move', this.handleItemMove);

    // Handle success response
    this.socket.on('inventory.success', this.handleSuccess);

    // Handle fail response
    this.socket.on('inventory.fail', this.handleFail);

    // Handle item wear
    this.socket.on('inventory.item-wear', this.handleItemWear);

    // Handle world inventory open
    this.socket.on('inventory.open-world', this.handleOpenWorld);
  }

  private setupClientHandlers(): void {
    // Handle inventory state updates from client
    onClient('inventory.state', this.handleInventoryState);

    // Handle items data update
    onClient('inventory.items', this.handleItemsUpdate);

    // Handle use slot request
    onClient('inventory.use-slot', this.useSlot);

    // Register RPC handler for getting player items
    onClientCall('inventory.player-get-items', this.getPlayerItems);
  }

  // Handle inventory state update from client
  private handleInventoryState = (event: Partial<UI.Inventory.State>): void => {
    if (!event || !this.socket) return;

    // Subscribe to clothing inventory if needed
    if (event.clothingInventory && !this.subscriptions.has(event.clothingInventory)) {
      this.socket.emit('inventory.subscribe', event.clothingInventory);
      this.subscriptions.add(event.clothingInventory);
    }

    // Subscribe to main inventory if needed
    if (event.mainInventory && !this.subscriptions.has(event.mainInventory)) {
      this.socket.emit('inventory.subscribe', event.mainInventory);
      this.subscriptions.add(event.mainInventory);

      const [_inventoryType, characterId] = event.mainInventory.split(':');
      event.characterId = Number(characterId);
    }

    // Handle target inventory changes
    const previousTargetInventory = this.state.targetInventory;
    
    // Unsubscribe from old target inventory
    if (previousTargetInventory && previousTargetInventory !== event.targetInventory) {
      this.socket.emit('inventory.unsubscribe', previousTargetInventory);
      this.subscriptions.delete(previousTargetInventory);
    }

    // Subscribe to new target inventory
    if (event.targetInventory && !this.subscriptions.has(event.targetInventory)) {
      this.socket.emit('inventory.subscribe', event.targetInventory);
      this.subscriptions.add(event.targetInventory);
      this.worldSubscribed = false;
    } else if (!event.targetInventory && !this.worldSubscribed) {
      // Subscribe to world if no target inventory
      this.socket.emit('inventory.subscribe-world');
      
      // Check world inventories at current location if not coming from another target
      if (!previousTargetInventory) {
        this.socket.emit('inventory.check-world');
      }
      
      this.worldSubscribed = true;
    }

    this.updateState(event);
  };

  // Handle items data update
  private handleItemsUpdate = (items: Inventory.UIItems): void => {
    this.items = items;
  };

  // Handle inventory load from socket
  private handleInventoryLoad = (data: UI.Inventory.LoadData): void => {
    const inventories = new Map(this.state.inventories);
    inventories.set(data.identifier, data);

    // Emit events based on inventory type
    if (this.state.mainInventory === data.identifier) {
      const clothingInv = inventories.get(this.state.clothingInventory);
      emitClient('inventory.main-inventory', data, clothingInv);
    }

    if (this.state.targetInventory === data.identifier) {
      emitClient('inventory.target-inventory', data);
    }

    if (`clothing:${this.state.characterId}` === data.identifier) {
      emitClient('inventory.clothing-change', Object.values(data.items));
    }

    this.updateState({ inventories });
    this.computeInventoryWeight();
  };

  // Handle item add from socket
  private handleItemAdd = (data: UI.Inventory.AddData): void => {
    const inventories = new Map(this.state.inventories);
    const inventory = inventories.get(data.identifier);
    
    if (inventory) {
      for (const [slot, item] of Object.entries(data.items)) {
        if (inventory.items[slot]) {
          inventory.items[slot].ids.push(...item.ids);
          inventory.items[slot].metadatas.push(...item.metadatas);
          inventory.items[slot].quantity += item.quantity;
        } else {
          inventory.items[slot] = item;
        }
      }
    }

    this.updateState({ inventories });
    this.computeInventoryWeight();
  };

  // Handle item move from socket
  private handleItemMove = (data: UI.Inventory.MoveOrFailData): void => {
    if ('charRequestId' in data) {
      const moveData = data as UI.Inventory.MoveData;
      const [requestCharId] = moveData.charRequestId.split(':');
      
      if (this.state.characterId === Number(requestCharId)) {
        return;
      }
      
      const inventories = new Map(this.state.inventories);
      const inventory = inventories.get(moveData.identifier);
      
      if (inventory) {
        // Check if drag item needs to be cancelled
        const dragItem = document.getElementById('drag-item');
        if (dragItem) {
          const dragItemSlot = Number(dragItem.dataset.slot);
          if (dragItem.dataset.inventoryIdentifier === moveData.identifier && moveData.emptySlots.includes(dragItemSlot)) {
            this.cancelDrag();
          }
        }

        // Update items
        for (const [slot, item] of Object.entries(moveData.items)) {
          inventory.items[slot] = item;
        }

        // Clear empty slots
        for (const slot of moveData.emptySlots) {
          delete inventory.items[slot];
        }

        // Handle clothing equipment changes
        if (moveData.identifier === `clothing:${this.state.characterId}`) {
          emitClient('inventory.clothing-change', Object.values(inventory.items));
        }
      }

      this.updateState({ inventories });
      this.computeInventoryWeight();
    }
  };

  // Handle success response from socket
  private handleSuccess = (data: UI.Inventory.SuccessFailData): void => {
    this.requests.delete(data.requestId);
  };

  // Handle fail response from socket
  private handleFail = (data: UI.Inventory.MoveOrFailData): void => {
    if ('requestId' in data) {
      const failData = data as UI.Inventory.SuccessFailData;
      const request = this.requests.get(failData.requestId);
      
      if (!request) return;
      
      this.requests.delete(failData.requestId);
      const { sourceIdentifier, oldSlot, targetIdentifier, newSlot } = request;
      
      if (failData.requestType === 'move') {
        const inventories = new Map(this.state.inventories);
        const sourceInventory = inventories.get(sourceIdentifier);
        const targetInventory = inventories.get(targetIdentifier);
        
        if (!sourceInventory || !targetInventory) return;
        
        // Revert the move
        const oldItem = sourceInventory.items[oldSlot];
        const newItem = targetInventory.items[newSlot];

        if (oldItem) {
          targetInventory.items[newSlot] = oldItem;
        } else {
          delete targetInventory.items[newSlot];
        }

        if (newItem) {
          sourceInventory.items[oldSlot] = newItem;
        } else {
          delete sourceInventory.items[oldSlot];
        }

        this.updateState({ inventories });
        this.computeInventoryWeight();
      }
    }
  };

  // Handle item wear from socket
  private handleItemWear = (itemId: number, wearAmount: number): void => {
    let itemChanged = false;
    const inventories = new Map(this.state.inventories);
    
    for (const inventory of inventories.values()) {
      for (const item of Object.values(inventory.items)) {
        if (item.ids.includes(itemId)) {
          const oldDurability = item.durabilities[0] || 0;
          const maxDurability = this.items[item.identifier]?.maxDurability || 1;
          const newDurability = clamp(
            oldDurability + wearAmount,
            0,
            maxDurability
          );

          item.durabilities[0] = newDurability;
          itemChanged = true;
        }
      }
    }
    
    if (itemChanged) {
      this.updateState({ inventories });
    }
  };

  // Handle world inventory open from socket
  private handleOpenWorld = (targetInventory: string): void => {
    this.updateState({ targetInventory });
  };

  // Use an item in a slot
  private useSlot = (slot: number): void => {
    const inventory = this.state.inventories.get(this.state.mainInventory);
    if (!inventory) return;
    
    const slotItem = inventory.items[slot];
    if (!slotItem) return;

    if (slotItem.durabilities && slotItem.durabilities[0] !== null && slotItem.durabilities[0] <= 0) {
      return;
    }

    emitClient('inventory.use-item', slotItem);
  };

  // Get items for a player by item ID
  private getPlayerItems = (itemId: number): UI.Inventory.ItemData[] => {
    const inventory = this.state.inventories.get(this.state.mainInventory);
    return Object.values(inventory?.items || []).filter((item) => item.identifier === itemId);
  };

  // Move an item between inventories
  moveItem(sourceIdentifier: string, oldSlot: number, targetIdentifier: string, newSlot?: number | null, force = false): void {
    if (!this.socket) return;
    
    if (sourceIdentifier === targetIdentifier && oldSlot === newSlot) {
      return;
    }

    // Find an empty slot if none specified
    if (newSlot === undefined || newSlot === null) {
      const targetInventory = this.state.inventories.get(targetIdentifier);
      if (!targetInventory) {
        if (force) {
          const inventories = new Map(this.state.inventories);
          const sourceInventory = inventories.get(sourceIdentifier);
          if (sourceInventory) {
            delete sourceInventory.items[oldSlot];
          }
          this.updateState({ inventories });
        }
        return;
      }
      
      for (let s = 0; s < targetInventory.slots; s++) {
        if (!targetInventory.items[s]) {
          newSlot = s;
          break;
        }
      }

      if (newSlot === undefined || newSlot === null) {
        return;
      }
    }

    // Clear failed image cache for these slots
    this.failedImages.delete(`${sourceIdentifier}::${oldSlot}`);
    this.failedImages.delete(`${targetIdentifier}::${newSlot}`);

    // Send move request to socket
    this.requestId++;
    this.socket.emit('inventory.item-move', this.requestId, sourceIdentifier, oldSlot, targetIdentifier, newSlot);
    this.requests.set(this.requestId, { sourceIdentifier, oldSlot, targetIdentifier, newSlot });

    // Optimistically update state
    const inventories = new Map(this.state.inventories);
    const sourceInventory = inventories.get(sourceIdentifier);
    const targetInventory = inventories.get(targetIdentifier);
    
    if (!sourceInventory || !targetInventory) return;

    const oldItem = sourceInventory.items[oldSlot];
    const newItem = targetInventory.items[newSlot];

    if (oldItem) {
      targetInventory.items[newSlot] = oldItem;
    } else {
      delete targetInventory.items[newSlot];
    }

    if (newItem) {
      sourceInventory.items[oldSlot] = newItem;
    } else {
      delete sourceInventory.items[oldSlot];
    }

    // Handle clothing equipment changes
    if (sourceIdentifier !== targetIdentifier) {
      if (sourceIdentifier === `clothing:${this.state.characterId}`) {
        emitClient('inventory.clothing-change', Object.values(sourceInventory.items));
      }
      if (targetIdentifier === `clothing:${this.state.characterId}`) {
        emitClient('inventory.clothing-change', Object.values(targetInventory.items));
      }
    }

    this.updateState({ inventories });
    this.computeInventoryWeight();
  }

  // Stack items
  stackItem(sourceIdentifier: string, oldSlot: number, targetIdentifier: string, newSlot: number): void {
    if (!this.socket) return;
    
    if (sourceIdentifier === targetIdentifier && oldSlot === newSlot) {
      return;
    }

    // Clear failed image cache
    this.failedImages.delete(`${sourceIdentifier}::${oldSlot}`);
    this.failedImages.delete(`${targetIdentifier}::${newSlot}`);

    // Send stack request
    this.requestId++;
    this.socket.emit('inventory.item-stack', this.requestId, sourceIdentifier, oldSlot, targetIdentifier, newSlot);
    this.requests.set(this.requestId, { sourceIdentifier, oldSlot, targetIdentifier, newSlot });

    // Optimistically update state
    const inventories = new Map(this.state.inventories);
    const sourceInventory = inventories.get(sourceIdentifier);
    const targetInventory = inventories.get(targetIdentifier);
    
    if (!sourceInventory || !targetInventory) return;
    
    const oldItem = sourceInventory.items[oldSlot];
    const newItem = targetInventory.items[newSlot];

    if (oldItem.identifier !== newItem.identifier) return;

    const itemData = this.items[oldItem.identifier];
    if (!itemData) return;

    if (oldItem.quantity + newItem.quantity <= itemData.stackSize) {
      // Complete stack
      newItem.ids.push(...oldItem.ids);
      newItem.metadatas.push(...oldItem.metadatas);
      newItem.quantity += oldItem.quantity;
      delete sourceInventory.items[oldSlot];
    } else {
      // Partial stack
      const diff = itemData.stackSize - newItem.quantity;
      newItem.ids.push(...oldItem.ids.slice(0, diff));
      newItem.metadatas.push(...oldItem.metadatas.slice(0, diff));
      newItem.quantity += diff;
      oldItem.ids = oldItem.ids.slice(diff);
      oldItem.metadatas = oldItem.metadatas.slice(diff);
      oldItem.quantity -= diff;
    }

    this.updateState({ inventories });
  }

  // Drop an item
  dropItem(identifier: string, slot: number): void {
    if (!this.socket) return;
    
    if (this.state.targetInventory.startsWith('_WORLD_:')) {
      this.moveItem(identifier, slot, this.state.targetInventory, undefined, true);
      return;
    }

    this.requestId++;
    this.socket.emit('inventory.item-drop', this.requestId, identifier, slot);
  }

  // Cancel current drag operation
  cancelDrag(): void {
    const dragItem = document.getElementById('drag-item');
    if (!dragItem) return;
    
    document.body.removeChild(dragItem);
    const draggedElements = document.getElementsByClassName('dragged-source');
    for (const element of draggedElements) {
      element.classList.remove('dragged-source');
    }
  }

  // Compute inventory weights
  private computeInventoryWeight(): void {
    const inventoriesWeight = new Map(this.state.inventoriesWeight);
    let updated = false;

    for (const [identifier, data] of this.state.inventories) {
      let weight = 0;
      for (const item of Object.values(data.items)) {
        const itemData = this.items[item.identifier];
        if (itemData && itemData.weight && item.quantity > 0) {
          weight += itemData.weight * item.quantity;
        }
      }
      const weightRatio = weight / data.maxWeight;
      if (weightRatio !== inventoriesWeight.get(identifier)) {
        inventoriesWeight.set(data.identifier, weightRatio);
        updated = true;
      }
    }
    
    if (updated) {
      this.updateState({ inventoriesWeight });
    }
  }

  // Update state and notify listeners
  updateState(newState: Partial<InventoryState>): void {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(listener => listener(this.state));
  }

  // Startup method required by component
  startup(): void {
    // This method is called by the inventory component on mount
    // All initialization is handled in the initialize method
    // This is kept for backwards compatibility
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
  getState(): InventoryState {
    return this.state;
  }

  // Get items data
  getItems(): Inventory.UIItems {
    return this.items;
  }

  // Check if an image has failed to load
  hasFailedImage(key: string): boolean {
    return this.failedImages.has(key);
  }

  // Mark an image as failed
  markImageFailed(key: string): void {
    this.failedImages.add(key);
    // Force re-render by updating state
    this.updateState({});
  }

  // Set tooltip information
  setTooltip(item: UI.Inventory.ItemData | null, below: boolean = false, x: number = 0, y: number = 0): void {
    this.updateState({
      tooltipItem: item,
      tooltipBelow: below,
      tooltipX: x,
      tooltipY: y,
    });
  }

  // Close inventory
  closeInventory(): void {
    this.cancelDrag();
    this.updateState({
      show: false,
      targetInventory: '',
    });
  }

  // Cleanup when store is destroyed
  cleanup(): void {
    if (this.socket) {
      // Remove socket handlers
      this.socket.off('inventory.load', this.handleInventoryLoad);
      this.socket.off('inventory.item-add', this.handleItemAdd);
      this.socket.off('inventory.item-move', this.handleItemMove);
      this.socket.off('inventory.success', this.handleSuccess);
      this.socket.off('inventory.fail', this.handleFail);
      this.socket.off('inventory.item-wear', this.handleItemWear);
      this.socket.off('inventory.open-world', this.handleOpenWorld);

      // Unsubscribe from all inventories
      this.subscriptions.forEach((subscription) => {
        this.socket!.emit('inventory.unsubscribe', subscription);
      });
    }

    this.subscriptions.clear();
    this.worldSubscribed = false;
    this.requests.clear();
    this.listeners.clear();
    this.initialized = false;
  }
}

export default InventoryStore.getInstance();