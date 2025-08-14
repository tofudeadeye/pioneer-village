# Pioneer Village API Reference

This directory contains comprehensive API documentation for the Pioneer Village library system. The library provides a robust foundation for building FiveM resources with type-safe communication, event handling, and utility functions.

## Documentation Structure

### Core API References

- **[Client Exports](./client-exports.md)** - Complete client-side API reference
  - Communication APIs (Server, UI, Socket)
  - Drawing and rendering functions
  - Zone and event management
  - Resource lifecycle management
  
- **[Server Exports](./server-exports.md)** - Complete server-side API reference
  - Client communication functions
  - Socket communication
  - Player management utilities
  - Logging and debugging tools

## Quick Start

### Client-Side Usage

```typescript
import { 
  onServerCall, 
  awaitServer, 
  emitUI, 
  addZone,
  PVEvents 
} from '@lib/client';

// Set up server communication
onServerCall('getUserData', async (serverId, userId) => {
  return { id: userId, name: 'Player' };
});

// Create interactive zones
addZone({
  _type: 'sphere',
  name: 'shop',
  coords: { x: 100, y: 200, z: 30 },
  radius: 5.0,
  onEnter: () => emitUI('showShop'),
  onExit: () => emitUI('hideShop')
});

// Handle game events
PVEvents.register('EVENT_ENTITY_DAMAGED', (data) => {
  console.log('Entity damaged:', data);
});
```

### Server-Side Usage

```typescript
import { 
  onClientCall, 
  awaitClient, 
  emitSocket,
  getIdentifiers 
} from '@lib/server';

// Handle client requests
onClientCall('getInventory', async (serverId, playerId) => {
  const identifiers = getIdentifiers(serverId);
  return await loadInventoryFromDB(identifiers.license);
});

// Send data to socket server
emitSocket('playerConnected', {
  serverId: source,
  identifiers: getIdentifiers(source)
});
```

## Key Features

### Type-Safe Communication

The library provides full TypeScript support with type-safe ClientRPC.Server calls:

```typescript
// Types are enforced across client/server boundaries
const result = await awaitServer('typedRpcCall', param1, param2);
//    ^^^^^^ Automatically typed based on ClientRPC.Server definition
```

### Automatic Resource Management

Communication functions handle resource availability automatically:

```typescript
// These calls are buffered if target resource isn't ready
emitUI('message', data); // Sent when UI resource starts
emitSocket('event', data); // Sent when base resource starts
```

### Robust Error Handling

Built-in timeout and error handling for all async operations:

```typescript
try {
  const result = await awaitClient('operation', playerId);
} catch (error) {
  // Automatic timeout after 10 seconds
  // Error messages provide context
}
```

### Event System Integration

Seamless integration with FiveM's event system plus enhanced game event handling:

```typescript
// Standard FiveM events
onServer('playerJoined', (playerId) => { });

// Enhanced game events with structured data
PVEvents.register('EVENT_ENTITY_DAMAGED', (data) => {
  // Automatic data parsing and type conversion
});
```

## API Categories

### Communication
- **ClientRPC.Server (Remote Procedure Calls)**: Type-safe, promise-based function calls
- **Events**: Traditional event-based messaging
- **Buffering**: Automatic queuing when resources aren't available

### UI Integration
- **UI Communication**: Direct communication with React-based UI
- **Focus Management**: Cursor and input focus control
- **Event Forwarding**: Seamless event passing to UI layer

### Game World
- **Zone Management**: Interactive areas with enter/exit callbacks
- **Drawing Functions**: Text and line rendering in game world
- **Event Handling**: Structured game event processing

### Resource Management
- **Lifecycle Hooks**: Resource start/stop/init callbacks
- **Export Access**: Centralized access to all resource exports
- **Dependency Management**: Safe cross-resource communication

## Best Practices

### Error Handling

Always wrap async calls in try-catch blocks:

```typescript
try {
  const result = await awaitServer('riskOperation');
  // Handle success
} catch (error) {
  console.error('Operation failed:', error.message);
  // Handle failure gracefully
}
```

### Resource Dependencies

Use lifecycle hooks for safe resource dependencies:

```typescript
onResourceInit('requiredResource', () => {
  // Safe to use requiredResource features
  initializeMyFeatures();
});
```

### Zone Cleanup

Always clean up zones when they're no longer needed:

```typescript
// Create zone
addZone({ name: 'tempZone', /* ... */ });

// Clean up later
removeZone('tempZone'); // Automatically removes event listeners
```

### Type Safety

Define your ClientRPC.Server and event interfaces for better development experience:

```typescript
declare namespace ClientRPC {
  interface Server {
    getUserData: (userId: number) => { id: number; name: string };
    saveUserData: (userData: UserData) => boolean;
  }
}

declare namespace ClientIn {
  interface FromServer {
    playerAction: (action: string, data: any) => void;
    serverAnnouncement: (message: string) => void;
  }
}

declare namespace ClientOut {
  interface ToServer {
    playerAction: (action: string, data: any) => void;
    serverAnnouncement: (message: string) => void;
  }
}
```

## Common Patterns

### Client-Server Data Flow

```typescript
// Client requests data
const userData = await awaitServer('getUserData', playerId);

// Server handles request
onServerCall('getUserData', async (serverId, playerId) => {
  return await fetchUserData(playerId);
});
```

### UI State Management

```typescript
// Update UI state
emitUI('updatePlayerStats', { health: 100, money: 5000 });

// Handle UI responses
const confirmed = await awaitUI('showConfirmDialog', 'Are you sure?');
```

### Event Propagation

```typescript
// Client event -> Server -> All clients
onClient('playerAction', (action, data) => {
  // Process on server
  processAction(action, data);
  
  // Notify all clients
  emitNet('actionProcessed', -1, action, data);
});
```

## Migration Guide

### From Direct emitNet/onNet

```typescript
// Old way
emitNet('myEvent', playerId, data);
onNet('myEvent', (data) => { });

// New way (type-safe)
emitClient('myEvent', playerId, data);
onClient('myEvent', (data) => { });
```

### From Manual Resource Checks

```typescript
// Old way
if (GetResourceState('ui') === 'started') {
  exports['ui'].someFunction();
}

// New way (automatic buffering)
emitUI('someEvent', data); // Automatically sent when ready
```

## Support and Troubleshooting

### Common Issues

1. **ClientRPC.Server Timeouts**: Check that the target resource is running and handling the call
2. **Type Errors**: Ensure ClientRPC.Server interfaces are properly declared
3. **Resource Not Found**: Verify resource names and dependencies

### Debug Logging

Use the built-in logging functions for debugging:

```typescript
// Client-side
import { Log, LogExtra } from '@lib/client/comms/ui';
Log('Debug message'); // Sent to UI log
LogExtra('Debug with console'); // Both UI and console

// Server-side
import { LogToUI } from '@lib/server/comms/client';
LogToUI('Server debug message', true); // UI and console
```

### Performance Considerations

- Use `emitUI` for fire-and-forget UI updates
- Use `awaitUI` only when you need a response
- Clean up zones and event listeners when not needed
- Batch related operations when possible

---

For specific function documentation and examples, see the individual API reference files.
