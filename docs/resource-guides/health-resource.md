# Health Resource API Documentation

The `health` resource provides a comprehensive survival and medical system including bone-based damage, food/water mechanics, temperature effects, and injury simulation. Use it to manage player wellness and create realistic survival gameplay.

## Quick Start

```typescript
// Access the health resource API
import { PVHealth } from '@lib/client';

// Increase player's food and water
PVHealth.increaseFoodLevel(25);     // Add 25% food
PVHealth.increaseWaterLevel(30);    // Add 30% water

// Control movement speed (injury simulation)
PVHealth.limitWalkSpeed(1);         // Slow walk (0-3 scale)
PVHealth.clearWalkSpeed();          // Reset to normal speed

// Get current health data (server-side)
import { PVHealth } from '@lib/server';
const healthData = await PVHealth.getHealthMetadata(characterId);
const foodWater = await PVHealth.getFoodAndDrink(characterId);
```

## Food and Water System

### Increase Food Level

```typescript
// Add food to player's hunger
health.increaseFoodLevel(amount: number): void

// Examples
health.increaseFoodLevel(25);     // Restore 25% hunger
health.increaseFoodLevel(50);     // Large meal
health.increaseFoodLevel(10);     // Small snack

// Typical food values
const foodValues = {
  'apple': 15,
  'bread': 30,
  'stew': 50,
  'candy': 5,
  'cooked_meat': 40
};
```

### Increase Water Level

```typescript
// Add water to player's thirst
health.increaseWaterLevel(amount: number): void

// Examples
health.increaseWaterLevel(20);    // Small drink
health.increaseWaterLevel(40);    // Full glass
health.increaseWaterLevel(60);    // Large bottle

// Typical drink values
const drinkValues = {
  'water_bottle': 40,
  'coffee': 25,
  'beer': 30,
  'whiskey': 20,
  'milk': 35
};
```

### Food and Water Usage Patterns

```typescript
// Restaurant/cooking system integration
const feedPlayer = (foodItem: string, playerId: number) => {
  // PVHealth is imported at top of file
  const foodData = getFoodData(foodItem);
  
  if (foodData) {
    // Increase both food and water if applicable
    health.increaseFoodLevel(foodData.hunger);
    
    if (foodData.thirst) {
      health.increaseWaterLevel(foodData.thirst);
    }
    
    // Notify player
    TriggerClientEvent('notification:show', playerId, 
      `You consumed ${foodData.name} (+${foodData.hunger}% hunger)`
    );
  }
};

// Survival mechanics - checking levels
const checkSurvivalNeeds = async (characterId: number) => {
  // Server-side health access
  import { PVHealth } from '@lib/server';
  const needs = await PVHealth.getFoodAndDrink(characterId);
  
  if (needs.food < 20) {
    TriggerClientEvent('notification:show', characterId, 
      'You are getting hungry!', 'warning'
    );
  }
  
  if (needs.drink < 15) {
    TriggerClientEvent('notification:show', characterId, 
      'You are getting thirsty!', 'warning'
    );
  }
};
```

## Movement Control System

### Limit Walk Speed

```typescript
// Control player movement speed (injury simulation)
health.limitWalkSpeed(speed: number): void

// Speed levels:
// 0 = Unable to move
// 1 = Very slow walk
// 2 = Slow walk  
// 3 = Normal walk (no running)
```

### Clear Walk Speed

```typescript
// Reset movement to normal speed
health.clearWalkSpeed(): void

// Removes all movement limitations
```

### Movement Control Usage Patterns

```typescript
// Injury system integration
const applyInjuryEffects = (boneData: any) => {
  // PVHealth is imported at top of file
  let speedLimit = 3; // Normal
  
  // Check for leg injuries
  if (boneData.leftLeg?.broken || boneData.rightLeg?.broken) {
    speedLimit = 1; // Very slow with broken leg
  } else if (boneData.leftLeg?.health < 50 || boneData.rightLeg?.health < 50) {
    speedLimit = 2; // Slow with injured leg
  }
  
  // Check for severe injuries
  if (boneData.torso?.health < 30) {
    speedLimit = Math.min(speedLimit, 1); // Critical injury
  }
  
  health.limitWalkSpeed(speedLimit);
};

// Temporary effects system
const applyTemporarySlowness = (duration: number = 30000) => {
  // PVHealth is imported at top of file
  
  // Apply slowness
  health.limitWalkSpeed(1);
  
  // Remove after duration
  setTimeout(() => {
    health.clearWalkSpeed();
  }, duration);
};

// Environmental effects
const applyEnvironmentalEffects = (temperature: number) => {
  // PVHealth is imported at top of file
  
  if (temperature < -10) {
    // Extreme cold slows movement
    health.limitWalkSpeed(2);
  } else if (temperature > 40) {
    // Extreme heat slows movement
    health.limitWalkSpeed(2);
  } else {
    // Normal temperature
    health.clearWalkSpeed();
  }
};
```

## Health Data Access (Server-Side)

### Get Health Metadata

```typescript
// Get complete health status
health.getHealthMetadata(characterId: number): Promise<HealthMetadata>

// Returns comprehensive health data
interface HealthMetadata {
  bones: {
    [boneName: string]: {
      health: number;        // 0-100%
      broken: boolean;
      shot: boolean;
      slashed: boolean;
      burned: boolean;
      infected: boolean;
      bandaged: boolean;
      stabilized: boolean;
    }
  };
  bloodLevel: number;      // 0-5000ml
  temperature: number;     // Body temperature
  stamina: number;         // Current stamina
  // ... other health data
}
```

### Get Food and Drink Levels

```typescript
// Get basic survival data
health.getFoodAndDrink(characterId: number): Promise<FoodDrinkData>

// Returns food and water levels
interface FoodDrinkData {
  food: number;    // 0-100%
  drink: number;   // 0-100%
}
```

### Health Data Usage Examples

```typescript
// Medical examination system
const performMedicalExam = async (doctorId: number, patientId: number) => {
  // PVHealth is imported at top of file
  
  try {
    const healthData = await health.getHealthMetadata(patientId);
    const survivalData = await health.getFoodAndDrink(patientId);
    
    // Analyze health status
    const injuries = [];
    for (const [boneName, boneData] of Object.entries(healthData.bones)) {
      if (boneData.health < 100 || boneData.broken) {
        injuries.push({
          bone: boneName,
          severity: getSeverity(boneData),
          conditions: getConditions(boneData)
        });
      }
    }
    
    // Create medical report
    const report = {
      patientId,
      bloodLevel: healthData.bloodLevel,
      temperature: healthData.temperature,
      nutrition: {
        food: survivalData.food,
        water: survivalData.drink
      },
      injuries,
      timestamp: Date.now()
    };
    
    // Send to doctor
    TriggerClientEvent('medical:examResults', doctorId, report);
    
  } catch (error) {
    console.error('Medical exam failed:', error);
  }
};

// Hospital admission system
const checkHospitalAdmission = async (characterId: number) => {
  // Server-side health access
  import { PVHealth } from '@lib/server';
  const healthData = await PVHealth.getHealthMetadata(characterId);
  
  let criticalInjuries = 0;
  let bloodLoss = false;
  
  // Check for critical conditions
  for (const boneData of Object.values(healthData.bones)) {
    if (boneData.health < 25) criticalInjuries++;
    if (boneData.shot && !boneData.bandaged) bloodLoss = true;
  }
  
  const requiresAdmission = 
    criticalInjuries >= 3 || 
    healthData.bloodLevel < 2500 || 
    bloodLoss;
  
  return {
    admitted: requiresAdmission,
    reason: requiresAdmission ? 
      'Critical injuries requiring medical attention' : 
      'Stable condition',
    recommendations: generateRecommendations(healthData)
  };
};
```

## Event Integration

### Damage Events

```typescript
// Listen for damage events
on('health:client:boneSpeedLimit', (boneData: any) => {
  // Handle movement limitations from injuries
  updateMovementSpeed(boneData);
});

// Temperature effects
on('health:client:warmthSpeedLimit', (temperature: number) => {
  // Handle environmental movement effects
  applyTemperatureEffects(temperature);
});

// Fall damage
on('health:client:trigger-fall-damage', (fallData: any) => {
  // Process fall damage calculations
  handleFallDamage(fallData);
});
```

### Integration with Other Systems

```typescript
// Weapon system integration
on('weapon:playerDamaged', (weaponType: string, damage: number, bodyPart: string) => {
  // Health system automatically processes damage
  // No direct intervention needed - system handles bone damage
  console.log(`Player damaged by ${weaponType} on ${bodyPart} for ${damage} damage`);
});

// Medical item usage
on('inventory:useItem', (itemId: string, itemData: any) => {
  // PVHealth is imported at top of file
  
  switch (itemData.type) {
    case 'food':
      health.increaseFoodLevel(itemData.hunger || 20);
      break;
      
    case 'drink':
      health.increaseWaterLevel(itemData.thirst || 25);
      break;
      
    case 'medicine':
      // Let health system handle complex medical items
      TriggerClientEvent('health:useMedicine', source, itemData);
      break;
  }
});
```

## Bone-Based Damage System

### Understanding Body Parts

The health system tracks 18 individual body parts:

```typescript
// Major body regions and their bones
const bodyParts = {
  head: ['SKEL_HEAD'],
  torso: ['SKEL_SPINE_ROOT', 'SKEL_SPINE1', 'SKEL_SPINE2'],
  arms: ['SKEL_L_UPPERARM', 'SKEL_R_UPPERARM', 'SKEL_L_FOREARM', 'SKEL_R_FOREARM'],
  hands: ['SKEL_L_HAND', 'SKEL_R_HAND'],
  legs: ['SKEL_L_THIGH', 'SKEL_R_THIGH', 'SKEL_L_CALF', 'SKEL_R_CALF'],
  feet: ['SKEL_L_FOOT', 'SKEL_R_FOOT']
};

// Bone conditions
interface BoneStatus {
  health: number;        // 0-100%
  broken: boolean;       // Fracture/break
  shot: boolean;         // Gunshot wound
  slashed: boolean;      // Cut/slash wound
  burned: boolean;       // Burn damage
  infected: boolean;     // Infection status
  bandaged: boolean;     // Treated with bandage
  stabilized: boolean;   // Stabilized with splint
}
```

### Damage Types and Effects

```typescript
// Different damage types affect bones differently
const damageTypes = {
  COMPONENT_HEALTH_DEFAULT: 'default',
  COMPONENT_HEALTH_FALL: 'fall',
  COMPONENT_HEALTH_BLUNT: 'blunt',
  COMPONENT_HEALTH_SHARP: 'sharp',
  COMPONENT_HEALTH_GUN: 'gun',
  COMPONENT_HEALTH_FIRE: 'fire',
  COMPONENT_HEALTH_EXPLOSIVE: 'explosive',
  COMPONENT_HEALTH_POISON: 'poison'
};

// Each damage type has different effects:
// - Gun damage: Causes bleeding, infection risk
// - Fall damage: Can break bones
// - Fire damage: Burns that spread
// - Sharp damage: Cuts that bleed
// - Blunt damage: Bruising, potential breaks
```

## Temperature and Environmental Effects

### Environmental Integration

```typescript
// Environmental temperature affects health
on('temperature_change', (envTemp: number, clothingWarmth: number) => {
  // Health system automatically calculates:
  // - Body temperature regulation
  // - Food/water consumption rates
  // - Movement speed adjustments
  // - Survival warnings
});

// Check player's thermal status
const checkThermalComfort = async (characterId: number) => {
  // Server-side health access
  import { PVHealth } from '@lib/server';
  const healthData = await PVHealth.getHealthMetadata(characterId);
  const bodyTemp = healthData.temperature;
  
  if (bodyTemp < 36.5) {
    return 'hypothermia_risk';
  } else if (bodyTemp > 38.0) {
    return 'hyperthermia_risk';
  } else {
    return 'normal';
  }
};
```

## Medical Treatment Integration

### Treatment Items

```typescript
// Medical items that work with the health system
const medicalItems = {
  bandage: {
    effect: 'stops_bleeding',
    targets: ['shot', 'slashed'],
    usage: 'Apply to wounds to stop bleeding'
  },
  
  splint: {
    effect: 'stabilizes_bone',
    targets: ['broken'],
    usage: 'Stabilize broken bones'
  },
  
  oxy: {
    effect: 'treats_infection',
    targets: ['infected'],
    usage: 'Antibiotic treatment'
  },
  
  morphine: {
    effect: 'pain_relief',
    targets: ['all_injuries'],
    usage: 'Temporary pain management'
  }
};

// Example medical treatment
const treatPatient = (doctorId: number, patientId: number, treatment: string) => {
  // Health system handles the actual treatment effects
  // Trigger treatment event
  TriggerClientEvent('health:applyTreatment', patientId, {
    type: treatment,
    administeredBy: doctorId,
    timestamp: Date.now()
  });
};
```

## Debug and Admin Commands

### Available Commands

```typescript
// Admin/debug commands for testing
const adminCommands = {
  '/heal': 'Restore full health',
  '/eatDrink': 'Restore food/water to 100%',
  '/damageBone <bone> <amount>': 'Damage specific bone',
  '/shootBone <bone> <shots>': 'Simulate gunshot wounds',
  '/bloodLoss <amount>': 'Reduce blood level',
  '/inspect': 'Open bone status UI',
  '/temperature <temp>': 'Set environmental temperature'
};

// Usage examples
RegisterCommand('heal', () => {
  // Full health restoration
  TriggerEvent('health:admin:fullHeal');
}, false);

RegisterCommand('damage', (source: number, args: string[]) => {
  const bone = args[0];
  const amount = parseInt(args[1]) || 25;
  
  TriggerEvent('health:admin:damageBone', bone, amount);
}, false);
```

## Integration Examples

### Restaurant/Food System

```typescript
// Complete food service integration
const serveMeal = (customerId: number, mealData: any) => {
  // PVHealth is imported at top of file
  
  // Apply food benefits
  health.increaseFoodLevel(mealData.hunger);
  health.increaseWaterLevel(mealData.thirst);
  
  // Special meal effects
  if (mealData.healing) {
    // Some meals provide healing benefits
    TriggerClientEvent('health:naturalHealing', customerId, mealData.healing);
  }
  
  // Update UI
  TriggerClientEvent('notification:show', customerId, 
    `You enjoyed ${mealData.name}! (+${mealData.hunger}% hunger, +${mealData.thirst}% thirst)`
  );
};
```

### Injury Roleplay System

```typescript
// Create realistic injury scenarios
const createInjuryScenario = async (playerId: number, scenario: string) => {
  // PVHealth is imported at top of file
  
  switch (scenario) {
    case 'horse_fall':
      // Simulate falling from horse
      health.limitWalkSpeed(2);
      TriggerClientEvent('health:simulateFall', playerId, { height: 3 });
      break;
      
    case 'bar_fight':
      // Simulate bar fight injuries
      TriggerClientEvent('health:simulatePunch', playerId, { 
        bone: 'SKEL_HEAD', 
        force: 'medium' 
      });
      break;
      
    case 'gunfight':
      // Simulate gunshot wound
      TriggerClientEvent('health:simulateGunshot', playerId, { 
        bone: 'SKEL_L_UPPERARM',
        weapon: 'revolver'
      });
      break;
  }
};
```

## Best Practices

### 1. Food and Water Management
```typescript
// Good - reasonable portions
health.increaseFoodLevel(25);  // Quarter meal
health.increaseWaterLevel(40); // Full glass

// Bad - unrealistic amounts
health.increaseFoodLevel(100); // Instant full
```

### 2. Movement Limitations
```typescript
// Good - temporary effects with cleanup
health.limitWalkSpeed(1);
setTimeout(() => health.clearWalkSpeed(), 30000);

// Bad - permanent limitation without cleanup
health.limitWalkSpeed(0); // Player stuck forever
```

### 3. Health Data Usage
```typescript
// Good - handle async properly
const healthData = await health.getHealthMetadata(charId);
if (healthData.bloodLevel < 2000) {
  // Handle low blood
}

// Bad - not awaiting promise
const healthData = health.getHealthMetadata(charId);
console.log(healthData.bloodLevel); // undefined
```

### 4. Error Handling
```typescript
// Good - handle failures gracefully
try {
  const data = await health.getFoodAndDrink(charId);
  processHealthData(data);
} catch (error) {
  console.error('Health data unavailable:', error);
  // Provide fallback behavior
}
```

## Troubleshooting

### Common Issues

**Food/water not updating:**
- Ensure character is properly loaded
- Check if health resource is started and initialized
- Verify character ID is correct

**Movement speed not changing:**
- Check if other systems are overriding speed
- Ensure `clearWalkSpeed()` is called when appropriate
- Verify speed value is in valid range (0-3)

**Health data returns null:**
- Character may not be fully initialized
- Health metadata might not be loaded yet
- Check server-side ClientRPC.Server connection

### Debug Commands

```typescript
// Check health system status
console.log('Health resource state:', GetResourceState('health'));

// Test food/water functions
PVHealth.increaseFoodLevel(10);
PVHealth.increaseWaterLevel(10);

// Check movement speed
PVHealth.limitWalkSpeed(1);
setTimeout(() => PVHealth.clearWalkSpeed(), 5000);
```

## Related Resources

- **[Base Resource](base-resource.md)** - Character data integration
- **[Game Resource](game-resource.md)** - Player entity management
- **[UI Resource](ui-resource.md)** - Health status display
- **[Inventory Resource](inventory-resource.md)** - Medical item integration

---

*The health resource provides the foundation for realistic survival gameplay and medical roleplay in Pioneer Village.*
