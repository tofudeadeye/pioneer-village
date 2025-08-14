# Type Definitions Guide for Pioneer Village

This guide explains the proper way to define TypeScript types for socket events, UI events, and ClientRPC.Server calls across the Pioneer Village codebase.

## Overview

The type system uses TypeScript's declaration merging to combine type definitions from multiple resources. Each resource should define its own types in the appropriate files, and TypeScript will merge them into the global interfaces.

## New Naming Convention (v2)

We use directional prefixes that make data flow crystal clear:

- **`SocketIn`** / **`SocketOut`** - Socket server perspective
- **`ClientIn`** / **`ClientOut`** - Client perspective  
- **`ClientRPC`** - Client ClientRPC.Server calls to various destinations
- **`SocketIO`** - Raw Socket.io events for UI layer

## Type Definition Structure

### 1. Socket Server Types (`socket/src/types/[resource].d.ts`)

Define the socket server's perspective of events:

```typescript
// Socket perspective - what the socket server receives
declare interface SocketIn {
  FromGameServer: {
    ['resource.event-name']: (data: any, callback: (result: any) => void) => void;
  };
  
  FromClient: {
    ['resource.client-event']: (data: any, callback: (result: any) => void) => void;
  };
}

// Socket perspective - what the socket server sends
declare interface SocketOut {
  ToGameServer: {
    ['resource.broadcast-event']: (data: any) => void;
  };
  
  ToClient: {
    ['resource.ui-broadcast']: (data: any) => void;
  };
}

// Backward compatibility (remove after full migration)
declare namespace SocketServer {
  interface Server extends SocketIn.FromGameServer {}
  interface ServerEvents extends SocketOut.ToGameServer {}
  interface Client extends SocketIn.FromClient {}
  interface ClientEvents extends SocketOut.ToClient {}
}
```

### 2. Client Resource Types (`resources/[core]/[resource]/src/client/types.d.ts`)

Define client-side types and UI communication:

```typescript
// Resource namespace for type organization
declare namespace MyResource {
  // Define event signatures as types
  namespace Events {
    type StateUpdate = (newState: ResourceState) => void;
    type ActionComplete = (actionId: string, result: ActionResult) => void;
  }
  
  // Client exports interface
  interface ClientExports {
    someFunction: () => void;
  }
}

// Extend global ClientExports
declare interface ClientExports {
  'my-resource': MyResource.ClientExports;
}

// Client perspective - ClientRPC calls to various destinations
declare namespace ClientRPC {
  interface Socket {
    ['my-resource.get-data']: (params: QueryParams) => DataResult;
    ['my-resource.action']: (action: ActionData) => ActionResult;
  }
}

// Client perspective - events received from various sources
declare namespace ClientIn {
  interface FromSocket {
    ['my-resource.state-update']: MyResource.Events.StateUpdate;
    ['my-resource.action-complete']: MyResource.Events.ActionComplete;
  }
}

// Raw Socket.io events for UI layer typing
declare namespace SocketIO {
  interface Events {
    ['my-resource.state-update']: MyResource.Events.StateUpdate;
    ['my-resource.action-complete']: MyResource.Events.ActionComplete;
  }
}

// Backward compatibility (remove after full migration)
// These interface extensions are no longer needed with namespace pattern
// declare interface ClientRPC.Socket extends ClientRPC.Socket {}
// declare interface ClientIn.FromSocket extends ClientIn.FromSocket {}
// declare interface SocketIO.Events extends SocketIO.Events {}
```

### 3. Server Resource Types (`resources/[core]/[resource]/src/server/types.d.ts`)

Define server-side types:

```typescript
declare namespace MyResource {
  // Server exports interface
  interface ServerExports {
    serverFunction: () => void;
  }
}

// Extend global ServerExports
declare interface ServerExports {
  'my-resource': MyResource.ServerExports;
}

// Server perspective - ClientRPC calls from clients
declare namespace ClientRPC {
  interface Server {
    ['my-resource.server-call']: (params: CallParams) => CallResult;
  }
}

// Server perspective - events to/from clients
declare namespace ClientIn {
  interface FromServer {
    ['my-resource.client-event']: (data: ClientEventData) => void;
  }
}

declare namespace ClientOut {
  interface ToServer {
    ['my-resource.server-event']: (data: ServerEventData) => void;
  }
}

// Backward compatibility (remove after full migration)
// These interface extensions are no longer needed with namespace pattern
// declare interface ClientRPC.Server extends ClientRPC.Server {}
// declare interface ClientIn.FromServer & ClientOut.ToServer extends ClientIn.FromServer, ClientOut.ToServer {}
```

### 4. UI Layer Types (`resources/ui/src/types.d.ts`)

The main UI types file should only contain UI-specific types that don't belong to any specific resource:

```typescript
declare namespace SocketIO {
  interface Events {
    // Base UI events only - resource-specific events are defined in their own files
    chatMessage: (chatMessage: UI.Chat.Message) => void;
    // DO NOT duplicate resource-specific events here
  }
}
```

## Key Principles

### 1. **No Duplication**
- Each event should be defined only once in its logical location
- Use TypeScript's declaration merging instead of duplicating definitions

### 2. **Clear Directional Naming**
- Interface names explicitly show data flow direction
- `In` = receiving, `Out` = sending
- `From` and `To` prefixes clarify the source/destination
- Follow the naming convention: `resource.event-name`

### 3. **Type Organization**
- Socket server types in `socket/src/types/`
- Client types in `resources/[core]/[resource]/src/client/types.d.ts`
- Server types in `resources/[core]/[resource]/src/server/types.d.ts`

### 4. **Interface Extensions (New Pattern)**
Each resource extends the appropriate global interfaces:

**Socket Perspective:**
- `SocketIn.FromGameServer` - Receives from game server
- `SocketIn.FromClient` - Receives from UI client
- `SocketOut.ToGameServer` - Sends to game server
- `SocketOut.ToClient` - Sends to UI client

**Client Perspective:**
- `ClientRPC.Socket` - ClientRPC.Server calls to socket (via UI)
- `ClientRPC.Server` - ClientRPC.Server calls to game server
- `ClientIn.FromSocket` - Receives from socket (via UI)
- `ClientIn.FromServer` - Receives from game server
- `ClientOut.ToSocket` - Sends to socket (via UI)
- `ClientOut.ToServer` - Sends to game server
- `SocketIO.Events` - Raw Socket.io events for UI layer

## Common Patterns

### Pattern 1: Socket Broadcast to All Clients

```typescript
// In socket/src/types/my-resource.d.ts
declare namespace SocketServer {
  declare interface SocketOut {
  ToClient: {
    ['my-resource.update']: (data: UpdateData) => void;
  }
}

// In resources/[core]/my-resource/src/client/types.d.ts
declare namespace ClientIn {
  interface FromSocket {
    ['my-resource.update']: (data: UpdateData) => void;
  }
}

declare namespace SocketIO {
  interface Events {
    ['my-resource.update']: (data: UpdateData) => void;
  }
}
```

### Pattern 2: Client ClientRPC.Server to Socket

```typescript
// In socket/src/types/my-resource.d.ts
declare namespace SocketServer {
  declare interface SocketIn {
  FromClient: {
    ['my-resource.get-data']: (id: number, callback: (data: Data) => void) => void;
  }
}

// In resources/[core]/my-resource/src/client/types.d.ts
declare namespace ClientRPC {
  interface Socket {
    ['my-resource.get-data']: (id: number) => Data;
  }
}
```

### Pattern 3: Server to Socket Communication

```typescript
// In socket/src/types/my-resource.d.ts
declare namespace SocketServer {
  declare interface SocketIn {
  FromGameServer: {
    ['my-resource.save']: (data: SaveData, callback: (success: boolean) => void) => void;
  }
}

// In resources/[core]/my-resource/src/server/types.d.ts
// Use the socket communication helpers from @lib/server
```

## Migration Checklist

When cleaning up type definitions:

1. ✅ Remove duplicate definitions from `ClientForwardEvents` and `SocketForwardEvents`
2. ✅ Ensure events are defined in only one interface
3. ✅ Add clear comments explaining data flow direction
4. ✅ Keep `SocketIO.Events` aligned with `SocketOut.ToClient`
5. ✅ Use the resource namespace for type organization
6. ✅ Follow the `resource.event-name` naming convention

## Example: Jobs Resource

The jobs resource has been refactored to follow this pattern:

- **Socket types** (`socket/src/types/jobs.d.ts`): Defines all socket server interfaces
- **Client types** (`resources/[core]/jobs/src/client/types.d.ts`): Defines ClientRPC.Socket, ClientIn.FromSocket, and SocketIO.Events
- **No duplication**: Removed `ClientForwardEvents` and `SocketForwardEvents` 
- **Clear comments**: Each interface has comments explaining the data flow

## Testing Type Definitions

After defining types:

1. Check that TypeScript compiles without errors
2. Verify IntelliSense shows the correct types in your IDE
3. Test that event handlers have proper type checking
4. Ensure no duplicate property errors in the TypeScript compiler

## Common Mistakes to Avoid

❌ **Don't** duplicate event definitions across multiple interfaces
❌ **Don't** define resource-specific events in `resources/ui/src/types.d.ts`
❌ **Don't** forget to extend `SocketIO.Events` for socket events
❌ **Don't** mix client and server types in the same file
✅ **Do** use declaration merging to extend global interfaces
✅ **Do** keep types close to where they're used
✅ **Do** add comments explaining data flow direction
✅ **Do** follow the established naming conventions