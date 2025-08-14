# Quick Start Guide

Get up and running with Pioneer Village in just 5 minutes! This guide assumes you've completed the [installation process](installation.md).

## Your First Resource in 5 Minutes

Let's create a simple "Hello World" resource that demonstrates Pioneer Village's core concepts.

### Step 1: Generate Resource Boilerplate

```bash
# Create a new resource called 'hello-world'
yarn create-resource hello-world
```

This creates a new resource at `resources/hello-world/` with the complete boilerplate structure:

```
resources/hello-world/
├── fxmanifest.lua          # Resource manifest
├── package.json            # Node.js dependencies
├── rspack.config.js        # Build configuration
└── src/
    ├── client/
    │   ├── client.ts       # Client-side code
    │   ├── tsconfig.json   # TypeScript config
    │   └── types.d.ts      # Type definitions
    ├── server/
    │   ├── server.ts       # Server-side code
    │   ├── tsconfig.json   # TypeScript config
    │   └── types.d.ts      # Type definitions
    └── types.d.ts          # Shared types
```

### Step 2: Add Your Resource to the Server

Edit `resources.cfg` and add your resource:

```cfg
# Add this line
start hello-world
```

### Step 3: Implement Hello World Functionality

#### Client-side Code (`src/client/client.ts`)

Replace the boilerplate with:

```typescript
import { Log } from '@lib/client/comms/ui';
import { emitServer } from '@lib/client/comms/server';

// Register a command to say hello
RegisterCommand('hello', () => {
  Log('Hello from client!');
  emitServer('hello-world:greet', GetPlayerName(PlayerId()));
}, false);

// Listen for server response
onNet('hello-world:response', (message: string) => {
  Log(`Server says: ${message}`);
});

Log('Hello World resource loaded on client!');
```

#### Server-side Code (`src/server/server.ts`)

Replace the boilerplate with:

```typescript
import { Log } from '@lib/server';

// Listen for client greetings
onNet('hello-world:greet', (playerName: string) => {
  const source = global.source;
  Log(`Player ${playerName} (${source}) said hello!`);
  
  // Respond back to the client
  emitNet('hello-world:response', source, `Hello ${playerName}! Welcome to Pioneer Village!`);
});

Log('Hello World resource loaded on server!');
```

### Step 4: Build and Test

With `yarn watch` running in your terminal, the resource will automatically build. You should see:

```
[Rspack] hello-world compiled successfully
[FXServer] Started resource hello-world
```

### Step 5: Test In-Game

1. **Connect to your server**
2. **Open the console** (F8 by default)
3. **Run the command**: `hello`
4. **Check the console** for the response messages

You should see:
```
Hello from client!
Server says: Hello YourPlayerName! Welcome to Pioneer Village!
```

## Understanding What You Built

### Communication Flow

Your simple resource demonstrates Pioneer Village's communication patterns:

```
Client Command → Client Code → Server Event → Server Code → Client Response
```

1. **Command Registration**: `RegisterCommand` creates the `/hello` command
2. **Client to Server**: `emitServer` sends data to the server
3. **Server Processing**: `onNet` handles the incoming event
4. **Server to Client**: `emitNet` sends response back
5. **Client Response**: `onNet` handles the server response

### Key Concepts Demonstrated

#### 1. **TypeScript Integration**
- Full type safety with `@lib` imports
- IntelliSense support in your IDE
- Compile-time error checking

#### 2. **Library System**
- `@lib/client/comms/ui` for UI logging
- `@lib/client/comms/server` for client-server communication
- Centralized, typed API access

#### 3. **Event-Driven Architecture**
- Named events for communication (`hello-world:greet`, `hello-world:response`)
- Resource-scoped event naming
- Bidirectional communication

#### 4. **Hot Reload Development**
- Changes rebuild automatically
- Instant feedback loop
- No manual restart required

## Next Steps: Add UI Integration

Let's enhance your resource with UI integration:

### Add UI Communication

#### Update Client Code (`src/client/client.ts`)

```typescript
import { Log } from '@lib/client/comms/ui';
import { emitServer } from '@lib/client/comms/server';
import { emitUI } from '@lib/client/comms/ui';

RegisterCommand('hello', () => {
  // Show a UI notification
  emitUI('notification', {
    type: 'info',
    message: 'Hello command executed!',
    duration: 3000
  });
  
  emitServer('hello-world:greet', GetPlayerName(PlayerId()));
}, false);

onNet('hello-world:response', (message: string) => {
  // Show server response in UI
  emitUI('notification', {
    type: 'success',
    message: message,
    duration: 5000
  });
});
```

This demonstrates UI integration using Pioneer Village's notification system.

## Exploring the Framework

Now that you have a working resource, explore these areas:

### 1. **Examine Core Resources**
```bash
# Look at the base resource
ls resources/base/src/

# Check the UI system
ls resources/ui/src/
```

### 2. **Study the Library System**
```bash
# Explore available client functions
ls lib/client/

# Check server utilities
ls lib/server/
```

### 3. **Review Type Definitions**
```typescript
// In your IDE, hover over any @lib import to see available functions
import { emitServer } from '@lib/client/comms/server';
//                     ^ Hover here for documentation
```

### 4. **Check Other Resources**
Look at existing resources for patterns:
- `resources/base/` - Core functionality
- `resources/health/` - Health system
- `resources/inventory/` - Inventory management
- `resources/jobs/` - Job system (newly added)

## Common Patterns

### Resource Communication
```typescript
// Client to Server
emitServer('resource-name:event', data);

// Server to Client
emitNet('resource-name:response', source, responseData);

// Server to All Clients
TriggerClientEvent('resource-name:broadcast', -1, data);
```

### UI Integration
```typescript
// Show notification
emitUI('notification', { type: 'info', message: 'Hello!' });

// Focus UI layer
focusUI('my-layer', true);

// UI ClientRPC.Server call
const result = await awaitUI('getData', { id: 123 });
```

### Resource Exports
```typescript
// Export a function for other resources
global.exports('myFunction', (param: string) => {
  return `Hello ${param}`;
});

// Use another resource's export
import { PVBase, PVGame } from '@lib/client';
const playerData = PVGame.getCurrentCharacter();

// Server-side
import { PVBase, PVHealth } from '@lib/server';
const healthData = await PVHealth.getHealthMetadata(characterId);
```

## Development Tips

### 1. **Use the Logger**
```typescript
import { Log } from '@lib/client/comms/ui';
Log('Debug message', { data: 'here' });
```

### 2. **Type Your Events**
Create type definitions for your events:
```typescript
// In types.d.ts
declare namespace HelloWorld {
  interface Events {
    'hello-world:greet': (playerName: string) => void;
    'hello-world:response': (message: string) => void;
  }
}
```

### 3. **Use Hot Reload Effectively**
- Keep `yarn watch` running
- Save files to trigger rebuilds
- Check console for build errors

### 4. **Leverage IntelliSense**
- Hover over functions for documentation
- Use Ctrl+Space for autocompletion
- Follow type definitions with F12

## Troubleshooting

### Resource Not Starting
Check `server.cfg` and ensure your resource is listed:
```cfg
start hello-world
```

### Build Errors
Watch the build output for TypeScript errors:
```bash
# In the yarn watch terminal
[Rspack] hello-world failed to compile
```

### Runtime Errors
Check both client and server console logs for runtime issues.

## What's Next?

Ready to dive deeper? Here are your next steps:

1. **[Architecture Overview](architecture-overview.md)** - Understand the full system
2. **[Resource Development Guide](../resource-development/creating-resources.md)** - Advanced resource creation
3. **[UI Development](../resource-development/ui-development.md)** - Building interactive UIs
4. **[Database Integration](../core-systems/database-integration.md)** - Adding persistence
5. **[API Reference](../api-reference/)** - Complete function documentation

---

*Congratulations! You've just built your first Pioneer Village resource. Welcome to the framework!*
