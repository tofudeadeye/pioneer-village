# Inventory Resource API Documentation

The `inventory` resource provides a comprehensive item management system with containers, weapons, stacking, durability, and real-time synchronization. Use it to manage player items, containers, and complex inventory interactions.

## Quick Start

```typescript
// Server-side: Add items to character inventory
import { emitSocket } from '@lib/server';
emitSocket('inventoryAddItem', `character:${characterId}`, itemHash, quantity, metadata, (success: boolean) => {
  console.log('Item added:', success);
});

// Client-side: Open inventory UI
import { emitUI } from '@lib/client/comms/ui';
emitUI('inventory.state', { show: true });

// Client-side: Use inventory hotkey slot
emitUI('inventory.use-slot', 0); // Use slot 1 (0-indexed)

// Socket: Move items between inventories
socket.emit('inventoryMove', requestId, oldInventoryId, oldSlot, newInventoryId, newSlot);
```

## Item Management System

### Add Items to Inventory

```typescript
// Primary method for adding items (server-side)
emitSocket('inventoryAddItem', inventoryId, itemId, amount, metadata, callback);
// Parameters:
// inventoryId: string - e.g., "character:123", "stash:vault1"
// itemId: number - Item hash/ID
// amount: number - Quantity to add
// metadata: object - Optional item metadata
// callback: (success: boolean) => void

// Examples
emitSocket('inventoryAddItem', `character:${charId}`, 0x12345678, 5, {}, (success: boolean) => {
  if (success) {
    console.log('Successfully added 5 items');
  } else {
    console.log('Failed to add items - inventory full or invalid');
  }
});

// Add item with metadata
emitSocket('inventoryAddItem', `character:${charId}`, itemHash, 1, {
  durability: 100,
  quality: 'excellent',
  craftedBy: 'PlayerName',
  timestamp: Date.now()
}, callback);
```

### Inventory Types and Capacities

```typescript
// Available inventory types
const inventoryTypes = {
  character: {
    slots: 48,
    capacity: 70000, // 70kg in grams
    restrictions: 'none'
  },
  clothing: {
    slots: 12,
    capacity: 40000, // 40kg
    restrictions: 'clothing_only'
  },
  wagon: {
    slots: 48,
    capacity: 500000, // 500kg
    restrictions: 'none'
  },
  horse: {
    slots: 24,
    capacity: 100000, // 100kg
    restrictions: 'small_items_only'
  },
  stash: {
    slots: 64,
    capacity: 500000, // 500kg
    restrictions: 'none'
  },
  paperBag: {
    slots: 8,
    capacity: 6000, // 6kg
    restrictions: 'small_items_only'
  }
};

// Inventory ID format: "type:identifier"
const inventoryIds = {
  character: `character:${characterId}`,
  horse: `horse:${horseId}`,
  wagon: `wagon:${wagonId}`,
  stash: `stash:${stashId}`,
  clothing: `clothing:${characterId}`,
  paperBag: `paperBag:${bagId}`
};
```

## Item Movement and Management

### Move Items Between Inventories

```typescript
// Move items using socket communication
socket.emit('inventoryMove', requestId, oldIdentifier, oldSlot, newIdentifier, newSlot);
// Parameters:
// requestId: number - Unique request ID
// oldIdentifier: string - Source inventory
// oldSlot: number - Source slot
// newIdentifier: string - Destination inventory
// newSlot: number - Destination slot

// Example: Move item from character to horse
const moveToHorse = (fromSlot: number, toSlot: number) => {
  const requestId = Date.now();
  socket.emit('inventoryMove', 
    requestId,
    `character:${characterId}`,
    fromSlot,
    `horse:${horseId}`,
    toSlot
  );
};

// Listen for move results
socket.on('inventoryMoveResult', (requestId: number, success: boolean, error?: string) => {
  if (success) {
    console.log('Item moved successfully');
  } else {
    console.error('Move failed:', error);
  }
});
```

### Stack Items

```typescript
// Stack items of the same type
socket.emit('inventoryStack', requestId, oldIdentifier, oldSlot, newIdentifier, newSlot);
// Parameters:
// requestId: number
// oldIdentifier: string
// oldSlot: number
// newIdentifier: string
// newSlot: number

// Example: Stack ammunition
const stackAmmo = (sourceSlot: number, targetSlot: number) => {
  const requestId = Date.now();
  socket.emit('inventoryStack',
    requestId,
    `character:${characterId}`,
    sourceSlot,
    `character:${characterId}`,
    targetSlot
  );
};
```

### Subscribe to Inventory Updates

```typescript
// Subscribe to real-time inventory updates
socket.emit('inventorySubscribe', inventoryId);

// Example: Subscribe to character inventory
socket.emit('inventorySubscribe', `character:${characterId}`);

// Listen for inventory updates
socket.on('inventoryUpdate', (inventoryData: any) => {
  console.log('Inventory updated:', inventoryData);
  updateInventoryUI(inventoryData);
});

// Unsubscribe when done
socket.emit('inventoryUnsubscribe', `character:${characterId}`);
```

## Item Usage System

### Use Inventory Slots (Hotkeys)

```typescript
// Use hotkey slots (1-5 keys)
emitUI('inventory.use-slot', slotIndex);

// Examples
emitUI('inventory.use-slot', 0); // Use slot 1 (F1 key)
emitUI('inventory.use-slot', 1); // Use slot 2 (F2 key)
emitUI('inventory.use-slot', 4); // Use slot 5 (F5 key)

// Listen for slot usage
onUI('inventory.slot-used', (slotIndex: number, itemData: any) => {
  console.log(`Used item in slot ${slotIndex}:`, itemData);
});
```

### Use Specific Items

```typescript
// Use item directly
emitUI('inventory.use-item', itemData);

// Item data structure
interface ItemData {
  id: number;
  hash: number;
  name: string;
  amount: number;
  slot: number;
  metadata?: any;
  weight: number;
  durability?: number;
}

// Example: Use a consumable item
const useItem = (item: ItemData) => {
  emitUI('inventory.use-item', item);
};
```

### Item Use Events

```typescript
// Items can define custom use events
const itemUseEvents = {
  'inventory:client:toggle_weapon': 'Equip/unequip weapon',
  'inventory:client:equip_ammo': 'Load ammunition',
  'inventory:client:toggle_thrown': 'Ready thrown weapon',
  'fishing:client:use_bait': 'Apply fishing bait',
  'doors:client:toggle_door': 'Use door key',
  'health:client:consume': 'Consume food/medicine'
};

// Handle custom use events
import { onNet, emitNet } from '@lib/client';
onNet('inventory:client:toggle_weapon', (itemData: any) => {
  const weaponHash = itemData.metadata?.weaponHash || itemData.hash;
  
  if (HasPedGotWeapon(PlayerPedId(), weaponHash, false)) {
    // Unequip weapon
    RemoveWeaponFromPed(PlayerPedId(), weaponHash);
  } else {
    // Equip weapon
    GiveWeaponToPed(PlayerPedId(), weaponHash, 0, false, true);
  }
});
```

## Container System

### Container Types and Properties

```typescript
// Container properties
interface ContainerData {
  id: string;
  type: string;           // 'stash', 'wagon', 'horse', etc.
  locked: boolean;        // Can be accessed
  sealed: 'normal' | 'sealed' | 'broken';
  capacity: number;       // Weight capacity in grams
  slots: number;          // Number of item slots
  restrictions: string;   // Item restrictions
}

// Container access levels
const containerSeal = {
  normal: 'Accessible',
  sealed: 'Sealed container - cannot access',
  broken: 'Broken seal - can access'
};
```

### Container Operations

```typescript
// Open container UI
const openContainer = (containerId: string) => {
  // Subscribe to container updates
  socket.emit('inventorySubscribe', containerId);
  
  // Show container UI
  emitUI('inventory.state', {
    show: true,
    container: containerId,
    type: 'container'
  });
};

// Lock/unlock containers
const toggleContainerLock = (containerId: string, locked: boolean) => {
  socket.emit('containerSetLocked', containerId, locked);
};

// Break container seal
const breakContainerSeal = (containerId: string) => {
  socket.emit('containerBreakSeal', containerId);
};
```

## Special Item Systems

### Door Keys

```typescript
// Door key metadata structure
interface DoorKeyMetadata {
  doorHash?: number;           // Single door access
  doorHashes?: number[];       // Multiple doors
  linkedDoors?: number[][];    // Linked door groups
}

// Create door key
const createDoorKey = (doorHashes: number[], keyName: string) => {
  const metadata: DoorKeyMetadata = {
    doorHashes: doorHashes
  };
  
  emitSocket('inventoryAddItem', `character:${charId}`, keyItemHash, 1, metadata, (success: boolean) => {
    if (success) {
      console.log(`Created key for ${doorHashes.length} doors`);
    }
  });
};

// Use door key
onNet('doors:client:toggle_door', (itemData: any) => {
  // Get closest door hash (this would use game natives to find nearby doors)
  const doorHash = 0x12345678; // Example - implement actual door detection
  const keyData = itemData.metadata;
  
  if (keyData.doorHash === doorHash || 
      keyData.doorHashes?.includes(doorHash)) {
    // Player has access to this door
    emitNet('doors:toggleDoor', doorHash);
  } else {
    console.log('Key does not fit this door');
  }
});
```

### Weapon System Integration

```typescript
// Weapon equipping/unequipping
const manageWeapon = (weaponItem: UI.Inventory.ItemData, equip: boolean) => {
  const weaponHash = weaponItem.metadata?.weaponHash || weaponItem.hash;
  const playerPed = PlayerPedId();
  
  if (equip) {
    // Give weapon to player
    GiveWeaponToPed(playerPed, weaponHash, 0, false, true);
    
    // Apply weapon metadata (condition, modifications, etc.)
    if (weaponItem.metadata?.durability) {
      SetWeaponDegradation(playerPed, weaponHash, weaponItem.metadata.durability / 100);
    }
  } else {
    // Remove weapon from player
    RemoveWeaponFromPed(playerPed, weaponHash);
  }
};

// Dual-wielding pistols
const handleDualWield = (mainPistol: any, offhandPistol: any) => {
  const playerPed = PlayerPedId();
  
  // Equip main hand pistol
  GiveWeaponToPed(playerPed, mainPistol.hash, 0, false, true);
  
  // Equip off-hand pistol
  GiveWeaponToPed(playerPed, offhandPistol.hash, 0, false, false);
  SetCurrentPedWeapon(playerPed, offhandPistol.hash, false, 1, false, false);
};
```

### Item Durability and Wear

```typescript
// Damage item durability
socket.emit('inventory.item-wear', itemId);

// Listen for durability changes
socket.on('inventory.item-durability-update', (itemId: number, newDurability: number) => {
  console.log(`Item ${itemId} durability: ${newDurability}%`);
  
  if (newDurability <= 0) {
    console.log('Item is broken!');
    // Handle broken item (remove, repair, etc.)
  }
});

// Check item condition
const getItemCondition = (durability: number): string => {
  if (durability >= 90) return 'Excellent';
  if (durability >= 70) return 'Good';
  if (durability >= 50) return 'Fair';
  if (durability >= 25) return 'Poor';
  if (durability > 0) return 'Broken';
  return 'Destroyed';
};
```

## Advanced Usage Patterns

### Inventory Management System

```typescript
// Complete inventory manager class
class InventoryManager {
  private characterId: number;
  private socket: any;
  
  constructor(characterId: number, socket: any) {
    this.characterId = characterId;
    this.socket = socket;
    this.subscribe();
  }
  
  subscribe() {
    this.socket.emit('inventorySubscribe', `character:${this.characterId}`);
  }
  
  async addItem(itemHash: number, amount: number, metadata: any = {}): Promise<boolean> {
    return new Promise((resolve) => {
      emitSocket('inventoryAddItem', 
        `character:${this.characterId}`, 
        itemHash, 
        amount, 
        metadata, 
        (success: boolean) => resolve(success)
      );
    });
  }
  
  moveItem(fromSlot: number, toInventory: string, toSlot: number): Promise<boolean> {
    return new Promise((resolve) => {
      const requestId = Date.now();
      
      const handler = (id: number, success: boolean) => {
        if (id === requestId) {
          this.socket.off('inventoryMoveResult', handler);
          resolve(success);
        }
      };
      
      this.socket.on('inventoryMoveResult', handler);
      
      this.socket.emit('inventoryMove', 
        requestId,
        `character:${this.characterId}`,
        fromSlot,
        toInventory,
        toSlot
      );
    });
  }
  
  async getInventoryWeight(): Promise<number> {
    // Calculate total weight of items
    return new Promise((resolve) => {
      this.socket.emit('getInventoryWeight', `character:${this.characterId}`, (weight: number) => {
        resolve(weight);
      });
    });
  }
  
  async findItemsByType(itemType: string): Promise<any[]> {
    return new Promise((resolve) => {
      this.socket.emit('findItems', `character:${this.characterId}`, { type: itemType }, (items: any[]) => {
        resolve(items);
      });
    });
  }
}
```

### Shop/Trading System Integration

```typescript
// Shop system using inventory
const purchaseItem = async (customerId: number, itemHash: number, quantity: number, price: number) => {
  // Check if player has money
  const playerMoney = await getPlayerMoney(customerId);
  
  if (playerMoney >= price) {
    // Add item to inventory
    emitSocket('inventoryAddItem', `character:${customerId}`, itemHash, quantity, {
      purchasePrice: price,
      purchaseDate: Date.now(),
      vendor: 'GeneralStore'
    }, (success: boolean) => {
      if (success) {
        // Deduct money
        deductPlayerMoney(customerId, price);
        console.log(`Player ${customerId} purchased ${quantity}x item ${itemHash} for $${price}`);
      } else {
        console.log('Purchase failed - inventory full');
      }
    });
  } else {
    console.log('Insufficient funds');
  }
};

// Trading between players
const tradeItems = (player1Id: number, player2Id: number, items1: any[], items2: any[]) => {
  // Remove items from player 1, add to player 2
  for (const item of items1) {
    // Implementation would remove from player1 and add to player2
  }
  
  // Remove items from player 2, add to player 1
  for (const item of items2) {
    // Implementation would remove from player2 and add to player1
  }
};
```

### Crafting System Integration

```typescript
// Crafting system using inventory items
const craftItem = async (crafterId: number, recipe: any) => {
  const playerInventory = `character:${crafterId}`;
  
  // Check if player has required materials
  const hasRequiredItems = await checkInventoryForItems(playerInventory, recipe.materials);
  
  if (hasRequiredItems) {
    // Remove crafting materials
    for (const material of recipe.materials) {
      await removeItemFromInventory(playerInventory, material.hash, material.amount);
    }
    
    // Add crafted item
    emitSocket('inventoryAddItem', playerInventory, recipe.resultItem, recipe.resultAmount, {
      craftedBy: crafterId,
      craftedAt: Date.now(),
      quality: calculateCraftingQuality(crafterId),
      recipe: recipe.id
    }, (success: boolean) => {
      if (success) {
        console.log('Item crafted successfully');
      } else {
        console.log('Crafting failed - inventory full');
        // Return materials
        for (const material of recipe.materials) {
          emitSocket('inventoryAddItem', playerInventory, material.hash, material.amount, {}, () => {});
        }
      }
    });
  }
};
```

## Error Handling

### Common Error Scenarios

```typescript
// Handle inventory operation failures (server-side)
import { emitSocket, emitClient } from '@lib/server';

const safeAddItem = (source: number, inventoryId: string, itemHash: number, amount: number, metadata: any = {}) => {
  emitSocket('inventoryAddItem', inventoryId, itemHash, amount, metadata, (success: boolean) => {
    if (!success) {
      // Handle different failure reasons
      console.error('Failed to add item - possible causes:');
      console.error('- Inventory full (weight or slots)');
      console.error('- Invalid item hash');
      console.error('- Invalid inventory ID');
      console.error('- Item restrictions (e.g., clothes in non-clothing inventory)');
      
      // Provide user feedback
      emitClient('notification:show', source, 
        'Cannot add item - inventory may be full', 'error'
      );
    }
  });
};

// Handle socket disconnection
socket.on('disconnect', () => {
  console.log('Socket disconnected - inventory operations may fail');
  // Implement reconnection logic or queue operations
});

// Handle invalid inventory access
socket.on('inventoryError', (error: string) => {
  console.error('Inventory error:', error);
  // Handle specific error types
  switch (error) {
    case 'INVENTORY_NOT_FOUND':
      console.log('Inventory does not exist');
      break;
    case 'INSUFFICIENT_PERMISSION':
      console.log('No access to this inventory');
      break;
    case 'INVENTORY_LOCKED':
      console.log('Inventory is locked');
      break;
  }
});
```

## Best Practices

### 1. Weight and Capacity Management
```typescript
// Good - check capacity before adding
const checkCapacityBeforeAdd = async (inventoryId: string, itemWeight: number) => {
  const currentWeight = await getCurrentInventoryWeight(inventoryId);
  const maxWeight = getInventoryMaxWeight(inventoryId);
  
  if (currentWeight + itemWeight <= maxWeight) {
    // Safe to add item
    return true;
  } else {
    console.log('Item too heavy for inventory');
    return false;
  }
};

// Bad - assuming item will fit
emitSocket('inventoryAddItem', inventoryId, itemHash, 99999, {}, callback);
```

### 2. Proper Socket Management
```typescript
// Good - subscribe and unsubscribe properly
const manageInventorySubscription = (inventoryId: string, subscribe: boolean) => {
  if (subscribe) {
    socket.emit('inventorySubscribe', inventoryId);
  } else {
    socket.emit('inventoryUnsubscribe', inventoryId);
  }
};

// Bad - forgetting to unsubscribe
socket.emit('inventorySubscribe', inventoryId);
// ... no unsubscribe call
```

### 3. Metadata Usage
```typescript
// Good - structured metadata
const itemMetadata = {
  durability: 100,
  quality: 'excellent',
  craftedBy: playerId,
  timestamp: Date.now(),
  customProperties: {
    enchanted: true,
    level: 5
  }
};

// Bad - unstructured metadata
const itemMetadata = {
  "random_stuff": "unclear_purpose",
  123: "numeric_keys_confusing"
};
```

### 4. Error Handling
```typescript
// Good - always handle callback results
emitSocket('inventoryAddItem', inventoryId, itemHash, amount, metadata, (success: boolean) => {
  if (success) {
    console.log('Item added successfully');
  } else {
    console.error('Failed to add item');
    // Implement fallback logic
  }
});

// Bad - ignoring callback
emitSocket('inventoryAddItem', inventoryId, itemHash, amount, metadata, () => {});
```

## Troubleshooting

### Common Issues

**Items not appearing in inventory:**
- Check if inventory resource is started
- Verify socket connection is established
- Ensure inventory subscription is active
- Check item hash is valid

**Cannot move items:**
- Verify both inventories exist and are accessible
- Check weight and slot restrictions
- Ensure proper inventory permissions
- Validate slot numbers are within range

**Inventory UI not updating:**
- Check if UI subscription is active
- Verify socket events are being received
- Ensure UI resource is properly integrated

### Debug Commands

```typescript
// Debug inventory state
console.log('Inventory subscriptions:', getActiveSubscriptions());

// Test item addition
emitSocket('inventoryAddItem', `character:${charId}`, testItemHash, 1, {}, (success: boolean) => console.log('Added:', success));

// Check socket connection
console.log('Socket connected:', socket.connected);

// Verify inventory capacity
socket.emit('getInventoryInfo', inventoryId, (info: any) => {
  console.log('Inventory info:', info);
});
```

## Related Resources

- **[Base Resource](base-resource.md)** - Character data integration
- **[UI Resource](ui-resource.md)** - Inventory interface
- **[Game Resource](game-resource.md)** - Weapon system integration
- **[Health Resource](health-resource.md)** - Consumable items

---

*The inventory resource provides the foundation for item management and container systems in Pioneer Village.*
