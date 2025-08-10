# Pioneer Village Server API Reference

This document provides comprehensive documentation for the Pioneer Village server-side API library exports. The server library provides communication functions, client management utilities, and logging capabilities.

## Table of Contents

- [Communication APIs](#communication-apis)
  - [Socket Communication](#socket-communication)
  - [Client Communication](#client-communication)
- [Utility Functions](#utility-functions)
  - [Player Management](#player-management)
  - [Queue Management](#queue-management)
- [Logging](#logging)
- [Usage Examples](#usage-examples)

---

## Communication APIs

The server-side communication system provides type-safe, promise-based communication with clients and socket connections.

### Socket Communication

Functions for communicating with the socket server for persistent connections and real-time data.

#### `emitSocket<T>(...args): void`

Sends an event to the socket server without expecting a response.

**Parameters:**
- `...args` - Event arguments to send to the socket server

**Features:**
- Automatic buffering if the base resource isn't available
- Resource state checking and automatic flushing

**Example:**
```typescript
import { emitSocket } from '@lib/server';

// Send player connection event to socket server
emitSocket('playerConnected', {
  serverId: source,
  identifiers: getIdentifiers(source),
  timestamp: Date.now()
});
```

#### `awaitSocket<T>(...args): Promise<any>`

Makes an asynchronous call to the socket server and waits for a response.

**Parameters:**
- `...args` - Arguments to send to the socket server

**Returns:** `Promise<any>` - Promise that resolves with the socket server's response

**Features:**
- Automatic buffering system when base resource is unavailable
- Promise-based response handling

**Example:**
```typescript
import { awaitSocket } from '@lib/server';

// Get player data from socket server
const playerData = await awaitSocket('getPlayerData', playerId);
console.log('Player data from socket:', playerData);
```

#### `onSocket<T>(...args): void`

Registers an event listener for socket server events.

**Parameters:**
- `...args` - Event registration arguments

**Features:**
- Automatic registration buffering
- Event listener registry management

**Example:**
```typescript
import { onSocket } from '@lib/server';

// Listen for socket server events
onSocket('playerDataUpdated', (playerId, newData) => {
  console.log(`Player ${playerId} data updated:`, newData);
  // Handle player data update
});
```

### Client Communication

Functions for communicating with connected clients using RPC and event systems.

#### `onClientCall<T>(evtName: T, callback: Function): void`

Registers a callback function to handle RPC calls from clients.

**Parameters:**
- `evtName: T` - The name of the RPC event to listen for
- `callback: (serverId: number, ...args: Parameters<RPC[T]>) => ReturnType<RPC[T]> | Promise<ReturnType<RPC[T]>>` - Function to handle the RPC call

**Features:**
- Automatic error handling and response sending
- Type-safe RPC handling
- Client ID (source) injection

**Example:**
```typescript
import { onClientCall } from '@lib/server';

onClientCall('getPlayerInventory', async (serverId, playerId) => {
  // serverId is automatically injected as the client's source
  if (serverId !== playerId) {
    throw new Error('Invalid player ID');
  }
  
  // Fetch inventory from database or cache
  const inventory = await getPlayerInventoryFromDB(playerId);
  return inventory;
});
```

#### `onClient<T>(evtName: T, callback: Function): void`

Registers an event listener for client events.

**Parameters:**
- `evtName: T` - The event name to listen for
- `callback: (...args: Parameters<NetEvents[T]>) => void` - Event handler function

**Example:**
```typescript
import { onClient } from '@lib/server';

onClient('playerAction', (action, data) => {
  console.log(`Player performed action: ${action}`, data);
  // Handle player action
});
```

#### `awaitClient<T>(evtName: T, serverId: number, ...args): Promise<ReturnType<RPC[T]>>`

Makes an asynchronous RPC call to a specific client and waits for a response.

**Parameters:**
- `evtName: T` - The RPC event name
- `serverId: number` - The client's server ID to send the call to
- `...args: Parameters<RPC[T]>` - Arguments to pass to the client

**Returns:** `Promise<ReturnType<RPC[T]>>` - Promise that resolves with the client's response

**Features:**
- 10-second timeout for client responses
- Automatic error handling for timeouts and failures

**Example:**
```typescript
import { awaitClient } from '@lib/server';

// Request client-side data
const clientData = await awaitClient('getClientState', playerId);
console.log('Received client state:', clientData);
```

#### `emitClient<T>(evtName: T, serverId: number, ...args): void`

Sends an event to a specific client without expecting a response.

**Parameters:**
- `evtName: T` - The event name
- `serverId: number` - The client's server ID
- `...args: Parameters<NetEvents[T]>` - Event arguments

**Example:**
```typescript
import { emitClient } from '@lib/server';

// Send notification to specific client
emitClient('showNotification', playerId, 'Welcome to the server!', 'success');
```

---

## Utility Functions

### Player Management

Utility functions for managing player data and identifiers.

#### `getIdentifiers(serverId: string | number): Record<string, string>`

Retrieves all identifiers for a specific player.

**Parameters:**
- `serverId: string | number` - The player's server ID (will be converted to string)

**Returns:** `Record<string, string>` - Object mapping identifier types to their values

**Features:**
- Automatic string conversion for server ID
- Comprehensive identifier collection (steam, license, discord, etc.)

**Example:**
```typescript
import { getIdentifiers } from '@lib/server';

const identifiers = getIdentifiers(source);
console.log('Player identifiers:', identifiers);
// Example output:
// {
//   steam: 'steam:110000103fa6d84',
//   license: 'license:1234567890abcdef',
//   discord: 'discord:123456789012345678',
//   fivem: 'fivem:123456'
// }

// Access specific identifiers
const steamId = identifiers.steam;
const discordId = identifiers.discord;
```

### Queue Management

Function for sorting player queue data by priority and connection time.

#### `queueSort(a: LineData, b: LineData): number`

Sorting function for player queue management.

**Parameters:**
- `a: LineData` - First queue entry to compare
- `b: LineData` - Second queue entry to compare

**Returns:** `number` - Sort comparison result (-1, 0, or 1)

**Sorting Logic:**
1. Higher priority values are sorted first
2. If priorities are equal, earlier connection times are sorted first

**Example:**
```typescript
import { queueSort } from '@lib/server';

// Example queue data
const queueData = [
  { priority: 1, connectTime: 1000, /* other properties */ },
  { priority: 5, connectTime: 2000, /* other properties */ },
  { priority: 1, connectTime: 500, /* other properties */ }
];

// Sort the queue
queueData.sort(queueSort);
// Result: priority 5 first, then priority 1 with earlier connectTime
```

---

## Logging

### Development Logging

The server library provides a development logging function for debugging and monitoring.

#### `LogToUI(message: string, logToConsole?: boolean): void`

Sends log messages to the UI system for development debugging.

**Parameters:**
- `message: string` - The message to log
- `logToConsole?: boolean` - Whether to also log to server console (default: false)

**Features:**
- Conditional logging based on development environment
- Dual output support (UI and console)
- Automatic resource name injection

**Example:**
```typescript
import { LogToUI } from '@lib/server';

// Log to UI only
LogToUI('Player inventory updated');

// Log to both UI and console
LogToUI('Critical error occurred', true);

// In development environment, these will be sent to the UI
// In production, they may be disabled based on DEV_ENV setting
```

---

## Usage Examples

### Complete Server Setup Example

```typescript
import { 
  onClientCall, 
  awaitClient, 
  emitClient, 
  emitSocket,
  getIdentifiers,
  LogToUI 
} from '@lib/server';

// Set up player data management
const playerData = new Map();

// Handle client requests for player data
onClientCall('getPlayerData', async (serverId, requestedPlayerId) => {
  if (serverId !== requestedPlayerId) {
    throw new Error('Players can only request their own data');
  }
  
  const identifiers = getIdentifiers(serverId);
  let data = playerData.get(identifiers.license);
  
  if (!data) {
    // Load from database or create new
    data = await loadPlayerDataFromDB(identifiers.license);
    playerData.set(identifiers.license, data);
  }
  
  LogToUI(`Sent player data for ${identifiers.license}`);
  return data;
});

// Handle player connection
on('playerConnecting', async (name, setKickReason, deferrals) => {
  const source = global.source;
  const identifiers = getIdentifiers(source);
  
  deferrals.defer();
  deferrals.update('Loading player data...');
  
  try {
    // Notify socket server of connection
    emitSocket('playerConnecting', {
      serverId: source,
      name,
      identifiers,
      timestamp: Date.now()
    });
    
    // Load player data
    const playerData = await loadPlayerDataFromDB(identifiers.license);
    
    deferrals.done();
    LogToUI(`Player ${name} connected successfully`);
  } catch (error) {
    deferrals.done(`Connection failed: ${error.message}`);
    LogToUI(`Connection failed for ${name}: ${error.message}`, true);
  }
});
```

### Inter-Client Communication Example

```typescript
import { onClient, emitClient, awaitClient } from '@lib/server';

// Handle player interaction requests
onClient('requestInteraction', async (targetPlayerId, interactionType) => {
  const source = global.source;
  
  try {
    // Ask target player if they accept the interaction
    const accepted = await awaitClient('requestInteractionConfirm', targetPlayerId, {
      fromPlayer: source,
      type: interactionType
    });
    
    if (accepted) {
      // Notify both players of successful interaction
      emitClient('interactionStarted', source, {
        partner: targetPlayerId,
        type: interactionType
      });
      
      emitClient('interactionStarted', targetPlayerId, {
        partner: source,
        type: interactionType
      });
    } else {
      emitClient('interactionDeclined', source, targetPlayerId);
    }
  } catch (error) {
    // Target player didn't respond or error occurred
    emitClient('interactionFailed', source, 'Target player did not respond');
  }
});
```

### Socket Integration Example

```typescript
import { onSocket, emitSocket, awaitSocket } from '@lib/server';

// Listen for global server events from socket
onSocket('globalAnnouncement', (message, priority) => {
  // Broadcast to all players
  emitNet('server.announcement', -1, message, priority);
});

// Handle player economy updates
onSocket('economyUpdate', (data) => {
  // Update server-side economy state
  updateEconomyData(data);
  
  // Notify relevant players
  data.affectedPlayers.forEach(playerId => {
    emitClient('economyChanged', playerId, data.changes);
  });
});

// Send server statistics to socket
setInterval(async () => {
  const playerCount = GetNumPlayerIndices();
  const serverInfo = {
    playerCount,
    maxPlayers: GetConvarInt('sv_maxClients', 32),
    uptime: GetGameTimer(),
    timestamp: Date.now()
  };
  
  try {
    await awaitSocket('updateServerStats', serverInfo);
  } catch (error) {
    LogToUI('Failed to update server stats to socket', true);
  }
}, 30000); // Every 30 seconds
```

### Error Handling and Resilience

```typescript
import { onClientCall, LogToUI } from '@lib/server';

// Robust RPC handler with comprehensive error handling
onClientCall('performComplexOperation', async (serverId, operationData) => {
  try {
    // Validate input
    if (!operationData || typeof operationData !== 'object') {
      throw new Error('Invalid operation data provided');
    }
    
    // Perform operation with timeout
    const result = await Promise.race([
      performOperation(operationData),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timeout')), 5000)
      )
    ]);
    
    LogToUI(`Complex operation completed for player ${serverId}`);
    return result;
    
  } catch (error) {
    LogToUI(`Complex operation failed for player ${serverId}: ${error.message}`, true);
    
    // Re-throw with user-friendly message
    if (error.message.includes('timeout')) {
      throw new Error('Operation took too long to complete');
    } else if (error.message.includes('Invalid')) {
      throw new Error('Invalid request data');
    } else {
      throw new Error('Operation failed due to server error');
    }
  }
});
```

---

## Error Handling

### RPC Error Handling

The server library automatically handles RPC errors:

```typescript
// Errors thrown in RPC handlers are automatically caught and sent to clients
onClientCall('riskyOperation', async (serverId) => {
  throw new Error('Something went wrong'); // Automatically sent to client
});
```

### Timeout Management

All client communication includes timeout handling:

```typescript
try {
  const result = await awaitClient('slowClientOperation', playerId);
} catch (error) {
  if (error.message.includes('timeout')) {
    console.log('Client took too long to respond');
  }
}
```

### Resource Availability

Socket communication functions handle resource availability gracefully:

```typescript
// These calls are buffered if the base resource isn't ready
emitSocket('event', data); // Sent when base resource starts
onSocket('handler', callback); // Registered when base resource starts
```

---

This server API reference provides the core server-side functionality for Pioneer Village. For client-side APIs and resource-specific documentation, see the corresponding files in this documentation.
