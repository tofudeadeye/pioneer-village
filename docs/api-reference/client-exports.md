# Pioneer Village Client API Reference

This document provides comprehensive documentation for the Pioneer Village client-side API library exports. The client library provides a robust set of functions for communication, UI management, game functions, and event handling.

## Table of Contents

- [Communication APIs](#communication-apis)
  - [Server Communication](#server-communication)
  - [UI Communication](#ui-communication)
- [Core Functions](#core-functions)
  - [Drawing Functions](#drawing-functions)
- [Game Management](#game-management)
  - [Zone Management](#zone-management)
  - [Resource Lifecycle](#resource-lifecycle)
- [Event System](#event-system)
  - [Event Registration](#event-registration)
- [Resource Exports](#resource-exports)
- [Usage Examples](#usage-examples)

---

## Communication APIs

The communication system provides type-safe, promise-based communication between client, server, and UI components.

### Server Communication

Functions for communicating between client and server resources.

#### `onServerCall<T>(evtName: T, callback: Function): void`

Registers a callback function to handle RPC calls from the server.

**Parameters:**
- `evtName: T` - The name of the RPC event to listen for
- `callback: (serverId: number, ...args: Parameters<RPC[T]>) => ReturnType<RPC[T]> | Promise<ReturnType<RPC[T]>>` - Function to handle the RPC call

**Example:**
```typescript
import { onServerCall } from '@lib/client';

onServerCall('getUserData', async (serverId, userId) => {
  // Handle the RPC call from server
  return { id: userId, name: 'Player' };
});
```

#### `onServer<T>(evtName: T, callback: Function): void`

Registers an event listener for server events.

**Parameters:**
- `evtName: T` - The event name to listen for
- `callback: (...args: Parameters<NetEvents[T]>) => void` - Event handler function

**Example:**
```typescript
import { onServer } from '@lib/client';

onServer('playerJoined', (playerId, playerName) => {
  console.log(`Player ${playerName} joined with ID ${playerId}`);
});
```

#### `awaitServer<T>(evtName: T, ...args): Promise<ReturnType<RPC[T]>>`

Makes an asynchronous RPC call to the server and waits for a response.

**Parameters:**
- `evtName: T` - The RPC event name
- `...args: Parameters<RPC[T]>` - Arguments to pass to the server

**Returns:** `Promise<ReturnType<RPC[T]>>` - Promise that resolves with the server's response

**Example:**
```typescript
import { awaitServer } from '@lib/client';

const userData = await awaitServer('getUserData', playerId);
console.log('Received user data:', userData);
```

#### `emitServer<T>(evtName: T, ...args): void`

Sends an event to the server without expecting a response.

**Parameters:**
- `evtName: T` - The event name
- `...args: Parameters<NetEvents[T]>` - Event arguments

**Example:**
```typescript
import { emitServer } from '@lib/client';

emitServer('playerAction', 'jump', { x: 100, y: 200, z: 300 });
```

### UI Communication

Functions for communicating with the UI layer, including buffering for resource availability.

#### `onUICall<T>(evtName: T, callback: Function): void`

Registers a callback function to handle RPC calls from the UI.

**Parameters:**
- `evtName: T` - The RPC event name
- `callback: Function` - Handler function for the RPC call

**Features:**
- Automatically buffers calls if the UI resource isn't ready
- Registers handlers when the UI resource starts

**Example:**
```typescript
import { onUICall } from '@lib/client';

onUICall('getInventory', async () => {
  return { items: [], slots: 30 };
});
```

#### `onUI<T>(evtName: T, callback: Function): void`

Registers an event listener for UI events.

**Parameters:**
- `evtName: T` - The event name
- `callback: Function` - Event handler function

**Example:**
```typescript
import { onUI } from '@lib/client';

onUI('inventoryUpdated', (newInventory) => {
  console.log('Inventory updated:', newInventory);
});
```

#### `awaitUI<T>(...args): Promise<any>`

Makes an asynchronous call to the UI and waits for a response.

**Parameters:**
- `...args` - Arguments to pass to the UI

**Returns:** `Promise<any>` - Promise that resolves with the UI's response

**Features:**
- Buffers calls if UI resource isn't available
- Automatic resource state checking

**Example:**
```typescript
import { awaitUI } from '@lib/client';

const result = await awaitUI('showDialog', 'Are you sure?', ['Yes', 'No']);
console.log('User selected:', result);
```

#### `emitUI<T>(...args): void`

Sends an event to the UI without expecting a response.

**Parameters:**
- `...args` - Event arguments

**Features:**
- Buffering system for unavailable UI resource
- Automatic flushing when UI becomes available

**Example:**
```typescript
import { emitUI } from '@lib/client';

emitUI('showNotification', 'Welcome to Pioneer Village!', 'success');
```

#### `focusUI<T>(...args): Promise<any>`

Sets focus on the UI and waits for confirmation.

**Parameters:**
- `...args` - Focus parameters

**Returns:** `Promise<any>` - Promise that resolves when focus is set

**Example:**
```typescript
import { focusUI } from '@lib/client';

await focusUI(true); // Enable cursor and focus
// UI is now focused and ready for interaction
```

---

## Core Functions

### Drawing Functions

Low-level drawing utilities for rendering text and graphics in the game world.

#### `DrawLine(x1, y1, z1, x2, y2, z2, red, green, blue, alpha): void`

Draws a 3D line between two points in the game world.

**Parameters:**
- `x1: number` - Start X coordinate
- `y1: number` - Start Y coordinate  
- `z1: number` - Start Z coordinate
- `x2: number` - End X coordinate
- `y2: number` - End Y coordinate
- `z2: number` - End Z coordinate
- `red: number` - Red color component (0-255)
- `green: number` - Green color component (0-255)
- `blue: number` - Blue color component (0-255)
- `alpha: number` - Alpha transparency (0-255)

**Example:**
```typescript
import { DrawLine } from '@lib/client';

// Draw a red line from origin to point (10, 10, 10)
DrawLine(0, 0, 0, 10, 10, 10, 255, 0, 0, 255);
```

#### `DrawTxt(rawString, x, y, size, enableShadow?, r?, g?, b?, a?, centre?, font?): void`

Renders text on the screen at specified coordinates.

**Parameters:**
- `rawString: string` - The text to display
- `x: number` - Screen X position (0.0-1.0)
- `y: number` - Screen Y position (0.0-1.0)
- `size: number` - Font size multiplier
- `enableShadow?: boolean` - Whether to show text shadow (default: true)
- `r?: number` - Red color component (default: 255)
- `g?: number` - Green color component (default: 255)
- `b?: number` - Blue color component (default: 255)
- `a?: number` - Alpha transparency (default: 255)
- `centre?: boolean` - Whether to center the text (default: false)
- `font?: number` - Font ID to use (default: 0)

**Example:**
```typescript
import { DrawTxt } from '@lib/client';

// Draw white text in the center of screen
DrawTxt('Welcome to Pioneer Village', 0.5, 0.5, 1.0, true, 255, 255, 255, 255, true);
```

#### `TxtAtWorldCoord(x, y, z, txt, size, font?, alpha?): void`

Displays text at a 3D world coordinate, automatically handling screen projection.

**Parameters:**
- `x: number` - World X coordinate
- `y: number` - World Y coordinate
- `z: number` - World Z coordinate
- `txt: string` - Text to display
- `size: number` - Font size
- `font?: number` - Font ID (default: 0)
- `alpha?: number` - Text transparency (default: 255)

**Features:**
- Automatic screen coordinate conversion
- Visibility culling when coordinates are off-screen
- HUD position calculation for world coordinates

**Example:**
```typescript
import { TxtAtWorldCoord } from '@lib/client';

// Display text at a world location
TxtAtWorldCoord(1234.5, 5678.9, 100.0, 'Landmark Name', 0.5);
```

---

## Game Management

### Zone Management

Functions for creating and managing interactive zones in the game world.

#### `addZone(data: Zones.ZoneData): void`

Creates a new interactive zone with enter/exit callbacks.

**Parameters:**
- `data: Zones.ZoneData` - Zone configuration object

**Zone Types:**
- `sphere` - Spherical zone with center and radius
- `box` - Box-shaped zone with position, size, and rotation
- `poly` - Polygonal zone with multiple points and height bounds

**Example:**
```typescript
import { addZone } from '@lib/client';

// Create a spherical zone
addZone({
  _type: 'sphere',
  name: 'saloon_entrance',
  coords: { x: 1234.5, y: 5678.9, z: 100.0 },
  radius: 5.0,
  options: {},
  onEnter: () => {
    console.log('Entered the saloon area');
  },
  onExit: () => {
    console.log('Left the saloon area');
  }
});

// Create a box zone
addZone({
  _type: 'box',
  name: 'building_interior',
  coords: { x: 1000.0, y: 2000.0, z: 50.0 },
  size: { x: 20.0, y: 30.0, z: 10.0 },
  rotation: 45.0,
  options: {},
  onEnter: (player) => {
    // Player entered building
  }
});
```

#### `removeZone(name: string): void`

Removes a zone and cleans up its event listeners.

**Parameters:**
- `name: string` - The name of the zone to remove

**Features:**
- Automatic cleanup of enter/exit event listeners
- Removes zone from the game world

**Example:**
```typescript
import { removeZone } from '@lib/client';

removeZone('saloon_entrance');
```

### Resource Lifecycle

Functions for managing resource dependencies and initialization.

#### `onResourceStart(resourceName: string, callback: Function): void`

Executes a callback when a specific resource starts, or immediately if already started.

**Parameters:**
- `resourceName: string` - Name of the resource to monitor
- `callback: () => void` - Function to execute when resource starts

**Features:**
- Immediate execution if resource is already running
- Automatic monitoring for resource start events

**Example:**
```typescript
import { onResourceStart } from '@lib/client';

onResourceStart('ui', () => {
  console.log('UI resource is ready');
  // Initialize UI-dependent features
});
```

#### `onResourceInit(resourceName: string, callback: Function): void`

Executes a callback when a resource is fully initialized (not just started).

**Parameters:**
- `resourceName: string` - Name of the resource to monitor
- `callback: () => void` - Function to execute when resource is initialized

**Features:**
- Waits for complete resource initialization, not just startup
- Uses the PVInit system for accurate initialization tracking

**Example:**
```typescript
import { onResourceInit } from '@lib/client';

onResourceInit('game', () => {
  console.log('Game resource is fully initialized');
  // Safe to use game features
});
```

---

## Event System

### Event Registration

The PVEvents system provides a structured way to handle game events with automatic type conversion.

#### `PVEvents.register(event: EventsManager.EventName, callback: Function): void`

Registers a callback for specific game events with automatic data parsing.

**Parameters:**
- `event: EventsManager.EventName` - The event type to listen for
- `callback: (data: Record<string, number>) => void` - Event handler function

**Supported Events:**
- `EVENT_ENTITY_DAMAGED` - When an entity takes damage
- `EVENT_ENTITY_DESTROYED` - When an entity is destroyed  
- `EVENT_ENTITY_EXPLOSION` - When an explosion affects entities
- `weapon` - Weapon-related events

**Features:**
- Automatic integer to float conversion for position data
- Structured data parsing based on event type
- Automatic registration with the events manager

**Example:**
```typescript
import { PVEvents } from '@lib/client';

// Listen for entity damage events
PVEvents.register('EVENT_ENTITY_DAMAGED', (data) => {
  console.log('Entity damaged:', {
    attacked: data.attacked,
    attacker: data.attacker,
    damage: data.damage, // Automatically converted to float
    position: { x: data.x, y: data.y, z: data.z }
  });
});

// Listen for explosion events
PVEvents.register('EVENT_ENTITY_EXPLOSION', (data) => {
  console.log('Explosion at:', data.x, data.y, data.z);
});
```

---

## Resource Exports

Pioneer Village provides access to various resource exports through a centralized system.

### Available Resource Exports

```typescript
import { 
  PVInit,           // Initialization system
  PVBase,           // Base functionality
  PVCamera,         // Camera controls
  PVEventsManager,  // Event management
  PVGame,           // Game mechanics
  PVHealth,         // Health system
  PVPrompt,         // Prompt system
  PVPlaceObject,    // Object placement
  PVTarget,         // Targeting system
  PVKeymapper,      // Key mapping
  PVDatabindings,   // Data binding
  PVDoors,          // Door system
  PVZone,           // Zone management
  PVCustomization   // Character customization
} from '@lib/client';
```

Each resource export provides access to the underlying resource's exported functions.

---

## Usage Examples

### Complete Communication Example

```typescript
import { 
  onServerCall, 
  awaitServer, 
  emitUI, 
  onUI, 
  focusUI 
} from '@lib/client';

// Set up server communication
onServerCall('requestPlayerData', async (serverId, playerId) => {
  // Fetch player data from client-side cache or game state
  return {
    id: playerId,
    position: GetEntityCoords(PlayerPedId()),
    health: GetEntityHealth(PlayerPedId())
  };
});

// Handle UI events
onUI('openInventory', async () => {
  try {
    // Get inventory data from server
    const inventory = await awaitServer('getPlayerInventory');
    
    // Show inventory UI
    emitUI('showInventory', inventory);
    
    // Focus the UI for interaction
    await focusUI(true);
  } catch (error) {
    console.error('Failed to open inventory:', error);
  }
});
```

### Zone and Event Management Example

```typescript
import { addZone, removeZone, PVEvents } from '@lib/client';

// Create an interactive shop zone
addZone({
  _type: 'sphere',
  name: 'general_store',
  coords: { x: 2805.78, y: -1205.35, z: 43.86 },
  radius: 3.0,
  options: {},
  onEnter: () => {
    emitUI('showHelpText', 'Press E to browse the store');
  },
  onExit: () => {
    emitUI('hideHelpText');
  }
});

// Listen for damage events in the store
PVEvents.register('EVENT_ENTITY_DAMAGED', (data) => {
  // Check if damage occurred near the store
  const storePos = vector3(2805.78, -1205.35, 43.86);
  const damagePos = vector3(data.x, data.y, data.z);
  
  if (Vdist(storePos, damagePos) < 10.0) {
    console.log('Violence near the store!');
    emitServer('reportViolence', 'general_store', data);
  }
});

// Clean up when done
// removeZone('general_store');
```

### Drawing and UI Example

```typescript
import { DrawTxt, TxtAtWorldCoord, emitUI } from '@lib/client';

// Display a HUD element
setTick(() => {
  const playerPos = GetEntityCoords(PlayerPedId());
  
  // Show coordinates on screen
  DrawTxt(
    `Position: ${playerPos[0].toFixed(1)}, ${playerPos[1].toFixed(1)}, ${playerPos[2].toFixed(1)}`,
    0.05, 0.05, 0.4, true, 255, 255, 255, 200
  );
  
  // Show text at world location
  TxtAtWorldCoord(
    playerPos[0], 
    playerPos[1], 
    playerPos[2] + 2.0,
    'You are here',
    0.35
  );
});

// Send location updates to UI
setInterval(() => {
  const pos = GetEntityCoords(PlayerPedId());
  emitUI('updatePlayerPosition', { x: pos[0], y: pos[1], z: pos[2] });
}, 1000);
```

---

## Error Handling

The Pioneer Village client library includes robust error handling:

### RPC Timeouts

All `await*` functions include automatic timeout handling (10 seconds by default):

```typescript
try {
  const result = await awaitServer('slowOperation');
} catch (error) {
  if (error.message.includes('timeout')) {
    console.log('Server took too long to respond');
  }
}
```

### Resource Availability

Communication functions automatically handle resource availability:

```typescript
// These calls are buffered if the UI resource isn't ready
emitUI('message', 'This will be sent when UI is available');
onUICall('handler', callback); // Will be registered when UI starts
```

### Event Cleanup

Zone and event management includes automatic cleanup:

```typescript
// Event listeners are automatically cleaned up when zones are removed
removeZone('my_zone'); // Removes enter/exit listeners automatically
```

---

This API reference covers the core client-side functionality available in Pioneer Village. For server-side APIs and additional resources, see the corresponding documentation files.
