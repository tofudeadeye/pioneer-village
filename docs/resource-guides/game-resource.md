# Game Resource API Documentation

The `game` resource provides core gameplay functionality including player management, animations, character systems, and entity management. This documentation covers how to use the game resource in your own resources.

## Quick Start

```typescript
// Access the game resource API
import { PVGame } from '@lib/client';

// Get player information
const playerPed = PVGame.playerPed();
const playerPos = PVGame.playerCoords();

// Play an animation
await PVGame.taskPlayAnim({
  dict: 'amb_misc@world_human_bartender@male_a@base',
  anim: 'base',
  flags: 1 // Repeat
});
```

## Player Information

### Get Player Entity
```typescript
const playerPed = PVGame.playerPed();
// Returns: number (ped entity ID)
```

### Get Player Coordinates
```typescript
// Get cached coordinates (updated every 5 seconds)
const coords = PVGame.playerCoords();

// Force immediate coordinate update
const coords = PVGame.playerCoords(true);

// Returns: { x: number, y: number, z: number }
```

### Get Player Mount
```typescript
const mountPed = PVGame.mountPed();
// Returns: number (mount entity ID, or 0 if not mounted)
```

### Get Player Identifiers
```typescript
const serverId = PVGame.getPlayerServerId();
const steamId = await PVGame.getPlayerSteamId();
```

## Animation System

### Simple Animations

```typescript
await PVGame.taskPlayAnim({
  dict: 'amb_misc@world_human_bartender@male_a@base',
  anim: 'base',
  flags: 1,        // Animation flags (optional)
  duration: 5000   // Duration in ms (optional, -1 for infinite)
});
```

### Animation Sequences

```typescript
await PVGame.taskPlayAnimArrayNew([
  {
    dict: 'script_common@emotes@drunk@male_a@base',
    anim: 'base',
    duration: 3000
  },
  {
    dict: 'amb_misc@world_human_bartender@male_a@base', 
    anim: 'base',
    flags: 1
  }
]);
```

### Advanced Positioned Animations

```typescript
await PVGame.taskPlayAnimAdvArray(
  { x: 100, y: 200, z: 30 },    // Position
  { x: 0, y: 0, z: 180 },       // Rotation
  [
    {
      dict: 'script_common@emotes@drunk@male_a@base',
      anim: 'base',
      coords: { x: 105, y: 205, z: 30 },  // Override position for this anim
      rotation: { x: 0, y: 0, z: 90 }     // Override rotation for this anim
    }
  ]
);
```

### Custom Walking Animations

```typescript
// Set custom walk style
PVGame.setAnimWalk({
  walkSet: 'move_m@drunk@slightlydrunk',
  runSet: 'move_m@drunk@slightlydrunk'
});

// Clear custom walk style
PVGame.clearAnimWalk();
```

## Entity Management

### Create Objects

```typescript
// Create a networked object
const object = PVGame.createObject(
  'p_chair02x',           // Model name
  { x: 100, y: 200, z: 30 }, // Position
  { x: 0, y: 0, z: 0 },      // Rotation
  true                    // Networked (optional, default true)
);
```

### Create NPCs

```typescript
// Create a ped
const ped = PVGame.createPed(
  'A_M_M_VALDEPUTY_01',   // Model name
  100, 200, 30,           // x, y, z coordinates
  180,                    // Heading
  true,                   // Random outfit (optional)
  true                    // Networked (optional)
);
```

### Entity Control

```typescript
// Gain network control of an entity
await PVGame.getNetworkControlOfEntity(entityId);

// Safely delete an entity
await PVGame.deleteEntity(entityId);
```

## Asset Loading

### Load Models

```typescript
// Load a model (ped, vehicle, object)
await PVGame.loadModel('A_M_M_VALDEPUTY_01');

// Model is now ready to use
const ped = PVGame.createPed('A_M_M_VALDEPUTY_01', x, y, z, heading);
```

### Load Animation Dictionaries

```typescript
// Load animation dictionary
await PVGame.loadAnimDict('amb_misc@world_human_bartender@male_a@base');

// Dictionary is now ready for animations
```

### Load Textures

```typescript
// Load texture dictionary
await PVGame.requestTxd('mp_player_inteat@burger');
```

### Wait for Entity Loading

```typescript
// Wait for entity collision to load
await PVGame.collisionLoadedAtEntity(entityId);

// Wait for ped to be ready for rendering
await PVGame.pedIsReadyToRender(pedId);
```

## Clothing and Components

### Apply Components to Ped

```typescript
// Apply component array to ped
await PVGame.setPedComponents(pedId, [
  0x12345678,  // Hat
  0x87654321,  // Shirt
  // ... more component hashes
]);

// Apply MP-specific components
await PVGame.setPedComponentsMp(pedId, componentArray);

// Finalize outfit application
await PVGame.finalizePedOutfit(pedId);
```

### Component Database

```typescript
// Get component by ID (future feature)
const component = await PVGame.getComponentById(12345);

// Get all components in a category
const hats = await PVGame.getAllByCategory('hats');
const boots = await PVGame.getAllByCategory('boots');
```

## Audio System

### Play Audio from Ped

```typescript
// Load audio stream
await PVGame.loadStream('AM_MP_DAB_EP1', 'CAMP_GANG_STEW_01');

// Play from specific ped
PVGame.playStreamFromPed(pedId, 'AM_MP_DAB_EP1', 'CAMP_GANG_STEW_01');

// Stop audio stream
PVGame.stopStream('AM_MP_DAB_EP1', 'CAMP_GANG_STEW_01');
```

## Character Selection System

### Initialize Character Selection

```typescript
// Initialize character selection with character data
await PVGame.initializeCharacterSelect([
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    model: 'MP_MALE',
    components: [/* component array */],
    clothing: [/* clothing data */],
    // ... other character data
  }
]);
```

### Character Selection Events

```typescript
// Handle character selection
onUI('character-select.choose', async (characterId: number) => {
  // Character selection logic
  emit('game:character-selected', characterId);
});

// Clean up character selection
PVGame.cleanupCharacters();
```

## Vegetation Management

### Add Vegetation Modifiers

```typescript
// Add sphere modifier at entity position
const modifierId = PVGame.vegAddSphereAtEntity(
  entityId,     // Entity to center on
  10.0,         // Radius
  1,            // Modifier type
  0             // Flags
);

// Add volume-based modifier
PVGame.vegAddVolume(
  { /* volume data */ },
  1,            // Modifier type  
  0             // Flags
);

// Remove all vegetation modifiers
PVGame.vegRemoveAllSpheres();
```

## Integration Examples

### Basic Player Interaction

```typescript
// Complete player interaction example
const handlePlayerInteraction = async () => {
  // PVGame is already imported at top of file
  
  // Get player info
  const playerPed = PVGame.playerPed();
  const playerPos = PVGame.playerCoords();
  
  // Load required assets
  await PVGame.loadAnimDict('amb_misc@world_human_bartender@male_a@base');
  await PVGame.loadModel('p_chair02x');
  
  // Create interaction object
  const chair = PVGame.createObject('p_chair02x', playerPos, { x: 0, y: 0, z: 0 });
  
  // Play sitting animation
  await PVGame.taskPlayAnim({
    dict: 'amb_misc@world_human_bartender@male_a@base',
    anim: 'base',
    flags: 1,
    duration: 10000
  });
  
  // Clean up after animation
  setTimeout(() => {
    PVGame.deleteEntity(chair);
  }, 10000);
};
```

### Character Customization Flow

```typescript
// Apply character customization
const applyCharacterLook = async (characterData: any) => {
  // PVGame and PVCustomization are imported at top of file
  
  // Get player ped
  const ped = PVGame.playerPed();
  
  // Apply base components
  await PVGame.setPedComponents(ped, characterData.components);
  
  // Apply clothing items
  if (characterData.clothing && characterData.clothing.length > 0) {
    await PVCustomization.equipItems(ped, characterData.clothing);
  }
  
  // Finalize the look
  await PVGame.finalizePedOutfit(ped);
};
```

### NPC Creation with Behavior

```typescript
// Create NPC with custom behavior
const createBarkeeper = async (position: Vector3) => {
  // PVGame is imported at top of file
  
  // Load assets
  await PVGame.loadModel('A_M_M_VALDEPUTY_01');
  await PVGame.loadAnimDict('amb_misc@world_human_bartender@male_a@base');
  
  // Create the NPC
  const npc = PVGame.createPed(
    'A_M_M_VALDEPUTY_01',
    position.x, position.y, position.z,
    180, // Facing south
    false, // Don't randomize outfit
    true   // Networked
  );
  
  // Wait for NPC to be ready
  await PVGame.pedIsReadyToRender(npc);
  
  // Apply bartender animation
  await PVGame.taskPlayAnim({
    dict: 'amb_misc@world_human_bartender@male_a@base',
    anim: 'base',
    flags: 1 // Repeat
  });
  
  return npc;
};
```

## Error Handling

### Asset Loading Errors

```typescript
try {
  await PVGame.loadModel('INVALID_MODEL');
} catch (error) {
  console.error('Failed to load model:', error.message);
  // Fallback to default model
  await PVGame.loadModel('A_M_M_VALDEPUTY_01');
}
```

### Animation Errors

```typescript
try {
  await PVGame.taskPlayAnim({
    dict: 'invalid_dict',
    anim: 'invalid_anim'
  });
} catch (error) {
  console.error('Animation failed:', error.message);
  // Play fallback animation
  await PVGame.taskPlayAnim({
    dict: 'amb_misc@world_human_bartender@male_a@base',
    anim: 'base'
  });
}
```

## Animation Flags Reference

Common animation flags you can use:

```typescript
const AnimFlags = {
  NORMAL: 0,
  REPEAT: 1,
  STOP_LAST_FRAME: 2,
  UPPERBODY: 16,
  ENABLE_PLAYER_CONTROL: 32,
  CANCELABLE: 120,
  OFFSET_POSITION: 1048576
};

// Usage
await PVGame.taskPlayAnim({
  dict: 'amb_misc@world_human_bartender@male_a@base',
  anim: 'base',
  flags: AnimFlags.REPEAT | AnimFlags.ENABLE_PLAYER_CONTROL
});
```

## Best Practices

### 1. Always Load Assets First
```typescript
// Good
await PVGame.loadModel('A_M_M_VALDEPUTY_01');
const ped = PVGame.createPed('A_M_M_VALDEPUTY_01', x, y, z, heading);

// Bad - may fail if model isn't loaded
const ped = PVGame.createPed('A_M_M_VALDEPUTY_01', x, y, z, heading);
```

### 2. Handle Async Operations Properly
```typescript
// Good
try {
  await PVGame.taskPlayAnim({ dict: 'anim_dict', anim: 'anim_name' });
  console.log('Animation started successfully');
} catch (error) {
  console.error('Animation failed:', error);
}

// Bad - no error handling
PVGame.taskPlayAnim({ dict: 'anim_dict', anim: 'anim_name' });
```

### 3. Clean Up Resources
```typescript
// Clean up when resource stops
on('onResourceStop', (resourceName: string) => {
  if (resourceName === GetCurrentResourceName()) {
    PVGame.cleanupCharacters();
    // Clean up any created entities
  }
});
```

### 4. Use Cached Coordinates When Possible
```typescript
// Good for frequent access
const coords = PVGame.playerCoords(); // Uses cache

// Only when you need real-time accuracy
const coords = PVGame.playerCoords(true); // Forces update
```

## Troubleshooting

### Common Issues

**Animation not playing:**
- Ensure animation dictionary is loaded first
- Check animation name spelling
- Verify the ped exists and is valid

**Model not loading:**
- Check model name spelling
- Verify model exists in game files
- Use `HasModelLoaded()` to confirm loading

**Entity creation failing:**
- Ensure model is loaded first
- Check coordinates are valid
- Verify network permissions

### Debug Commands

```typescript
// Check if model is loaded
const isLoaded = HasModelLoaded(GetHashKey('A_M_M_VALDEPUTY_01'));

// Check if animation dictionary is loaded  
const animLoaded = HasAnimDictLoaded('amb_misc@world_human_bartender@male_a@base');

// Get entity information
const coords = GetEntityCoords(entityId, true);
const health = GetEntityHealth(entityId);
```

## Related Resources

- **[Customization Resource](customization-resource.md)** - Character appearance and clothing
- **[UI Resource](ui-resource.md)** - User interface integration
- **[Base Resource](base-resource.md)** - Core player management
- **[Init Resource](init-resource.md)** - Resource initialization

---

*For more examples and advanced usage, see the [Integration Guides](../integration-guides/) section.*
