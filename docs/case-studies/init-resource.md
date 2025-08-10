# Case Study: Init Resource Deep Dive

The `resources/[core]/init/` resource serves as the foundational initialization and dependency management system for Pioneer Village. This case study provides a comprehensive analysis of its architecture, implementation, and design patterns.

## Resource Overview

### Purpose
The init resource is the backbone of Pioneer Village's resource lifecycle management, providing:
- **Promise-based initialization tracking** for reliable startup coordination
- **Resource dependency management** to ensure proper startup order
- **Cross-resource initialization state communication** via typed exports
- **Automatic resource registration** and lifecycle monitoring

### Architecture Principles
- **Singleton Pattern** - Single source of truth for initialization state
- **Promise-based API** - Modern async/await compatible initialization
- **Type Safety** - Full TypeScript coverage with strict typing
- **Event-driven** - Reactive to FiveM resource lifecycle events

## File Structure Analysis

```
resources/[core]/init/
├── build/                          # Compiled JavaScript output
│   ├── client.js                   # Client bundle (24KB)
│   ├── client.js.map               # Source map for debugging
│   ├── server.js                   # Server bundle (1KB)
│   └── server.js.map               # Source map for debugging
├── src/
│   ├── client/
│   │   ├── client.ts               # 4 lines - Entry point
│   │   ├── exports.ts              # 30 lines - Export definitions
│   │   ├── managers/
│   │   │   └── init-manager.ts     # 123 lines - Core logic
│   │   ├── tsconfig.json           # Client TypeScript config
│   │   └── types.d.ts              # Client-specific types
│   ├── server/
│   │   ├── server.ts               # 3 lines - Minimal server
│   │   ├── tsconfig.json           # Server TypeScript config
│   │   └── types.d.ts              # Server-specific types
│   └── types.d.ts                  # Shared type definitions
├── fxmanifest.lua                  # FiveM resource manifest
├── package.json                    # Build configuration
└── rspack.config.js                # Webpack alternative config
```

## Core Implementation Deep Dive

### InitManager Class Architecture

```typescript
class InitManager {
  protected static instance: InitManager;
  
  // State Management
  protected _resourcePrefix = 'resource::';
  protected _initializedResources: Set<string> = new Set();
  protected _initializedResolver: Map<string, () => void> = new Map();
  protected _initializedRejector: Map<string, () => void> = new Map();
  protected _initialized: Map<string, Promise<void>> = new Map();
  
  protected resourceInitialized = false;
}
```

**Key Design Decisions:**
- **Maps for Promise Management**: Separate resolvers and rejectors for clean promise handling
- **Set for Completion Tracking**: Fast O(1) lookup for completed initializations
- **String Prefixing**: Namespace separation between generic names and resources
- **Static Singleton**: Ensures single initialization state across the application

### Initialization Registration System

```typescript
register: Init.register = (name, options = {}) => {
  // Handle resource restart scenarios
  if (options.reset && this._initialized.has(name)) {
    this.reject(name);
    this._initialized.delete(name);
    this._initializedResolver.delete(name);
    this._initializedRejector.delete(name);
  }
  
  if (!this._initialized.has(name)) {
    // Create promise with external resolver/rejector
    const promise = new Promise<void>((resolve, reject) => {
      this._initializedResolver.set(name, resolve);
      this._initializedRejector.set(name, reject);
    });
    
    // Error handling
    promise.catch(() => {
      Log('Initialization failed:', name);
    });
    
    this._initialized.set(name, promise);

    // Optional timeout handling
    if (typeof options.resolveAfter === 'number') {
      setTimeout(() => this.resolve(name), options.resolveAfter);
    }
    
    if (typeof options.rejectAfter === 'number') {
      setTimeout(() => this.reject(name), options.rejectAfter);
    }
  }
};
```

**Advanced Features:**
1. **Reset Capability**: Handles resource restarts gracefully
2. **External Promise Control**: Resolvers/rejectors stored separately for external triggering
3. **Timeout Options**: Automatic resolution/rejection for non-critical dependencies
4. **Error Propagation**: Centralized error handling with logging

### Resource Lifecycle Integration

```typescript
constructor() {
  // Register all existing resources at startup
  const numResources = GetNumResources();
  for (let n = numResources; n--; ) {
    const resourceName = GetResourceByFindIndex(n);
    if (resourceName) {
      this.registerResource(resourceName);
    }
  }

  // Export initialization status check
  exports('initialized', () => {
    return this.resourceInitialized;
  });

  // Dynamic resource management
  on('onResourceStart', (resourceName: string) => {
    Log('Resource starting:', resourceName);
    this.registerResource(resourceName);
  });

  on('onResourceStop', (resourceName: string) => {
    const resourceKey = `${this._resourcePrefix}${resourceName}`;
    if (!this._initializedResources.has(resourceKey)) {
      Log('Resource stopped before initialization:', resourceName);
      this.rejectResource(resourceName);
      this.registerResource(resourceName, { reset: true });
    }
  });
}
```

**Lifecycle Management Features:**
- **Automatic Discovery**: Finds and registers all existing resources at startup
- **Dynamic Registration**: Responds to new resources starting
- **Failure Handling**: Rejects promises for resources that stop before initializing
- **Restart Support**: Automatically re-registers resources with reset flag

## Type System Design

### Core Type Definitions

```typescript
declare namespace Init {
  type Options = {
    reset?: boolean;           // Force re-initialization
    resolveAfter?: number;     // Auto-resolve timeout (ms)
    rejectAfter?: number;      // Auto-reject timeout (ms)
  };

  // Function signature types
  type register = (name: string, options?: Options) => void;
  type registerResource = (resourceName: string, options?: Options) => void;
  type initialized = (name: string) => Promise<void> | undefined;
  type initializedResource = (resourceName: string) => Promise<void> | undefined;
  type resolve = (name: string) => void;
  type resolveResource = (resourceName: string) => void;
  type reject = (name: string) => void;
  type rejectResource = (resourceName: string) => void;
}
```

**Type System Benefits:**
- **Consistent API**: Same signature across all environment contexts
- **Optional Configuration**: Flexible initialization behavior
- **Promise Return Types**: Type-safe async operations
- **Namespace Organization**: Clean separation of concerns

### Export Interface Integration

```typescript
// Client-side export interface extension
declare interface ClientExports {
  init: Init.ClientExports;
}

declare namespace Init {
  type ClientExports = {
    register: register;
    registerResource: registerResource;
    initialized: initialized;
    initializedResource: initializedResource;
    resolve: resolve;
    resolveResource: resolveResource;
    reject: reject;
    rejectResource: rejectResource;
  };
}
```

**Integration Pattern:**
- **Global Interface Extension**: Adds init to ClientExports for type safety
- **Complete API Surface**: All functionality available through exports
- **IDE Support**: Full IntelliSense and type checking

## Usage Patterns and Examples

### Basic Resource Initialization

```typescript
// In a resource's client.ts
import { initManager } from '@lib/client';

const resourceName = GetCurrentResourceName();

const initialize = async () => {
  try {
    // Wait for dependencies
    await initManager.initializedResource('base');
    await initManager.initializedResource('ui');
    
    // Perform initialization
    setupLocalComponents();
    registerEventHandlers();
    
    // Signal completion
    initManager.resolveResource(resourceName);
    
  } catch (error) {
    console.error('Initialization failed:', error);
    initManager.rejectResource(resourceName);
  }
};

initialize();
```

### Cross-Resource Dependency Chain

```typescript
// Resource A depends on Resource B and C
async function initializeComplexResource() {
  const init = global.exports.init;
  
  try {
    // Wait for multiple dependencies in parallel
    await Promise.all([
      init.initializedResource('base'),
      init.initializedResource('ui'),
      init.initializedResource('database')
    ]);
    
    console.log('All dependencies ready');
    
    // Sequential initialization of components
    await init.initialized('gameEngine');
    await init.initialized('playerManager');
    
    // Initialize this resource's components
    setupAdvancedFeatures();
    
    init.resolveResource('complexResource');
    
  } catch (error) {
    console.error('Complex resource initialization failed:', error);
    init.rejectResource('complexResource');
  }
}
```

### Timeout-based Initialization

```typescript
// Register with automatic timeouts
const init = global.exports.init;

// Critical component with strict timeout
init.register('criticalSystem', {
  rejectAfter: 5000  // Fail if not initialized in 5 seconds
});

// Optional component with graceful fallback
init.register('optionalFeature', {
  resolveAfter: 10000  // Auto-succeed after 10 seconds
});

// Handle optional dependencies
try {
  await init.initialized('optionalFeature');
  enableAdvancedFeatures();
} catch {
  console.log('Optional features not available, using basic mode');
  enableBasicFeatures();
}
```

### Progressive Initialization

```typescript
// Multi-stage initialization with progress reporting
async function progressiveInit() {
  const stages = [
    { name: 'core', deps: ['base'] },
    { name: 'ui', deps: ['core', 'ui'] },
    { name: 'game', deps: ['ui', 'events'] },
    { name: 'features', deps: ['game', 'database'] }
  ];
  
  for (const stage of stages) {
    console.log(`Initializing stage: ${stage.name}`);
    
    // Wait for stage dependencies
    await Promise.all(
      stage.deps.map(dep => global.exports.init.initializedResource(dep))
    );
    
    // Initialize stage components
    await initializeStage(stage.name);
    
    // Register stage completion
    global.exports.init.resolve(`stage:${stage.name}`);
  }
  
  console.log('Progressive initialization complete');
}
```

## Build System Integration

### Development Workflow

```json
// package.json scripts
{
  "scripts": {
    "build": "rspack --mode production",
    "watch": "rspack --mode development --watch",
    "prettier": "prettier src/**/*.{ts,tsx} --write"
  }
}
```

**Development Features:**
- **Hot Reload**: Watch mode automatically rebuilds on changes
- **Source Maps**: Full debugging support in development
- **Type Checking**: Integrated TypeScript compilation
- **Code Formatting**: Automatic code style enforcement

### Build Output Analysis

```
build/
├── client.js          # 24KB - Contains InitManager + exports
├── client.js.map      # Source map for client debugging
├── server.js          # 1KB - Minimal server functionality  
└── server.js.map      # Source map for server debugging
```

**Performance Characteristics:**
- **Small Bundle Size**: Efficient compilation with tree shaking
- **Fast Startup**: Minimal runtime overhead
- **Memory Efficient**: Singleton pattern reduces memory usage

## Integration with Pioneer Village Framework

### Library Integration

```typescript
// In lib/client/index.ts
export { initManager } from '@resources/init/src/client/managers/init-manager';

// Usage in other resources
import { initManager } from '@lib/client';
```

**Framework Integration Points:**
- **Library Re-export**: Available through central lib package
- **Type System**: Integrated with global ClientExports interface
- **Logging**: Uses Pioneer Village logging system
- **Event System**: Compatible with PVEvents framework

### Resource Communication Patterns

```typescript
// Inter-resource communication example
const checkResourceStatus = async (resourceName: string): Promise<boolean> => {
  try {
    await global.exports.init.initializedResource(resourceName);
    return true;
  } catch {
    return false;
  }
};

// Conditional feature loading
const initializeConditionalFeatures = async () => {
  const hasAdvancedUI = await checkResourceStatus('advanced-ui');
  const hasDatabase = await checkResourceStatus('database');
  
  if (hasAdvancedUI && hasDatabase) {
    await setupAdvancedFeatures();
  } else {
    await setupBasicFeatures();
  }
};
```

## Error Handling and Resilience

### Robust Error Handling

```typescript
// Comprehensive error handling pattern
const robustInitialization = async () => {
  const maxRetries = 3;
  const retryDelay = 2000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await initializationLogic();
      return; // Success
    } catch (error) {
      console.error(`Initialization attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        // Final failure
        global.exports.init.rejectResource(GetCurrentResourceName());
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }
};
```

### Deadlock Prevention

```typescript
// Timeout-based deadlock prevention
const initWithDeadlockPrevention = async () => {
  const timeout = 30000; // 30 seconds maximum
  
  const initPromise = performInitialization();
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Initialization timeout')), timeout)
  );
  
  try {
    await Promise.race([initPromise, timeoutPromise]);
    global.exports.init.resolveResource(GetCurrentResourceName());
  } catch (error) {
    console.error('Initialization failed or timed out:', error);
    global.exports.init.rejectResource(GetCurrentResourceName());
  }
};
```

## Performance Considerations

### Memory Management

```typescript
// Efficient state management
class InitManager {
  // Use Map for O(1) lookups
  protected _initialized: Map<string, Promise<void>> = new Map();
  
  // Use Set for fast membership testing
  protected _initializedResources: Set<string> = new Set();
  
  // Clean up completed promises periodically
  private cleanupCompleted() {
    for (const [name, promise] of this._initialized) {
      if (this._initializedResources.has(name)) {
        this._initialized.delete(name);
        this._initializedResolver.delete(name);
        this._initializedRejector.delete(name);
      }
    }
  }
}
```

### Scalability Features

```typescript
// Batch operations for large numbers of resources
const batchInitialization = async (resourceNames: string[]) => {
  const batchSize = 10;
  const results: boolean[] = [];
  
  for (let i = 0; i < resourceNames.length; i += batchSize) {
    const batch = resourceNames.slice(i, i + batchSize);
    const batchPromises = batch.map(name => 
      global.exports.init.initializedResource(name)
        .then(() => true)
        .catch(() => false)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
};
```

## Best Practices and Recommendations

### 1. Initialization Timing
```typescript
// Good: Early registration, late resolution
global.exports.init.registerResource(GetCurrentResourceName());

// Perform initialization work
await setupComponents();

// Signal completion only after everything is ready
global.exports.init.resolveResource(GetCurrentResourceName());
```

### 2. Dependency Management
```typescript
// Good: Clear dependency declarations
const dependencies = ['base', 'ui', 'events'];

await Promise.all(
  dependencies.map(dep => global.exports.init.initializedResource(dep))
);
```

### 3. Error Handling
```typescript
// Good: Always handle initialization errors
try {
  await global.exports.init.initializedResource('critical-dependency');
} catch (error) {
  console.error('Critical dependency failed:', error);
  // Implement fallback or fail gracefully
}
```

### 4. Resource Cleanup
```typescript
// Good: Clean up on resource stop
on('onResourceStop', (resourceName: string) => {
  if (resourceName === GetCurrentResourceName()) {
    cleanup();
  }
});
```

## Future Enhancement Opportunities

### 1. Initialization Metrics
```typescript
// Proposed: Timing and performance monitoring
interface InitializationMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  dependencies: string[];
  success: boolean;
}
```

### 2. Dependency Visualization
```typescript
// Proposed: Dependency graph analysis
const getDependencyGraph = (): DependencyGraph => {
  // Return visualization-ready dependency information
};
```

### 3. Health Monitoring
```typescript
// Proposed: Ongoing health checks
const monitorResourceHealth = (resourceName: string) => {
  // Periodic health checking and reporting
};
```

## Conclusion

The init resource demonstrates exceptional software engineering practices in several key areas:

### Technical Excellence
- **Comprehensive Type Safety**: Full TypeScript coverage with strict typing
- **Modern Async Patterns**: Promise-based API with proper error handling
- **Performance Optimization**: Efficient data structures and memory management
- **Development Experience**: Hot reload, source maps, and debugging support

### Architectural Strengths
- **Single Responsibility**: Focused on initialization management
- **Separation of Concerns**: Clear client/server/shared boundaries
- **Extensibility**: Configurable options and timeout handling
- **Integration**: Seamless framework integration with type safety

### Production Readiness
- **Error Resilience**: Comprehensive error handling and recovery
- **Resource Management**: Automatic cleanup and lifecycle management
- **Scalability**: Efficient handling of large numbers of resources
- **Monitoring**: Logging and debugging capabilities

The init resource serves as an exemplary foundation for the Pioneer Village framework and demonstrates how core infrastructure should be designed, implemented, and integrated in a complex multi-resource application environment.

---

*This case study illustrates the level of engineering sophistication and attention to detail that characterizes the Pioneer Village framework.*
