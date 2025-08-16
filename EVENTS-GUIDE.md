# Pioneer Village - Event System Guide

This guide provides a comprehensive overview of the communication and event system used throughout the Pioneer Village codebase. It documents all data flow patterns, typing requirements, and implementation steps needed to add new communication channels.

## Architecture Overview

The Pioneer Village event system uses a four-layer architecture for communication:

```
┌─────────────────┐                    ┌─────────────────┐
│  Game Client    │◄──────────────────►│   Game Server   │
│   Resources     │                    │                 │
└─────────┬───────┘                    └─────────┬───────┘
          │                                      │
          ▼                                      ▼
┌─────────────────┐                    ┌─────────────────┐
│   UI Layer      │◄──────────────────►│  Socket Server  │
│     (NUI)       │                    │   (Database)    │
└─────────────────┘                    └─────────────────┘
```

### Communication Channels

1. **Client ↔ Server**: Game logic, player state, native calls
2. **Client ↔ UI**: Interface updates, user interactions  
3. **Client ↔ Socket**: Data persistence (via UI forwarding)
4. **Server ↔ Socket**: Data persistence, cross-server communication
5. **Socket Broadcasting**: Real-time updates to all connected clients

### Special Event Patterns

#### The `__client__` Event
Socket server uses a special `__client__` event to broadcast to all UI clients:
```typescript
// In socket controllers
userNamespace.emit('__client__', 'actual-event-name', ...eventData);

// Automatically forwarded to all game clients via UI controllers
// No additional code needed - handled by the base UI system
```

#### UI Controller Registration
All UI controllers must be registered in `resources/ui/src/ui/app/index.tsx`:
```typescript
import MyResourceController from './controllers/my-resource';

// Register controller
MyResourceController(socket);
```

## Communication Functions Reference

### Client Side Functions

#### Client to Game Server (`@lib/client/comms/server.ts`)

| Function | Type | Description | Usage |
|----------|------|-------------|-------|
| `onServerCall` | RPC Listener | Listen for server RPC calls with callback | `onServerCall('event', (serverId, ...args) => result)` |
| `emitServer` | Event | Send event to server | `emitServer('event', ...args)` |
| `onServer` | Event Listener | Listen for server events | `onServer('event', (...args) => {})` |
| `awaitServer` | RPC Call | Make RPC call to server | `const result = await awaitServer('event', ...args)` |

#### Client to UI (`@lib/client/comms/ui.ts`)

| Function | Type | Description | Usage |
|----------|------|-------------|-------|
| `emitUI` | Event | Send data to UI | `emitUI('event', data)` |
| `awaitUI` | RPC Call | Make RPC call to UI | `const result = await awaitUI('event', ...args)` |
| `onUI` | Event Listener | Listen for UI events | `onUI('event', (data) => {})` |
| `onUICall` | RPC Listener | Listen for UI RPC calls | `onUICall('event', (...args) => result)` |
| `focusUI` | Control | Set UI focus state | `focusUI(hasFocus, hasCursor)` |
| `emitSocket` | Event | Send to socket via UI | `emitSocket('event', ...args)` |
| `onSocket` | Event Listener | Listen for socket events | `onSocket('event', (data) => {})` |

### Server Side Functions

#### Server to Client (`@lib/server/comms/client.ts`)

| Function | Type | Description | Usage |
|----------|------|-------------|-------|
| `onClientCall` | RPC Listener | Listen for client RPC calls | `onClientCall('event', (serverId, ...args) => result)` |
| `emitClient` | Event | Send event to client(s) | `emitClient('event', ...args)` |
| `onClient` | Event Listener | Listen for client events | `onClient('event', (serverId, ...args) => {})` |
| `awaitClient` | RPC Call | Make RPC call to specific client | `const result = await awaitClient('event', serverId, ...args)` |

#### Server to Socket (`@lib/server/comms/socket.ts`)

| Function | Type | Description | Usage |
|----------|------|-------------|-------|
| `emitSocket` | Event | Send event to socket server | `emitSocket('event', ...args)` |
| `awaitSocket` | RPC Call | Make RPC call to socket server | `const result = await awaitSocket('event', ...args)` |
| `onSocket` | Event Listener | Listen for socket events | `onSocket('event', (data) => {})` |

### Socket Server Functions

#### Socket Namespace Communication (`socket/src/controllers/*.ts`)

| Function | Type | Description | Usage | Files |
|----------|------|-------------|-------|-------|
| `userNamespace.emit` | Broadcast | Send to all UI clients | `userNamespace.emit('__client__', 'event', ...args)` | `./socket/src/controllers/**/*.ts` |
| `serverNamespace.emit` | Broadcast | Send to all game servers | `serverNamespace.emit('event', ...args)` | `./socket/src/controllers/**/*.ts` |
| `socket.on` | Event Listener | Listen on user socket | `socket.on('event', (data, cb) => {})` | `./socket/src/controllers/**/*.ts` |
| `socket.emit` | Direct Send | Send to specific client | `socket.emit('event', data)` | `./socket/src/controllers/**/*.ts` |

#### UI Controller Functions (`resources/ui/src/ui/app/controllers/*.ts`)

| Function | Type | Description | Usage | Files |
|----------|------|-------------|-------|-------|
| `emitClient` | Forward to Client | Forward socket event to client | `emitClient('event', ...args)` | `./resources/ui/src/ui/app/controllers/**/*.ts` |
| `onClientCall` | RPC Handler | Handle client RPC calls via UI | `onClientCall('event', (...args) => Promise)` | `./resources/ui/src/ui/app/controllers/**/*.ts` |
| `socket.on` | Socket Listener | Listen to socket events | `socket.on('event', (...args) => {})` | `./resources/ui/src/ui/app/controllers/**/*.ts` |
| `socket.emit` | Socket Call | Call socket with callback | `socket.emit('event', data, (result) => {})` | `./resources/ui/src/ui/app/controllers/**/*.ts` |

### Legacy FXServer Functions

#### Native FXServer Communication

| Function | Type | Description | Usage | Files |
|----------|------|-------------|-------|-------|
| `onNet` | Event Listener | FXServer native event listener | `onNet('event', (source, ...args) => {})` | `./resources/**/src/server/server.ts`, `./resources/**/src/client/client.ts` |
| `emitNet` | Event Send | FXServer native event emitter | `emitNet('event', target, ...args)` | `./resources/**/src/server/server.ts`, `./resources/**/src/client/client.ts` |
| `TriggerEvent` | Local Event | Trigger local event | `TriggerEvent('event', ...args)` | Legacy Lua files |
| `TriggerClientEvent` | Server→Client | Server to client event | `TriggerClientEvent('event', source, ...args)` | Legacy Lua files |
| `TriggerServerEvent` | Client→Server | Client to server event | `TriggerServerEvent('event', ...args)` | Legacy Lua files |

## Data Flow Patterns

### 1. Client → Server

**Use Case**: Game logic, player actions, native function calls

**Implementation Steps**:

1. **Client Side** (`resources/[type]/resource-name/src/client/client.ts`):
```typescript
import { awaitServer, emitServer, onServer } from '@lib/client/comms/server';

// RPC call to server
const playerData = await awaitServer('my-resource.get-player-data', playerId);

// Event to server
emitServer('my-resource.player-action', actionData);

// Listen for server events
onServer('my-resource.state-update', (newState) => {
  // Handle state update
});
```

2. **Server Side** (`resources/[type]/resource-name/src/server/server.ts`):
```typescript
import { onClientCall, emitClient, onClient } from '@lib/server/comms/client';

// Handle RPC from client
onClientCall('my-resource.get-player-data', async (serverId, playerId) => {
  // Return data to client
  return await getPlayerData(playerId);
});

// Listen for client events
onClient('my-resource.player-action', (serverId, actionData) => {
  // Handle action
});

// Send event to client
emitClient('my-resource.state-update', serverId, newState);
```

3. **Type Definitions** (`resources/[type]/resource-name/src/types.d.ts`):
```typescript
declare namespace MyResource {
  namespace Events {
    type PlayerAction = (actionData: ActionData) => void;
    type StateUpdate = (newState: PlayerState) => void;
  }
  
  type GetPlayerData = (playerId: number) => Promise<PlayerData>;
}

declare interface ClientExports {
  'my-resource': MyResource.ClientExports;
}

declare interface ServerExports {
  'my-resource': MyResource.ServerExports;
}
```

### 2. Client → UI

**Use Case**: Interface updates, user interactions, HUD updates

**Implementation Steps**:

1. **Client Side**:
```typescript
import { emitUI, awaitUI, onUI } from '@lib/client/comms/ui';

// Send data to UI
emitUI('my-resource.update-hud', { health: 100, food: 80 });

// Get data from UI (RPC)
const selectedOption = await awaitUI('my-resource.show-menu', menuOptions);

// Listen for UI events
onUI('my-resource.button-clicked', (buttonId) => {
  // Handle button click
});
```

2. **UI Side** (`resources/ui/src/ui/app/layers/my-resource/index.tsx`):
```typescript
import { useCallback } from 'react';
import { emitClient, onClient } from '@lib/ui';

export default function MyResourceLayer() {
  const handleButtonClick = useCallback((buttonId: string) => {
    emitClient('my-resource.button-clicked', buttonId);
  }, []);

  // Component logic
  return <div>...</div>;
}
```

3. **Type Definitions**:
```typescript
declare namespace ClientIn {
  interface FromUI {
    ['my-resource.update-hud']: (data: HudData) => void;
    ['my-resource.button-clicked']: (buttonId: string) => void;
  }
}

declare namespace ClientRPC {
  interface UI {
    ['my-resource.show-menu']: (options: MenuOption[]) => string;
  }
}
```

### 3. Client → Socket (via UI)

**Use Case**: Data persistence, cross-character data

**Implementation Steps**:

1. **Client Side**:
```typescript
import { emitSocket, onSocket, awaitUI } from '@lib/client/comms/ui';

// Send data to socket server
emitSocket('my-resource.save-data', characterId, gameData);

// Get data from socket server (via UI RPC)
const savedData = await awaitUI('my-resource.load-data', characterId);

// Listen for socket events
onSocket('my-resource.data-updated', (characterId, newData) => {
  // Handle data update
});
```

2. **UI Controller** (`resources/ui/src/ui/app/controllers/my-resource.ts`):
```typescript
import { Socket } from 'socket.io-client';
import { emitClient, onClientCall } from '@lib/ui';

export default (socket: Socket<SocketOut.ToClient, SocketIn.FromClient>) => {
  // Forward socket events to client
  socket.on('my-resource.data-updated', (characterId, newData) => {
    emitClient('my-resource.data-updated', characterId, newData);
  });

  // Handle client RPC calls to socket
  onClientCall('my-resource.load-data', (characterId) => {
    return new Promise((resolve) => {
      socket.emit('my-resource.load-data', characterId, (data) => {
        resolve(data);
      });
    });
  });
};
```

3. **Socket Controller** (`socket/src/controllers/my-resource.ts`):
```typescript
import { userNamespace } from '../server';
import MyResourceManager from '../managers/my-resource';

export default () => {
  userNamespace.on('connection', (socket) => {
    socket.on('my-resource.save-data', async (characterId, gameData) => {
      await MyResourceManager.saveData(characterId, gameData);
    });

    socket.on('my-resource.load-data', async (characterId, callback) => {
      const data = await MyResourceManager.loadData(characterId);
      callback(data);
    });
  });
};
```

4. **Socket Types** (`socket/src/types/my-resource.d.ts`):
```typescript
declare interface SocketIn {
  FromClient: {
    ['my-resource.save-data']: (characterId: number, gameData: GameData) => void;
    ['my-resource.load-data']: (characterId: number, callback: (data: GameData) => void) => void;
  }
}

declare interface SocketOut {
  ToClient: {
    ['my-resource.data-updated']: (characterId: number, newData: GameData) => void;
  }
}
```

5. **Client Types**:
```typescript
declare interface ClientForwardEvents {
  ['my-resource.data-updated']: MyResource.Events.DataUpdated;
}

declare interface SocketForwardEvents {
  ['my-resource.data-updated']: MyResource.Events.DataUpdated;
}

declare namespace ClientRPC {
  interface UI {
    ['my-resource.load-data']: (characterId: number) => GameData;
  }
}
```

### 4. Socket Namespace Broadcasting

**Use Case**: Broadcasting events to all connected clients, real-time updates

**Implementation Steps**:

1. **Socket Controller** (`socket/src/controllers/my-resource.ts`):
```typescript
import { logInfoC, logInfoS } from '../helpers/log';
import { serverNamespace, userNamespace } from '../server';

export default () => {
  serverNamespace.on('connection', (socket) => {
    logInfoS('[MyResource]', 'Game server connected');

    socket.on('my-resource.register', async (data, cb = () => {}) => {
      // Handle registration logic
      const result = await processRegistration(data);
      cb(result);
      
      // Broadcast to all UI clients
      userNamespace.emit('__client__', 'my-resource.registration-update', data);
    });
  });

  userNamespace.on('connection', (socket) => {
    logInfoC('[MyResource]', 'User connected', socket.data);

    socket.on('my-resource.user-action', async (actionData, cb = () => {}) => {
      // Process user action
      const result = await processUserAction(socket.data.character.id, actionData);
      cb(result);
      
      // Broadcast update to all clients
      userNamespace.emit('__client__', 'my-resource.action-update', socket.data.character.id, result);
    });
  });
};
```

2. **UI Controller** (`resources/ui/src/ui/app/controllers/my-resource.ts`):
```typescript
import { Socket } from 'socket.io-client';
import { emitClient, onClientCall } from '@lib/ui';

export default (socket: Socket<SocketOut.ToClient, SocketIn.FromClient>) => {
  // Forward socket broadcasts to client
  socket.on('my-resource.registration-update', (data) => {
    emitClient('my-resource.registration-update', data);
  });

  socket.on('my-resource.action-update', (characterId, result) => {
    emitClient('my-resource.action-update', characterId, result);
  });

  // Handle client RPC calls
  onClientCall('my-resource.perform-action', (actionData) => {
    return new Promise((resolve) => {
      socket.emit('my-resource.user-action', actionData, (result) => {
        resolve(result);
      });
    });
  });
};
```

3. **Client Side** (`resources/[core]/my-resource/src/client/client.ts`):
```typescript
import { onUI, awaitUI } from '@lib/client/comms/ui';

class MyResourceClient {
  constructor() {
    // Listen for socket broadcasts
    onUI('my-resource.registration-update', (data) => {
      this.handleRegistrationUpdate(data);
    });

    onUI('my-resource.action-update', (characterId, result) => {
      this.handleActionUpdate(characterId, result);
    });
  }

  async performAction(actionData: ActionData): Promise<ActionResult> {
    return await awaitUI('my-resource.perform-action', actionData);
  }
}
```

### 5. Server → Socket

**Use Case**: Server-initiated data persistence, automated systems

**Implementation Steps**:

1. **Server Side**:
```typescript
import { emitSocket, awaitSocket, onSocket } from '@lib/server/comms/socket';

// Send data to socket
emitSocket('my-resource.server-save', serverId, serverData);

// Get data from socket
const result = await awaitSocket('my-resource.server-query', queryParams);

// Listen for socket events
onSocket('my-resource.global-update', (updateData) => {
  // Handle global update
});
```

2. **Socket Controller**:
```typescript
import { serverNamespace } from '../server';

export default () => {
  serverNamespace.on('connection', (socket) => {
    socket.on('my-resource.server-save', async (serverId, serverData) => {
      await MyResourceManager.saveServerData(serverId, serverData);
    });

    socket.on('my-resource.server-query', async (queryParams, callback) => {
      const result = await MyResourceManager.query(queryParams);
      callback(result);
    });
  });
};
```

3. **Socket Types**:
```typescript
declare interface SocketIn {
  FromGameServer: {
    ['my-resource.server-save']: (serverId: number, serverData: ServerData) => void;
    ['my-resource.server-query']: (queryParams: QueryParams, callback: (result: QueryResult) => void) => void;
  }
}

declare interface SocketOut {
  ToGameServer: {
    ['my-resource.global-update']: (updateData: UpdateData) => void;
  }
}
```

## Event Naming Conventions

### 1. Resource Prefixing
All events must be prefixed with the resource name:
- ✅ `jobs.clock-in`
- ✅ `doors.set-door-state`
- ❌ `clock-in` (missing prefix)

### 2. Action-Based Naming
Use clear action verbs in param-case:
- **State Operations**: `.get-state`, `.set-state`, `.state`
- **CRUD Operations**: `.create`, `.update`, `.delete`, `.get-*`
- **User Actions**: `.clock-in`, `.use-item`, `.choose`
- **Data Flow**: `.update`, `.change`, `.load`

### 3. Hierarchical Structure
Use dot notation for logical grouping:
- `character-select.choose`, `character-select.create`
- `inventory.get-items`, `inventory.use-item`
- `health.get-status`, `health.update-status`

## Type System Integration

### 1. Event Type Definitions
Each resource must define event types in its namespace:

```typescript
declare namespace MyResource {
  namespace Events {
    type StateUpdate = (newState: ResourceState) => void;
    type ActionComplete = (actionId: string, result: ActionResult) => void;
  }
}
```

### 2. Interface Declarations
Events must be declared in appropriate interfaces:

```typescript
// For UI events
declare namespace ClientIn {
  interface FromUI {
    ['my-resource.state-update']: MyResource.Events.StateUpdate;
  }
}

// For client forwarded events
declare interface ClientForwardEvents {
  ['my-resource.action-complete']: MyResource.Events.ActionComplete;
}

// For socket forwarded events  
declare interface SocketForwardEvents {
  ['my-resource.action-complete']: MyResource.Events.ActionComplete;
}

// For RPC calls
declare namespace ClientRPC {
  interface UI {
    ['my-resource.get-data']: (params: QueryParams) => DataResult;
  }
}
```

### 3. Socket Type Definitions
Socket events require separate type files:

```typescript
// socket/src/types/my-resource.d.ts
declare interface SocketIn {
  FromClient: {
    ['my-resource.save']: (data: SaveData) => void;
  }
  FromGameServer: {
    ['my-resource.query']: (params: QueryParams, cb: (result: QueryResult) => void) => void;
  }
}

declare interface SocketOut {
  ToClient: {
    ['my-resource.notify']: (notification: NotificationData) => void;
  }
  ToGameServer: {
    ['my-resource.broadcast']: (message: BroadcastData) => void;
  }
}
```

## Error Handling and Best Practices

### 1. RPC Timeout Handling
All RPC calls include automatic timeout handling (10 seconds default):

```typescript
// Automatic timeout in awaitServer/awaitClient/awaitUI
const result = await awaitServer('my-resource.get-data', params);
// Will throw timeout error if no response in 10 seconds
```

### 2. Resource Load Order
The system includes buffering for resources that may not be loaded yet:

```typescript
// Events are buffered until target resource starts
emitUI('my-resource.update', data); // Buffered if UI not ready
onUI('my-resource.event', handler);  // Registered when UI starts
```

### 3. Error Propagation
RPC calls properly propagate errors:

```typescript
onClientCall('my-resource.risky-operation', async (serverId, data) => {
  try {
    return await performRiskyOperation(data);
  } catch (error) {
    throw error; // Will be sent back to client as error
  }
});
```

### 4. Type Safety
Always use typed functions with proper type parameters:

```typescript
// Good: Typed RPC call
const result = await awaitUI<GameData>('my-resource.get-data', playerId);

// Good: Typed event listener
onServer('my-resource.update', (data: UpdateData) => {
  // data is properly typed
});
```

## Quick Reference Checklist

When adding a new event or data flow:

### ✅ Implementation Checklist

1. **Choose the correct communication pattern**:
   - Client ↔ Server: Game logic, native calls
   - Client ↔ UI: Interface updates, user input
   - Client ↔ Socket: Data persistence (via UI)
   - Server ↔ Socket: Server data persistence

2. **Follow naming conventions**:
   - Resource prefix: `my-resource.event-name`
   - Param-case format: `get-player-data` not `getPlayerData`
   - Clear action verbs: `create`, `update`, `delete`, `get-*`

3. **Add proper type definitions**:
   - Event types in resource namespace
   - Interface declarations (ClientIn.FromUI, ClientRPC.UI, etc.)
   - Socket types in separate files

4. **Implement both sides**:
   - Sender: Use appropriate emit/await function
   - Receiver: Use appropriate on/onCall function
   - UI Controller: Forward events between client and socket

5. **Test error handling**:
   - RPC timeouts work correctly
   - Errors are properly propagated
   - Resource load order doesn't break functionality

### 🚫 Common Mistakes to Avoid

- ❌ Missing resource prefix in event names
- ❌ Using camelCase instead of param-case for events
- ❌ Forgetting to add UI controller forwarding for socket events
- ❌ Missing type definitions in appropriate interfaces
- ❌ Not handling RPC errors properly
- ❌ Using wrong communication pattern for the use case
- ❌ Forgetting to register UI controllers in `index.tsx`
- ❌ Not using the `__client__` pattern for socket broadcasts

## File Pattern Reference

### Where Each Communication Pattern is Used

#### `userNamespace.emit('__client__', ...)`
- **Files**: `./socket/src/controllers/**/*.ts`
- **Purpose**: Broadcasting events from socket server to all UI clients
- **Example**: Jobs system broadcasting clock-in updates to all players

#### `serverNamespace.emit(...)`
- **Files**: `./socket/src/controllers/**/*.ts`
- **Purpose**: Broadcasting events from socket server to all game servers
- **Example**: Character data updates that need to reach all servers

#### `emitClient(...)` in UI Controllers
- **Files**: `./resources/ui/src/ui/app/controllers/**/*.ts`
- **Purpose**: Forwarding socket events to game clients
- **Example**: Forwarding door state changes to client resources

#### `onClientCall(...)` in UI Controllers
- **Files**: `./resources/ui/src/ui/app/controllers/**/*.ts`
- **Purpose**: Handling RPC calls from clients to socket server
- **Example**: Client requesting job data via UI layer

#### `emitSocket(...)` in Server Resources
- **Files**: `./resources/**/src/server/server.ts`, `./resources/[core]/*/src/server/server.ts`
- **Purpose**: Server resources sending data to socket server
- **Example**: Job registration from server to socket database

#### `emitUI(...)/awaitUI(...)` in Client Resources
- **Files**: `./resources/**/src/client/client.ts`, `./resources/[core]/*/src/client/client.ts`
- **Purpose**: Client resources communicating with UI layer
- **Example**: Showing job menus, getting user input

#### `onNet(...)/emitNet(...)` 
- **Files**: `./resources/**/src/server/server.ts`, `./resources/**/src/client/client.ts`
- **Purpose**: Native FXServer communication between client and server
- **Example**: Legacy job registration events

#### Legacy Lua Patterns
- **Files**: `./resources/[3rdparty]/**/*.lua`, `./resources/**/client/*.lua`
- **Purpose**: Third-party resources and legacy code
- **Example**: Voice system, older door scripts

## Complete Communication Flow Examples

### Real-Time Job Update Flow
1. **Player clocks in** (`client.ts`) → `awaitUI('jobs.clock-in', ...)`
2. **UI forwards to socket** (`controllers/jobs.ts`) → `socket.emit('jobs.clock-in', ...)`
3. **Socket processes** (`socket/controllers/jobs.ts`) → Updates database
4. **Socket broadcasts** → `userNamespace.emit('__client__', 'jobs.clock-in-update', ...)`
5. **UI receives broadcast** → Automatic forwarding via `'__client__'` handler
6. **All clients updated** → `onUI('jobs.clock-in-update', ...)` in all client resources

### Server-Initiated Job Creation
1. **Server registers job** (`server.ts`) → `emitSocket('jobs.register-job', ...)`
2. **Socket processes** (`socket/controllers/jobs.ts`) → Saves to database
3. **Socket broadcasts** → `userNamespace.emit('__client__', 'jobs.job-created', ...)`
4. **All UIs updated** → Job appears in all player interfaces automatically

This guide provides everything needed to understand and extend the Pioneer Village event system. For specific examples, refer to existing resources like `jobs`, `doors`, `stable`, and `world` which demonstrate these patterns in practice.