# Init Resource API Documentation

The `init` resource provides initialization and dependency management for Pioneer Village resources. Use it to ensure your resources start in the correct order and wait for dependencies.

## Quick Start

```typescript
// Access the init resource API
import { PVInit } from '@lib/client';

// Register your resource for initialization tracking
PVInit.registerResource(GetCurrentResourceName());

// Wait for dependencies
await PVInit.initializedResource('base');
await PVInit.initializedResource('ui');

// Your initialization code here
setupMyResource();

// Signal that your resource is ready
PVInit.resolveResource(GetCurrentResourceName());
```

## Resource Registration

### Register Your Resource

```typescript
// Register your resource for initialization tracking
PVInit.registerResource(GetCurrentResourceName());

// Register with options
PVInit.registerResource(GetCurrentResourceName(), {
  resolveAfter: 10000,  // Auto-resolve after 10 seconds
  rejectAfter: 30000    // Auto-reject after 30 seconds
});
```

### Register Custom Initialization Points

```typescript
// Register a custom initialization point
PVInit.register('myComponent', {
  rejectAfter: 15000  // Fail if not initialized in 15 seconds
});

// Register with auto-resolution
PVInit.register('optionalFeature', {
  resolveAfter: 5000  // Auto-succeed after 5 seconds
});
```

## Waiting for Dependencies

### Wait for Resources

```typescript
// Wait for a single resource
await PVInit.initializedResource('base');

// Wait for multiple resources
await Promise.all([
  PVInit.initializedResource('base'),
  PVInit.initializedResource('ui'),
  PVInit.initializedResource('events')
]);
```

### Wait for Custom Initialization Points

```typescript
// Wait for a custom component
await PVInit.initialized('gameEngine');

// Wait with error handling
try {
  await PVInit.initialized('criticalComponent');
  console.log('Critical component ready');
} catch (error) {
  console.error('Critical component failed to initialize');
}
```

## Signaling Completion

### Resolve Resource Initialization

```typescript
// Signal that your resource is ready
PVInit.resolveResource(GetCurrentResourceName());

// Resolve a custom initialization point
PVInit.resolve('myComponent');
```

### Reject Resource Initialization

```typescript
// Signal that initialization failed
PVInit.rejectResource(GetCurrentResourceName());

// Reject a custom initialization point
PVInit.reject('myComponent');
```

## Common Patterns

### Basic Resource Initialization

```typescript
const initializeMyResource = async () => {
  const resourceName = GetCurrentResourceName();
  
  try {
    // Register for tracking
    PVInit.registerResource(resourceName);
    
    // Wait for dependencies
    await PVInit.initializedResource('base');
    await PVInit.initializedResource('ui');
    
    // Perform initialization
    setupEventHandlers();
    initializeComponents();
    
    // Signal completion
    PVInit.resolveResource(resourceName);
    
  } catch (error) {
    console.error('Initialization failed:', error);
    PVInit.rejectResource(resourceName);
  }
};

initializeMyResource();
```

### Progressive Initialization

```typescript
const initializeWithStages = async () => {
  const stages = [
    { name: 'core', deps: ['base'] },
    { name: 'ui', deps: ['ui', 'events'] },
    { name: 'game', deps: ['game'] },
    { name: 'features', deps: [] }
  ];
  
  for (const stage of stages) {
    console.log(`Initializing stage: ${stage.name}`);
    
    // Wait for stage dependencies
    await Promise.all(
      stage.deps.map(dep => PVInit.initializedResource(dep))
    );
    
    // Initialize stage
    await initializeStage(stage.name);
    
    // Register stage completion
    PVInit.resolve(`stage:${stage.name}`);
  }
  
  PVInit.resolveResource(GetCurrentResourceName());
};
```

### Conditional Initialization

```typescript
const initializeWithConditions = async () => {
  const init = PVInit;
  
  // Check if optional dependencies are available
  const hasAdvancedUI = await checkResourceAvailable('advanced-ui');
  const hasDatabase = await checkResourceAvailable('database');
  
  if (hasAdvancedUI) {
    await PVInit.initializedResource('advanced-ui');
    setupAdvancedFeatures();
  }
  
  if (hasDatabase) {
    await PVInit.initializedResource('database');
    setupDatabaseFeatures();
  }
  
  // Always wait for core dependencies
  await PVInit.initializedResource('base');
  setupCoreFeatures();
  
  PVInit.resolveResource(GetCurrentResourceName());
};

const checkResourceAvailable = async (resourceName: string): Promise<boolean> => {
  try {
    await Promise.race([
      PVInit.initializedResource(resourceName),
      new Promise((_, reject) => setTimeout(reject, 1000))
    ]);
    return true;
  } catch {
    return false;
  }
};
```

### Retry Logic

```typescript
const initializeWithRetry = async (maxRetries = 3) => {
  const resourceName = GetCurrentResourceName();
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Initialization attempt ${attempt}/${maxRetries}`);
      
      await performInitialization();
      PVInit.resolveResource(resourceName);
      return;
      
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        PVInit.rejectResource(resourceName);
        throw new Error(`Initialization failed after ${maxRetries} attempts`);
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};
```

## Timeout Handling

### Auto-Resolution

```typescript
// Register with automatic resolution after timeout
PVInit.register('optionalComponent', {
  resolveAfter: 10000  // Auto-resolve after 10 seconds
});

// Continue with initialization
await PVInit.initialized('optionalComponent');
// This will succeed after 10 seconds even if never manually resolved
```

### Auto-Rejection

```typescript
// Register with automatic rejection after timeout
PVInit.register('criticalComponent', {
  rejectAfter: 5000  // Auto-reject after 5 seconds
});

try {
  await PVInit.initialized('criticalComponent');
} catch (error) {
  console.error('Critical component failed to initialize within timeout');
  // Handle failure
}
```

### Manual Timeout Control

```typescript
const initializeWithTimeout = async () => {
  const timeout = 30000; // 30 seconds
  
  const initPromise = performInitialization();
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Initialization timeout')), timeout)
  );
  
  try {
    await Promise.race([initPromise, timeoutPromise]);
    PVInit.resolveResource(GetCurrentResourceName());
  } catch (error) {
    console.error('Initialization failed or timed out:', error);
    PVInit.rejectResource(GetCurrentResourceName());
  }
};
```

## Error Handling

### Basic Error Handling

```typescript
try {
  await PVInit.initializedResource('criticalDependency');
  console.log('Dependency ready');
} catch (error) {
  console.error('Dependency failed:', error);
  // Implement fallback or fail gracefully
}
```

### Graceful Degradation

```typescript
const initializeWithFallbacks = async () => {
  const init = PVInit;
  
  // Try to wait for advanced features
  try {
    await PVInit.initializedResource('advanced-features');
    setupAdvancedMode();
  } catch {
    console.log('Advanced features not available, using basic mode');
    setupBasicMode();
  }
  
  // Always ensure core features work
  await PVInit.initializedResource('base');
  setupCoreFeatures();
  
  PVInit.resolveResource(GetCurrentResourceName());
};
```

### Resource Health Checking

```typescript
const isResourceHealthy = async (resourceName: string): Promise<boolean> => {
  try {
    await PVInit.initializedResource(resourceName);
    return true;
  } catch {
    return false;
  }
};

const checkDependencyHealth = async () => {
  const dependencies = ['base', 'ui', 'events', 'game'];
  const healthStatus = await Promise.all(
    dependencies.map(async dep => ({
      name: dep,
      healthy: await isResourceHealthy(dep)
    }))
  );
  
  const unhealthy = healthStatus.filter(status => !status.healthy);
  if (unhealthy.length > 0) {
    console.warn('Unhealthy dependencies:', unhealthy.map(s => s.name));
  }
  
  return healthStatus;
};
```

## Integration Examples

### Resource with UI Dependencies

```typescript
const initializeUIResource = async () => {
  const init = PVInit;
  const resourceName = GetCurrentResourceName();
  
  try {
    // Register for tracking
    PVInit.registerResource(resourceName);
    
    // Wait for UI system
    await PVInit.initializedResource('ui');
    
    // Setup UI components
    setupUIComponents();
    registerUIEventHandlers();
    
    // Wait for base functionality
    await PVInit.initializedResource('base');
    
    // Connect UI to game logic
    connectUIToGame();
    
    // Signal completion
    PVInit.resolveResource(resourceName);
    
  } catch (error) {
    console.error('UI resource initialization failed:', error);
    PVInit.rejectResource(resourceName);
  }
};
```

### Database-Dependent Resource

```typescript
const initializeDatabaseResource = async () => {
  const init = PVInit;
  const resourceName = GetCurrentResourceName();
  
  try {
    PVInit.registerResource(resourceName);
    
    // Wait for database
    await PVInit.initializedResource('database');
    
    // Initialize database connections
    await setupDatabaseConnection();
    
    // Run migrations if needed
    await runMigrations();
    
    // Setup data access layer
    setupDataAccess();
    
    PVInit.resolveResource(resourceName);
    
  } catch (error) {
    console.error('Database resource initialization failed:', error);
    PVInit.rejectResource(resourceName);
  }
};
```

### Multi-Component Resource

```typescript
const initializeComplexResource = async () => {
  const init = PVInit;
  const resourceName = GetCurrentResourceName();
  
  // Register main resource and components
  PVInit.registerResource(resourceName);
  PVInit.register('component-a');
  PVInit.register('component-b');
  PVInit.register('component-c');
  
  try {
    // Wait for dependencies
    await PVInit.initializedResource('base');
    
    // Initialize components in parallel
    const componentPromises = [
      initializeComponentA().then(() => PVInit.resolve('component-a')),
      initializeComponentB().then(() => PVInit.resolve('component-b')),
      initializeComponentC().then(() => PVInit.resolve('component-c'))
    ];
    
    await Promise.all(componentPromises);
    
    // All components ready, finalize resource
    finalizeResource();
    PVInit.resolveResource(resourceName);
    
  } catch (error) {
    console.error('Complex resource initialization failed:', error);
    PVInit.rejectResource(resourceName);
  }
};
```

## Best Practices

### 1. Always Register Your Resource
```typescript
// Good - register immediately
PVInit.registerResource(GetCurrentResourceName());

// Bad - forgetting to register
// (other resources won't be able to wait for you)
```

### 2. Handle Initialization Errors
```typescript
// Good - proper error handling
try {
  await PVInit.initializedResource('dependency');
  PVInit.resolveResource(GetCurrentResourceName());
} catch (error) {
  console.error('Initialization failed:', error);
  PVInit.rejectResource(GetCurrentResourceName());
}

// Bad - no error handling
await PVInit.initializedResource('dependency');
PVInit.resolveResource(GetCurrentResourceName());
```

### 3. Use Timeouts for Non-Critical Dependencies
```typescript
// Good - timeout for optional features
PVInit.register('optionalFeature', {
  resolveAfter: 5000
});

// Bad - waiting indefinitely for optional features
await PVInit.initialized('optionalFeature');
```

### 4. Provide Initialization Feedback
```typescript
// Good - clear progress indication
console.log(`[${GetCurrentResourceName()}] Starting initialization...`);
await PVInit.initializedResource('base');
console.log(`[${GetCurrentResourceName()}] Dependencies ready, initializing...`);
setupComponents();
console.log(`[${GetCurrentResourceName()}] Initialization complete!`);
```

## Troubleshooting

### Common Issues

**Resource never initializes:**
- Check if dependencies are correctly named
- Verify dependencies actually exist and start
- Look for circular dependency chains

**Initialization hangs:**
- Check for missing `resolve` calls
- Verify timeout settings are appropriate
- Look for deadlocks in dependency chains

**Random initialization failures:**
- Add retry logic for network-dependent operations
- Increase timeout values for complex initialization
- Check for race conditions in parallel initialization

### Debug Commands

```typescript
// Check if a resource has initialized
const isInitialized = PVInit.initialized('resourceName');
if (isInitialized) {
  console.log('Resource is initialized');
} else {
  console.log('Resource is not yet initialized');
}
```

### Monitoring Initialization

```typescript
const monitorInitialization = () => {
  const checkInterval = setInterval(() => {
    const resourceStatus = checkAllResourceStatus();
    if (resourceStatus.allComplete) {
      console.log('All resources initialized successfully');
      clearInterval(checkInterval);
    } else {
      console.log('Pending resources:', resourceStatus.pending);
    }
  }, 5000);
};
```

## Related Resources

- **[Resource Development Guide](../resource-development/creating-resources.md)** - Creating new resources
- **[Architecture Overview](../getting-started/architecture-overview.md)** - System architecture
- **[Game Resource](game-resource.md)** - Core game functionality
- **[Base Resource](base-resource.md)** - Foundation utilities

---

*For more information on resource dependencies and initialization patterns, see the [Architecture Documentation](../architecture/).*
