# Basic Resource Example

This example demonstrates how to create a complete basic resource using Pioneer Village's framework. You'll learn the fundamental patterns for client-server communication, event handling, and resource structure.

## What You'll Build

A simple "Player Tracker" resource that:
- Tracks player position and health
- Provides commands for players to interact with
- Demonstrates client-server communication
- Shows basic UI integration
- Follows Pioneer Village conventions

## Resource Structure

```
resources/player-tracker/
├── fxmanifest.lua          # FiveM resource manifest
├── package.json            # Node.js dependencies and scripts
├── rspack.config.js        # Build configuration
└── src/
    ├── client/
    │   ├── client.ts       # Main client logic
    │   ├── tsconfig.json   # TypeScript config
    │   └── types.d.ts      # Client type definitions
    ├── server/
    │   ├── server.ts       # Main server logic
    │   ├── tsconfig.json   # TypeScript config
    │   └── types.d.ts      # Server type definitions
    └── types.d.ts          # Shared type definitions
```

## Step 1: Create the Resource

```bash
# Generate resource from boilerplate
yarn create-resource player-tracker

# Navigate to the resource
cd resources/player-tracker
```

## Step 2: Define Types

### Shared Types (`src/types.d.ts`)

```typescript
declare namespace PlayerTracker {
  interface PlayerData {
    id: number;
    name: string;
    position: Vector3;
    health: number;
    lastUpdate: number;
  }

  interface TrackingOptions {
    interval: number;
    includeHealth: boolean;
    includePosition: boolean;
  }

  // Events interface for type safety
  interface Events {
    'playerTracker:requestData': (playerId: number) => void;
    'playerTracker:updateData': (data: PlayerData) => void;
    'playerTracker:startTracking': (options: TrackingOptions) => void;
    'playerTracker:stopTracking': () => void;
  }
}
```

### Client Types (`src/client/types.d.ts`)

```typescript
declare namespace PlayerTrackerClient {
  interface LocalState {
    isTracking: boolean;
    trackingInterval: number | null;
    lastPosition: Vector3 | null;
  }
}
```

### Server Types (`src/server/types.d.ts`)

```typescript
declare namespace PlayerTrackerServer {
  interface PlayerSession {
    id: number;
    name: string;
    isTracking: boolean;
    lastSeen: number;
    data: PlayerTracker.PlayerData;
  }
}
```

## Step 3: Implement Client Logic

### Client Implementation (`src/client/client.ts`)

```typescript
import { Log } from '@lib/client/comms/ui';
import { emitServer, onServer } from '@lib/client/comms/server';
import { emitUI } from '@lib/client/comms/ui';
import { initManager } from '@lib/client';

// Local state management
const state: PlayerTrackerClient.LocalState = {
  isTracking: false,
  trackingInterval: null,
  lastPosition: null
};

// Initialize the resource
const initialize = async () => {
  try {
    // Wait for dependencies
    await initManager.initializedResource('base');
    await initManager.initializedResource('ui');

    Log('Player Tracker client initialized');
    
    // Register this resource as initialized
    initManager.resolveResource(GetCurrentResourceName());
    
    // Setup event handlers
    setupEventHandlers();
    setupCommands();
    
  } catch (error) {
    Log('Player Tracker initialization failed:', error);
    initManager.rejectResource(GetCurrentResourceName());
  }
};

// Event handlers
const setupEventHandlers = () => {
  // Handle server data updates
  onServer('playerTracker:updateData', (data: PlayerTracker.PlayerData) => {
    Log('Received player data update:', data);
    
    // Show UI notification
    emitUI('notification', {
      type: 'info',
      message: `Player ${data.name} updated - Health: ${data.health}%`,
      duration: 3000
    });
  });

  // Handle tracking state changes
  onServer('playerTracker:trackingChanged', (isTracking: boolean) => {
    state.isTracking = isTracking;
    
    if (isTracking) {
      startPositionTracking();
      emitUI('notification', {
        type: 'success',
        message: 'Position tracking started',
        duration: 2000
      });
    } else {
      stopPositionTracking();
      emitUI('notification', {
        type: 'warning',
        message: 'Position tracking stopped',
        duration: 2000
      });
    }
  });
};

// Command registration
const setupCommands = () => {
  // Start tracking command
  RegisterCommand('track_start', () => {
    const options: PlayerTracker.TrackingOptions = {
      interval: 5000, // 5 seconds
      includeHealth: true,
      includePosition: true
    };
    
    emitServer('playerTracker:startTracking', options);
    Log('Requested to start tracking');
  }, false);

  // Stop tracking command
  RegisterCommand('track_stop', () => {
    emitServer('playerTracker:stopTracking');
    Log('Requested to stop tracking');
  }, false);

  // Get current data command
  RegisterCommand('track_data', () => {
    const playerId = PlayerId();
    emitServer('playerTracker:requestData', playerId);
    Log('Requested current player data');
  }, false);

  // Show help command
  RegisterCommand('track_help', () => {
    emitUI('notification', {
      type: 'info',
      message: 'Commands: /track_start, /track_stop, /track_data, /track_help',
      duration: 5000
    });
  }, false);
};

// Position tracking logic
const startPositionTracking = () => {
  if (state.trackingInterval !== null) {
    return; // Already tracking
  }

  state.trackingInterval = setInterval(() => {
    const playerPed = PlayerPedId();
    const position = GetEntityCoords(playerPed, true);
    const health = GetEntityHealth(playerPed);

    // Check if position changed significantly
    if (state.lastPosition && 
        Vdist(position[0], position[1], position[2], 
              state.lastPosition.x, state.lastPosition.y, state.lastPosition.z) < 1.0) {
      return; // Haven't moved much, skip update
    }

    state.lastPosition = { x: position[0], y: position[1], z: position[2] };

    // Send update to server
    const data: Partial<PlayerTracker.PlayerData> = {
      position: state.lastPosition,
      health: Math.round((health - 100) / (200 - 100) * 100), // Convert to percentage
      lastUpdate: Date.now()
    };

    emitServer('playerTracker:positionUpdate', data);
  }, 5000) as any;
};

const stopPositionTracking = () => {
  if (state.trackingInterval !== null) {
    clearInterval(state.trackingInterval);
    state.trackingInterval = null;
    state.lastPosition = null;
  }
};

// Export functions for other resources
global.exports('isTracking', () => state.isTracking);
global.exports('getLastPosition', () => state.lastPosition);

// Start initialization
initialize();

Log('Player Tracker client loaded');
```

## Step 4: Implement Server Logic

### Server Implementation (`src/server/server.ts`)

```typescript
import { Log } from '@lib/server';
import { emitNet, onNet } from '@lib/server/comms/client';
import { emitSocket } from '@lib/server/comms/socket';

// Server state
const playerSessions = new Map<number, PlayerTrackerServer.PlayerSession>();

// Initialize server
const initialize = () => {
  Log('Player Tracker server initializing...');
  
  setupEventHandlers();
  setupPlayerEvents();
  setupExports();
  
  Log('Player Tracker server initialized');
};

// Event handlers
const setupEventHandlers = () => {
  // Handle tracking start requests
  onNet('playerTracker:startTracking', (options: PlayerTracker.TrackingOptions) => {
    const source = global.source;
    const playerName = GetPlayerName(source);
    
    Log(`Player ${playerName} (${source}) started tracking`);
    
    // Create or update player session
    const session: PlayerTrackerServer.PlayerSession = {
      id: source,
      name: playerName,
      isTracking: true,
      lastSeen: Date.now(),
      data: {
        id: source,
        name: playerName,
        position: { x: 0, y: 0, z: 0 },
        health: 100,
        lastUpdate: Date.now()
      }
    };
    
    playerSessions.set(source, session);
    
    // Notify client
    emitNet('playerTracker:trackingChanged', source, true);
    
    // Notify socket server for web dashboard
    emitSocket('playerTracker:sessionUpdate', {
      playerId: source,
      playerName,
      action: 'tracking_started',
      timestamp: Date.now()
    });
  });

  // Handle tracking stop requests
  onNet('playerTracker:stopTracking', () => {
    const source = global.source;
    const session = playerSessions.get(source);
    
    if (session) {
      session.isTracking = false;
      Log(`Player ${session.name} (${source}) stopped tracking`);
      
      // Notify client
      emitNet('playerTracker:trackingChanged', source, false);
      
      // Notify socket server
      emitSocket('playerTracker:sessionUpdate', {
        playerId: source,
        playerName: session.name,
        action: 'tracking_stopped',
        timestamp: Date.now()
      });
    }
  });

  // Handle position updates
  onNet('playerTracker:positionUpdate', (data: Partial<PlayerTracker.PlayerData>) => {
    const source = global.source;
    const session = playerSessions.get(source);
    
    if (session && session.isTracking) {
      // Update session data
      session.data = { ...session.data, ...data };
      session.lastSeen = Date.now();
      
      // Log significant movements
      if (data.position) {
        Log(`Player ${session.name} moved to: ${data.position.x.toFixed(1)}, ${data.position.y.toFixed(1)}, ${data.position.z.toFixed(1)}`);
      }
      
      // Broadcast to other players (optional)
      const otherPlayers = Array.from(playerSessions.keys()).filter(id => id !== source);
      otherPlayers.forEach(playerId => {
        emitNet('playerTracker:updateData', playerId, session.data);
      });
      
      // Send to socket server for web dashboard
      emitSocket('playerTracker:positionUpdate', session.data);
    }
  });

  // Handle data requests
  onNet('playerTracker:requestData', (targetPlayerId: number) => {
    const source = global.source;
    const targetSession = playerSessions.get(targetPlayerId);
    
    if (targetSession) {
      emitNet('playerTracker:updateData', source, targetSession.data);
    } else {
      Log(`Player ${source} requested data for non-existent player ${targetPlayerId}`);
    }
  });
};

// Player lifecycle events
const setupPlayerEvents = () => {
  // Clean up when player disconnects
  on('playerDropped', (reason: string) => {
    const source = global.source;
    const session = playerSessions.get(source);
    
    if (session) {
      Log(`Player ${session.name} (${source}) disconnected: ${reason}`);
      
      // Notify socket server
      emitSocket('playerTracker:sessionUpdate', {
        playerId: source,
        playerName: session.name,
        action: 'disconnected',
        reason: reason,
        timestamp: Date.now()
      });
      
      // Clean up session
      playerSessions.delete(source);
    }
  });

  // Welcome new players
  on('playerJoining', () => {
    const source = global.source;
    const playerName = GetPlayerName(source);
    
    Log(`Player ${playerName} (${source}) is joining`);
    
    // Send welcome message after a delay
    setTimeout(() => {
      emitNet('playerTracker:welcome', source, {
        message: 'Welcome to Player Tracker! Use /track_help for commands.',
        commands: ['/track_start', '/track_stop', '/track_data', '/track_help']
      });
    }, 5000);
  });
};

// Export functions for other resources
const setupExports = () => {
  global.exports('getPlayerSession', (playerId: number) => {
    return playerSessions.get(playerId) || null;
  });

  global.exports('getAllSessions', () => {
    return Array.from(playerSessions.values());
  });

  global.exports('getTrackingPlayers', () => {
    return Array.from(playerSessions.values()).filter(session => session.isTracking);
  });

  global.exports('forceStopTracking', (playerId: number) => {
    const session = playerSessions.get(playerId);
    if (session && session.isTracking) {
      session.isTracking = false;
      emitNet('playerTracker:trackingChanged', playerId, false);
      return true;
    }
    return false;
  });
};

// Cleanup inactive sessions
setInterval(() => {
  const now = Date.now();
  const inactiveThreshold = 60000; // 1 minute
  
  for (const [playerId, session] of playerSessions) {
    if (now - session.lastSeen > inactiveThreshold) {
      Log(`Cleaning up inactive session for player ${session.name} (${playerId})`);
      playerSessions.delete(playerId);
    }
  }
}, 30000); // Check every 30 seconds

// Start the server
initialize();

Log('Player Tracker server loaded');
```

## Step 5: Configuration Files

### Package.json (`package.json`)

```json
{
  "name": "player-tracker",
  "version": "1.0.0",
  "scripts": {
    "build": "rspack build --config rspack.config.js",
    "watch": "rspack build --config rspack.config.js --watch"
  },
  "devDependencies": {
    "@rspack/cli": "^1.2.8",
    "@rspack/core": "^1.2.8",
    "typescript": "^5.0.0"
  }
}
```

### FXManifest (`fxmanifest.lua`)

```lua
fx_version 'cerulean'
game 'rdr3'
rdr3_warning 'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.'

name 'Player Tracker'
description 'Basic player tracking resource demonstrating Pioneer Village patterns'
author 'Pioneer Village'
version '1.0.0'

-- Dependencies
dependencies {
    'base',
    'ui'
}

-- Client scripts
client_scripts {
    'build/client.js'
}

-- Server scripts
server_scripts {
    'build/server.js'
}

-- Exports
exports {
    'isTracking',
    'getLastPosition'
}

server_exports {
    'getPlayerSession',
    'getAllSessions', 
    'getTrackingPlayers',
    'forceStopTracking'
}
```

## Step 6: Add to Server Configuration

Add to your `resources.cfg`:

```cfg
start player-tracker
```

## Step 7: Build and Test

```bash
# Build the resource
yarn build

# Or use watch mode for development
yarn watch
```

## Testing the Resource

1. **Start the server** and connect as a player
2. **Use the commands**:
   - `/track_help` - Show available commands
   - `/track_start` - Start position tracking
   - `/track_data` - Get current player data
   - `/track_stop` - Stop tracking

3. **Check the logs** for tracking information
4. **Test with multiple players** to see data sharing

## Key Learning Points

### 1. **Resource Structure**
- Clear separation of client and server logic
- Shared type definitions for consistency
- Proper TypeScript configuration

### 2. **Communication Patterns**
- Client-to-server events with `emitServer`
- Server-to-client responses with `emitNet`
- Type-safe event handling with defined interfaces

### 3. **Initialization**
- Dependency management with `initManager`
- Proper error handling during initialization
- Resource registration and resolution

### 4. **State Management**
- Client-side state for UI interactions
- Server-side sessions for player tracking
- Cleanup and memory management

### 5. **Integration**
- UI notifications for user feedback
- Socket server integration for web dashboards
- Export system for inter-resource communication

### 6. **Best Practices**
- Comprehensive logging for debugging
- Input validation and error handling
- Resource cleanup on player disconnect
- Performance considerations (position change detection)

## Next Steps

- **[UI Integration Example](../ui-integration/)** - Add custom UI components
- **[Database Usage](../database-usage/)** - Persist tracking data
- **[Job Creation](../job-creation/)** - Integrate with the job system
- **[Advanced Patterns](../advanced-patterns/)** - Complex resource interactions

## Common Extensions

### Add Persistence
```typescript
// Save tracking data to database
import { db } from '@lib/server/database';

const savePlayerData = async (data: PlayerTracker.PlayerData) => {
  await db.insert(playerPositions).values({
    playerId: data.id,
    position: JSON.stringify(data.position),
    health: data.health,
    timestamp: new Date(data.lastUpdate)
  });
};
```

### Add Admin Commands
```typescript
// Admin-only commands
RegisterCommand('track_admin_view', () => {
  if (!IsPlayerAceAllowed(PlayerId(), 'admin.tracking')) {
    return;
  }
  
  emitServer('playerTracker:requestAllData');
}, false);
```

### Add Zone Notifications
```typescript
// Notify when players enter/exit zones
import { addZone } from '@lib/client';

addZone('spawn_area', {
  center: { x: 0, y: 0, z: 0 },
  radius: 50
}, {
  onEnter: () => emitServer('playerTracker:enteredSpawn'),
  onExit: () => emitServer('playerTracker:leftSpawn')
});
```

---

*This basic resource example demonstrates the fundamental patterns you'll use in all Pioneer Village resources. Master these concepts and you'll be ready for more advanced development!*
