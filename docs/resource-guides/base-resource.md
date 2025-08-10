# Base Resource API Documentation

The `base` resource provides essential foundation utilities for Pioneer Village including entity management, character data access, socket communication, and world setup. All other resources depend on these core services.

## Quick Start

```typescript
// Client-side imports
import { PVBase, PVGame } from '@lib/client';

// Entity management
await PVBase.deleteEntity(entityId);
PVBase.deleteEntities([entity1, entity2, entity3]);

// Character data access
const character = PVGame.getCurrentCharacter();
console.log(`Player: ${character.firstName} ${character.lastName}`);

// Server-side socket communication
import { PVBase } from '@lib/server';
PVBase.emitSocket('player-update', playerId, data);
```

## Entity Management

### Delete Entities Safely

```typescript
// Delete a single entity with network control
await PVBase.deleteEntity(entityId: number): Promise<void>

// Delete multiple entities efficiently
PVBase.deleteEntities(entities: number[]): void

// Example usage
const spawnedObjects = [chair, table, lamp];
PVBase.deleteEntities(spawnedObjects);

// Individual deletion with error handling
try {
  await PVBase.deleteEntity(problematicEntity);
  console.log('Entity deleted successfully');
} catch (error) {
  console.error('Failed to delete entity:', error);
}
```

### Network Control Management

```typescript
// Gain network control before manipulating entities
await PVBase.getNetworkControlOfEntity(entity: number): Promise<void>

// Example: Move entity after gaining control
await PVBase.getNetworkControlOfEntity(entityId);
SetEntityCoords(entityId, x, y, z, false, false, false, false);
```

## Character Data Access

### Get Current Character

```typescript
// Access current character data
const character = PVGame.getCurrentCharacter(): CharacterData | null

// Character data structure
interface CharacterData {
  id: number;                    // Character database ID
  accountId: number;             // Account ID
  firstName: string;             // First name
  lastName: string;              // Last name
  dateOfBirth: string;           // Birth date
  lastX: number;                 // Last known X coordinate
  lastY: number;                 // Last known Y coordinate
  lastZ: number;                 // Last known Z coordinate
  model: string;                 // Character model
  food: number;                  // Food level (0-100)
  drink: number;                 // Drink level (0-100)
  currencies: CharacterCurrencies;
  healthMetadata: CharacterHealthMetadata;
  face: Game.Face;               // Facial features
  components: number[];          // Clothing components
  source: number;                // Player server ID
  userId: number;                // User database ID
  offline: boolean;              // Online status
}
```

### Character Data Usage

```typescript
// Basic character info
const getCharacterInfo = () => {
  const character = PVGame.getCurrentCharacter();
  
  if (!character) {
    console.log('No character selected');
    return null;
  }
  
  return {
    name: `${character.firstName} ${character.lastName}`,
    position: { x: character.lastX, y: character.lastY, z: character.lastZ },
    health: { food: character.food, drink: character.drink },
    model: character.model,
    id: character.id
  };
};

// Check character needs
const checkCharacterNeeds = () => {
  const character = PVGame.getCurrentCharacter();
  if (!character) return;
  
  if (character.food < 25) {
    console.log('Character is hungry');
  }
  
  if (character.drink < 25) {
    console.log('Character is thirsty');
  }
};
```

### Character Currency System

```typescript
interface CharacterCurrencies {
  cash: number;          // Cash on hand
  bank: number;          // Bank account balance
  // Additional currency types may be added
}

// Access character money
const character = PVGame.getCurrentCharacter();
if (character) {
  console.log(`Cash: $${character.currencies.cash}`);
  console.log(`Bank: $${character.currencies.bank}`);
}
```

## Socket Communication (Server-Side)

### Basic Socket Operations

```typescript
// Access base socket API
// PVBase is imported at top of file

// Send data to socket server (fire-and-forget)
base.emitSocket(eventName: string, ...params: any[]): void

// Send data and wait for response
base.awaitSocket(eventName: string, ...params: any[]): Promise<any>

// Listen for socket events
base.onSocket(eventName: string, callback: Function): void
```

### Socket Usage Examples

```typescript
// Send player data update
const updatePlayerData = (playerId: number, data: any) => {
  // PVBase is imported at top of file
  base.emitSocket('player-update', playerId, data);
};

// Request and await data from socket server
const getPlayerStats = async (playerId: number) => {
  // PVBase is imported at top of file
  try {
    const stats = await base.awaitSocket('get-player-stats', playerId);
    return stats;
  } catch (error) {
    console.error('Failed to get player stats:', error);
    return null;
  }
};

// Listen for admin messages
const setupAdminListener = () => {
  // PVBase is imported at top of file
  base.onSocket('admin-broadcast', (message: string) => {
    console.log('Admin message received:', message);
    // Broadcast to all players
    TriggerClientEvent('chat:addMessage', -1, {
      args: ['[ADMIN]', message],
      color: [255, 0, 0]
    });
  });
};
```

### Real-time Player Tracking

```typescript
// Listen for connected players updates
// PVBase is imported at top of file
base.onSocket('base.connected-players', (players: Base.PlayerInfo[]) => {
  console.log(`${players.length} players online`);
});

// Handle character events
base.onSocket('character-event.disconnected', (sourceId: number) => {
  console.log(`Player ${sourceId} disconnected`);
  // Cleanup player-specific data
  cleanupPlayerData(sourceId);
});
```

## Map Blips System

The base resource automatically sets up map blips for important locations:

### Available Blip Types

```typescript
// Towns and settlements
'Valentine', 'Saint Denis', 'Rhodes', 'Strawberry', 'Annesburg'
'Armadillo', 'Tumbleweed', 'Blackwater', 'Emerald Station'

// Services
'Bank', 'General Store', 'Gunsmith', 'Saloon', 'Stable'
'Barber', 'Tailor', 'Bath House', 'Doctor', 'Post Office'
'Train Station', 'Sheriff Office', 'Poker Table'

// Special locations
'Camp', 'Trapper', 'Fence', 'Horse Shop'
```

### Blip Colors

```typescript
// Available blip colors from data/blips.ts
const BlipColors = {
  LIGHT_BLUE,     // BLIP_MODIFIER_MP_COLOR_1
  DARK_RED,       // BLIP_MODIFIER_MP_COLOR_2  
  PURPLE,         // BLIP_MODIFIER_MP_COLOR_3
  ORANGE,         // BLIP_MODIFIER_MP_COLOR_4
  TEAL,           // BLIP_MODIFIER_MP_COLOR_5
  LIGHT_YELLOW,   // BLIP_MODIFIER_MP_COLOR_6
  PINK,           // BLIP_MODIFIER_MP_COLOR_7
  GREEN,          // BLIP_MODIFIER_MP_COLOR_8
  DARK_TEAL,      // BLIP_MODIFIER_MP_COLOR_9
  RED,            // BLIP_MODIFIER_MP_COLOR_10
  LIGHT_GREEN,    // BLIP_MODIFIER_MP_COLOR_11
  TEAL2,          // BLIP_MODIFIER_MP_COLOR_12
  BLUE,           // BLIP_MODIFIER_MP_COLOR_13
  DARK_PURPLE,    // BLIP_MODIFIER_MP_COLOR_14
  DARK_PINK,      // BLIP_MODIFIER_MP_COLOR_15
  DARK_DARK_RED,  // BLIP_MODIFIER_MP_COLOR_16
  GRAY,           // BLIP_MODIFIER_MP_COLOR_17
  PINKISH,        // BLIP_MODIFIER_MP_COLOR_18
  YELLOW_GREEN,   // BLIP_MODIFIER_MP_COLOR_19
  DARK_GREEN,     // BLIP_MODIFIER_MP_COLOR_20
  BRIGHT_BLUE,    // BLIP_MODIFIER_MP_COLOR_21
  BRIGHT_PURPLE,  // BLIP_MODIFIER_MP_COLOR_22
  YELLOW_ORANGE,  // BLIP_MODIFIER_MP_COLOR_23
  BLUE2,          // BLIP_MODIFIER_MP_COLOR_24
  TEAL3,          // BLIP_MODIFIER_MP_COLOR_25
  TAN,            // BLIP_MODIFIER_MP_COLOR_26
  OFF_WHITE,      // BLIP_MODIFIER_MP_COLOR_27
  LIGHT_YELLOW2,  // BLIP_MODIFIER_MP_COLOR_28
  LIGHT_PINK,     // BLIP_MODIFIER_MP_COLOR_29
  LIGHT_RED,      // BLIP_MODIFIER_MP_COLOR_30
  LIGHT_YELLOW3,  // BLIP_MODIFIER_MP_COLOR_31
  WHITE,          // BLIP_MODIFIER_MP_COLOR_32
};
```

### Creating Custom Blips

```typescript
// While the base resource creates standard blips automatically,
// you can create custom ones using native functions:

const createCustomBlip = (x: number, y: number, z: number, name: string) => {
  const blip = Citizen.invokeNative('0x554D9D53F696D002', 1664425300, x, y, z);
  SetBlipSprite(blip, 1935729485); // Custom sprite
  Citizen.invokeNative('0x9CB1A1623062F402', blip, name);
  return blip;
};
```

## World Setup and Configuration

### Door System Integration

The base resource automatically registers doors across the map:

```typescript
// Doors are automatically registered from data/doors.ts
// This includes doors for:
// - Banks and buildings
// - Sheriff offices  
// - Saloons and stores
// - Private residences
// - Jail cells

// Other resources can then control these doors through the doors system
```

### Automatic Initialization

```typescript
// The base resource handles:
// 1. Map blip creation for all major locations
// 2. Door registration for building access
// 3. Socket communication setup
// 4. Player tracking initialization
// 5. Character data management setup

// This happens automatically when the resource starts
```

## Integration Patterns

### Resource Integration

```typescript
import { PVBase, PVGame } from '@lib/client';
import { onResourceInit } from '@lib/client/game';

// Start immediately, wait for dependencies in background
onResourceInit('base', () => {
  // This runs when base resource is ready
  setupBaseFeatures();
});
```

### Common Integration Examples

```typescript
// Example: Inventory system using base utilities
class InventoryManager {
  private cleanupEntities: number[] = [];
  
  async spawnItem(itemModel: string, coords: Vector3) {
    // Spawn item
    const item = CreateObject(GetHashKey(itemModel), coords.x, coords.y, coords.z, true, true, false);
    this.cleanupEntities.push(item);
    return item;
  }
  
  cleanup() {
    // Use base resource for safe cleanup
    PVBase.deleteEntities(this.cleanupEntities);
    this.cleanupEntities = [];
  }
  
  getPlayerInfo() {
    // Access character data through base
    const character = PVGame.getCurrentCharacter();
    return character ? {
      characterId: character.id,
      name: `${character.firstName} ${character.lastName}`
    } : null;
  }
}
```

### Server-Side Integration

```typescript
// Example: Job system using socket communication
class JobManager {
  private base = PVBase;
  
  constructor() {
    this.setupSocketListeners();
  }
  
  private setupSocketListeners() {
    // Listen for job updates from web dashboard
    this.base.onSocket('job-assignment', (characterId: number, jobData: any) => {
      this.assignJob(characterId, jobData);
    });
    
    // Listen for salary payments
    this.base.onSocket('salary-payment', (characterId: number, amount: number) => {
      this.paySalary(characterId, amount);
    });
  }
  
  assignJob(characterId: number, jobData: any) {
    // Update character's job
    this.base.emitSocket('character-update', characterId, { 
      job: jobData.handle,
      jobTitle: jobData.title 
    });
  }
  
  async getCharacterJobData(characterId: number) {
    try {
      return await this.base.awaitSocket('get-character-job', characterId);
    } catch (error) {
      console.error('Failed to get job data:', error);
      return null;
    }
  }
}
```

## Error Handling

### Entity Management Errors

```typescript
// Handle entity deletion failures
const safeDeleteEntity = async (entityId: number) => {
  try {
    await PVBase.deleteEntity(entityId);
    console.log(`Entity ${entityId} deleted successfully`);
  } catch (error) {
    console.error(`Failed to delete entity ${entityId}:`, error);
    
    // Fallback: Try direct deletion
    if (DoesEntityExist(entityId)) {
      DeleteEntity(entityId);
    }
  }
};
```

### Socket Communication Errors

```typescript
// Handle socket timeouts and failures
const robustSocketCall = async (eventName: string, ...params: any[]) => {
  // PVBase is imported at top of file
  
  try {
    const result = await Promise.race([
      base.awaitSocket(eventName, ...params),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Socket timeout')), 10000)
      )
    ]);
    return result;
  } catch (error) {
    console.error(`Socket call ${eventName} failed:`, error);
    
    // Provide fallback or retry logic
    if (error.message === 'Socket timeout') {
      console.log('Retrying socket call...');
      return await base.awaitSocket(eventName, ...params);
    }
    
    throw error;
  }
};
```

### Character Data Validation

```typescript
// Validate character data before use
const validateCharacter = (character: CharacterData | null): character is CharacterData => {
  if (!character) {
    console.warn('No character data available');
    return false;
  }
  
  if (!character.firstName || !character.lastName) {
    console.warn('Character missing name data');
    return false;
  }
  
  if (character.id <= 0) {
    console.warn('Invalid character ID');
    return false;
  }
  
  return true;
};

// Usage
const character = PVGame.getCurrentCharacter();
if (validateCharacter(character)) {
  // Safe to use character data
  console.log(`Character: ${character.firstName} ${character.lastName}`);
}
```

## Best Practices

### 1. Entity Cleanup
```typescript
// Good - always clean up entities when done
on('onResourceStop', (resourceName: string) => {
  if (resourceName === GetCurrentResourceName()) {
    PVBase.deleteEntities(allSpawnedEntities);
  }
});

// Bad - leaving entities behind
// CreateObject(...) without cleanup
```

### 2. Character Data Checks
```typescript
// Good - check character exists before use
const character = PVGame.getCurrentCharacter();
if (character) {
  processCharacterData(character);
}

// Bad - assuming character always exists
const character = PVGame.getCurrentCharacter();
console.log(character.firstName); // May throw error
```

### 3. Socket Error Handling
```typescript
// Good - handle socket failures
try {
  const result = await base.awaitSocket('getData', id);
  return result;
} catch (error) {
  console.error('Socket failed:', error);
  return defaultValue;
}

// Bad - no error handling
const result = await base.awaitSocket('getData', id);
```

### 4. Resource Initialization
```typescript
// Good - use init system
import { onResourceInit } from '@lib/client/game';

// Resource starts immediately, can do early setup
setupNonDependentFeatures();

// Wait for specific resources as needed
onResourceInit('base', () => {
  setupBaseFeatures();
});

// Also good for multiple dependencies
onResourceInit('ui', () => {
  setupUIFeatures();
});
```

## Troubleshooting

### Common Issues

**Character data is null:**
- Ensure player has selected a character
- Check if character selection completed
- Verify character data was loaded from database

**Entity deletion fails:**
- Check if entity exists before deletion
- Ensure network control is gained first
- Verify entity isn't already being deleted

**Socket communication fails:**
- Check socket server is running
- Verify event names match exactly
- Ensure proper error handling

### Debug Commands

```typescript
// Check character data
console.log(PVGame.getCurrentCharacter());

// Check entity exists
console.log(DoesEntityExist(entityId));

// Test socket connection (server-side)
PVBase.emitSocket('test-ping', 'hello');
```

## Related Resources

- **[Init Resource](init-resource.md)** - Resource initialization system
- **[Game Resource](game-resource.md)** - Core gameplay functions
- **[UI Resource](ui-resource.md)** - User interface system
- **[Resource Development Guide](../resource-development/creating-resources.md)** - Creating new resources

---

*The base resource is the foundation of Pioneer Village - ensure your resources properly depend on it and use its utilities for reliable gameplay functionality.*
