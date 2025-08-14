# UI Resource API Documentation

The `ui` resource provides the complete user interface system for Pioneer Village, including HUD elements, forms, notifications, and interactive components. Use it to create rich user interfaces that communicate seamlessly between client, server, and web UI.

## Quick Start

```typescript
// Access the UI system from any client script
import { emitUI, onUI, focusUI } from '@lib/client/comms/ui';

// Show a notification
emitUI('notification.notify', 'Welcome to Pioneer Village!', 5000);

// Update HUD with player stats
emitUI('hud.state', { 
  health: 75, 
  stamina: 80,
  voice: { talking: false, range: 'normal' },
  show: true 
});

// Show an interactive form
emitUI('form.state', {
  show: true,
  title: 'Enter your name',
  fields: [{ name: 'playerName', type: 'text', label: 'Name' }]
});
focusUI(true, true); // Give player focus and cursor
```

## Core Communication Functions

### Sending Data to UI

```typescript
// Fire-and-forget event to UI
emitUI(eventName: string, ...args: any[]): void

// Send data and wait for response
awaitUI(eventName: string, ...args: any[]): Promise<any>

// Examples
emitUI('notification.notify', 'Hello!', 3000, 'blue', 'white');
const result = await awaitUI('form.getResponse', formData);
```

### Listening for UI Events

```typescript
// Listen for events from UI
onUI(eventName: string, callback: Function): void

// Listen for ClientRPC.Server calls from UI (can send response)
onUICall(eventName: string, callback: Function): void

// Examples
onUI('form.answer', (formData) => {
  console.log('User submitted:', formData);
});

onUICall('player.getData', () => {
  return { name: 'John', level: 5 };
});
```

### Focus and Cursor Control

```typescript
// Control UI focus and cursor visibility
focusUI(hasFocus: boolean, hasCursor: boolean): void

// Examples
focusUI(true, true);   // Show cursor, allow typing
focusUI(true, false);  // Allow typing, hide cursor
focusUI(false, false); // Remove focus completely
```

## Available UI Layers

### HUD System

```typescript
// Update HUD elements
emitUI('hud.state', {
  health: 75,           // Health percentage (0-100)
  stamina: 80,          // Stamina percentage (0-100)
  voice: {              // Voice chat indicator
    talking: false,
    range: 'normal'     // 'whisper', 'normal', 'shout'
  },
  show: true            // Show/hide HUD
});
```

### Notifications

```typescript
// Show notification toast
emitUI('notification.notify', 
  text: string,
  duration?: number,    // Duration in ms (default: 5000)
  bgColor?: string,     // Background color (default: theme)
  fgColor?: string,     // Text color (default: white)
  centered?: boolean    // Center on screen (default: false)
);

// Examples
emitUI('notification.notify', 'Mission completed!');
emitUI('notification.notify', 'Low health!', 3000, 'red', 'white');
emitUI('notification.notify', 'Level up!', 5000, 'gold', 'black', true);
```

### Forms and Input

```typescript
// Show form dialog
emitUI('form.state', {
  show: true,
  title: 'Form Title',
  fields: [
    {
      name: 'username',
      type: 'text',        // 'text', 'password', 'number', 'select'
      label: 'Username',
      required: true,
      placeholder: 'Enter username'
    },
    {
      name: 'age',
      type: 'number',
      label: 'Age',
      min: 18,
      max: 100
    },
    {
      name: 'gender',
      type: 'select',
      label: 'Gender',
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' }
      ]
    }
  ]
});

// Listen for form submission
onUI('form.answer', (data) => {
  console.log('Form data:', data);
  // { username: 'john_doe', age: 25, gender: 'male' }
  
  // Hide form and remove focus
  emitUI('form.state', { show: false });
  focusUI(false, false);
});
```

### Chat System

```typescript
// Send chat message
emitUI('chat.state', {
  messages: [
    {
      id: Date.now(),
      text: 'Hello everyone!',
      sender: 'PlayerName',
      type: 'normal',      // 'normal', 'system', 'error', 'admin'
      timestamp: new Date()
    }
  ]
});

// Show/hide chat
emitUI('chat.state', { show: true });

// Listen for new messages
onUI('chat.send', (message) => {
  console.log('Player sent:', message);
  // Process and broadcast message
});
```

### Target System

```typescript
// Show interaction targets
emitUI('target.action', 
  context: number | string,  // Entity ID or unique identifier
  action: {
    id: string,
    label: string,
    icon?: string,             // FontAwesome icon name
    distance?: number,         // Max interaction distance
    enabled?: boolean,         // Can be interacted with
    keybind?: string          // Display keybind (e.g., "[E]")
  }
);

// Example
emitUI('target.action', playerPed, {
  id: 'talk',
  label: 'Talk to Player',
  icon: 'comments',
  distance: 3.0,
  enabled: true,
  keybind: '[E]'
});

// Listen for target interactions
onUI('target.interact', (context, actionId) => {
  console.log(`Player used ${actionId} on ${context}`);
});
```

### Character Selection

```typescript
// Initialize character selection
emitUI('character-select.state', {
  show: true,
  characters: [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      pos: { x: 0.5, y: 0.3 }  // Screen position (0-1)
    }
  ]
});

// Listen for character choice
onUI('character-select.choose', (characterId) => {
  console.log('Selected character:', characterId);
});

// Listen for character creation
onUI('character-select.create', () => {
  console.log('User wants to create new character');
});
```

### Jobs System

```typescript
// Update job status
emitUI('jobs.state', {
  currentJob: {
    handle: 'sheriff',
    name: 'Sheriff Deputy',
    clockedIn: true,
    location: 'Valentine'
  },
  availableJobs: [
    {
      handle: 'doctor',
      name: 'Doctor',
      location: 'Saint Denis',
      openPositions: 2
    }
  ]
});

// Listen for job actions
onUI('jobs.clockIn', (jobHandle) => {
  console.log('Clocking into:', jobHandle);
});

onUI('jobs.clockOut', () => {
  console.log('Clocking out');
});
```

## Socket Communication

The UI resource provides server-to-client communication through the socket system:

```typescript
// Import socket functions
import { emitSocket, onSocket } from '@lib/client/comms/ui';

// Send data to socket server through UI
emitSocket('player.update', playerData);

// Listen for server messages through UI
onSocket('server.message', (data) => {
  console.log('Server sent:', data);
});
```

## Advanced Usage

### Custom UI Integration

```typescript
// Complete form workflow example
const showPlayerInfoForm = async () => {
  // Show form
  emitUI('form.state', {
    show: true,
    title: 'Player Information',
    fields: [
      { name: 'name', type: 'text', label: 'Full Name', required: true },
      { name: 'age', type: 'number', label: 'Age', min: 18 },
      { name: 'occupation', type: 'select', label: 'Occupation', 
        options: [
          { value: 'farmer', label: 'Farmer' },
          { value: 'merchant', label: 'Merchant' },
          { value: 'lawman', label: 'Law Enforcement' }
        ]
      }
    ]
  });
  
  // Give focus and show cursor
  focusUI(true, true);
  
  // Wait for response
  return new Promise((resolve) => {
    onUI('form.answer', (data) => {
      // Hide form and remove focus
      emitUI('form.state', { show: false });
      focusUI(false, false);
      
      resolve(data);
    });
  });
};

// Usage
const playerInfo = await showPlayerInfoForm();
console.log('Player entered:', playerInfo);
```

### HUD State Management

```typescript
// Centralized HUD manager
class HUDManager {
  private state = {
    health: 100,
    stamina: 100,
    voice: { talking: false, range: 'normal' },
    show: true
  };
  
  updateHealth(health: number) {
    this.state.health = health;
    this.refresh();
  }
  
  updateStamina(stamina: number) {
    this.state.stamina = stamina;
    this.refresh();
  }
  
  setVoiceState(talking: boolean, range: string) {
    this.state.voice = { talking, range };
    this.refresh();
  }
  
  private refresh() {
    emitUI('hud.state', this.state);
  }
  
  show() {
    this.state.show = true;
    this.refresh();
  }
  
  hide() {
    this.state.show = false;
    this.refresh();
  }
}

// Usage
const hud = new HUDManager();
hud.updateHealth(75);
hud.setVoiceState(true, 'shout');
```

### Multi-Layer UI Coordination

```typescript
// Show multiple UI elements with proper focus management
const showCharacterMenu = async () => {
  // Hide game HUD
  emitUI('hud.state', { show: false });
  
  // Show character info
  emitUI('character-select.state', { 
    show: true,
    characters: await getPlayerCharacters()
  });
  
  // Show notifications
  emitUI('notification.notify', 'Select your character', 10000);
  
  // Give full UI control
  focusUI(true, true);
};

const hideCharacterMenu = () => {
  // Hide character UI
  emitUI('character-select.state', { show: false });
  
  // Show game HUD
  emitUI('hud.state', { show: true });
  
  // Return control to game
  focusUI(false, false);
};
```

## Error Handling

### UI Communication Errors

```typescript
// Handle UI communication failures
try {
  const result = await awaitUI('form.getData', formId);
  console.log('Form data:', result);
} catch (error) {
  console.error('Failed to get form data:', error);
  emitUI('notification.notify', 'Form error occurred', 3000, 'red');
}
```

### Graceful Degradation

```typescript
// Check if UI is available before using
const isUIAvailable = () => {
  try {
    emitUI('test.ping');
    return true;
  } catch {
    return false;
  }
};

const safeNotify = (message: string) => {
  if (isUIAvailable()) {
    emitUI('notification.notify', message);
  } else {
    // Fallback to game notifications
    SetNotificationTextEntry('STRING');
    AddTextComponentString(message);
    DrawNotification(false, false);
  }
};
```

## Integration Patterns

### Resource Integration

```typescript
// In your resource's client.ts
import { emitUI, onUI, focusUI } from '@lib/client/comms/ui';

// Initialize UI components when resource starts
const initializeUI = () => {
  // Setup UI event listeners
  onUI('myresource.action', handleUIAction);
  onUI('myresource.close', () => focusUI(false, false));
  
  // Show initial UI state
  emitUI('myresource.state', { initialized: true });
};

// Register resource initialization
on('onResourceStart', (resourceName: string) => {
  if (resourceName === GetCurrentResourceName()) {
    initializeUI();
  }
});
```

### Server Integration

```typescript
// Server-side (using socket through UI)
import { onSocket, emitSocket } from '@lib/server';

// Listen for client actions
onSocket('player.action', (serverId: number, action: string, data: any) => {
  console.log(`Player ${serverId} performed ${action}:`, data);
  
  // Process action and send response
  const result = processPlayerAction(serverId, action, data);
  
  // Send result back to client through UI
  emitSocket('player.actionResult', serverId, result);
});
```

## Development Tools

### Debug Commands

```typescript
// Available development commands (in-game console)

// Restart UI resource
ui-r

// Show UI debug info
ui-debug

// Test notification
ui-notify "Test message"

// Show/hide HUD
ui-hud-toggle
```

### Logging and Debugging

```typescript
// Use the UI logging system for debug output
import { Log } from '@lib/client/comms/ui';

Log('Debug message');
Log('Player data:', playerInfo);
Log('Form submitted:', formData);
```

## Best Practices

### 1. Focus Management
```typescript
// Good - always manage focus properly
emitUI('form.state', { show: true });
focusUI(true, true);

onUI('form.close', () => {
  emitUI('form.state', { show: false });
  focusUI(false, false);  // Don't forget this!
});

// Bad - leaving focus enabled
emitUI('form.state', { show: true });
focusUI(true, true);
// Form hidden but focus still active
```

### 2. State Synchronization
```typescript
// Good - send complete state updates
const uiState = {
  health: player.health,
  stamina: player.stamina,
  show: true
};
emitUI('hud.state', uiState);

// Bad - partial updates that can get out of sync
emitUI('hud.health', player.health);
emitUI('hud.stamina', player.stamina);
```

### 3. Error Handling
```typescript
// Good - handle UI failures gracefully
try {
  await awaitUI('complex.operation', data);
} catch (error) {
  console.error('UI operation failed:', error);
  // Provide fallback functionality
  handleFallback();
}

// Bad - assuming UI always works
const result = await awaitUI('complex.operation', data);
```

### 4. Resource Cleanup
```typescript
// Clean up UI state when resource stops
on('onResourceStop', (resourceName: string) => {
  if (resourceName === GetCurrentResourceName()) {
    emitUI('myresource.state', { show: false });
    focusUI(false, false);
  }
});
```

## Troubleshooting

### Common Issues

**UI not responding:**
- Check if UI resource is started
- Verify event names match exactly
- Ensure focus is properly managed

**Form not showing:**
- Check if form state includes `show: true`
- Verify `focusUI(true, true)` is called
- Ensure no other UI has exclusive focus

**Events not received:**
- Check event listener is registered before emitting
- Verify event names are spelled correctly
- Check if UI layer is loaded and active

### Debug Commands

```typescript
// Check UI resource status
GetResourceState('ui') === 'started'

// Test basic UI communication
emitUI('notification.notify', 'Test message');

// Check focus state
IsCursorActive() // Should return true when UI has focus
```

## Related Resources

- **[Game Resource](game-resource.md)** - Core gameplay integration
- **[Base Resource](base-resource.md)** - Foundation utilities
- **[Init Resource](init-resource.md)** - Resource initialization
- **[Development Guide](../resource-development/creating-resources.md)** - Creating custom resources

---

*For UI component development and custom layer creation, see the [UI Development Guide](../integration-guides/ui-development.md).*
