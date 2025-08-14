# UI Store Refactoring Documentation

## Overview
The character-select and customization UI layers have been successfully refactored to use state management stores following the inventory system pattern.

## Architecture

### Store Pattern
All stores follow this pattern:
1. **Singleton Pattern**: Each store is a singleton instance
2. **State Management**: Internal state with subscription-based updates
3. **Event Handling**: Centralized handling of socket and client events
4. **Separation of Concerns**: UI components only handle rendering, stores handle all logic

### Store Structure

```typescript
class Store {
  private static instance: Store;
  private state: StateInterface;
  private listeners = new Set<StateListener>();
  private socket: Socket | null = null;
  private initialized = false;

  // Singleton getInstance()
  // initialize(socket) - Sets up socket and event handlers
  // setupSocketListeners() - Socket event handlers
  // setupClientListeners() - Client event handlers
  // updateState() - Updates state and notifies listeners
  // subscribe(listener) - Subscribe to state changes
  // cleanup() - Cleanup on destroy
}
```

## Implemented Stores

### 1. Character Select Store (`character-select-store.ts`)

**State Management:**
- `show`: boolean - Controls visibility
- `characters`: Array of character data
- `selectedCharacterId`: Currently selected character
- `isCreating`/`isDeleting`: Loading states
- `deleteConfirmId`: Confirmation for deletion

**Key Features:**
- Handles character list management
- Character creation/selection/deletion
- Socket communication for character operations
- RPC handlers for `getCharacters` and `createCharacter`

**Events Handled:**
- Client: `character-select.state`
- Socket: `character-select.characters`, `character-select.created`, `character-select.deleted`
- Emits: `character-select.choose`, `character-select.create`

### 2. Customization Store (`customization-store.ts`)

**State Management:**
- `show`: boolean - Controls visibility
- `state`: Current customization state (gender/info/head/body/clothing)
- `gender`: Selected gender
- `currentComponents`: Selected clothing/appearance components
- `currentFaceFeatures`: Face customization values
- `currentLayers`: Overlay layers
- `tints`: Color customization per category
- Character info: firstName, lastName, dateOfBirth

**Key Features:**
- Component data loading from JSON files
- Debounced tint updates
- Component selection and customization
- Face feature adjustments
- Gender selection flow
- Final customization submission

**Events Handled:**
- Client: `customization.state`, `customization.set-tint-by-category`
- Socket: `customization.finalized`
- Emits: Multiple customization events for real-time preview

### 3. Inventory Store (`inventory-store.ts`)
*Already implemented - used as reference pattern*

## Component Integration

### Character Select Component
```tsx
function CharacterSelect() {
  const [state, setState] = useState(characterSelectStore.getState());
  
  useEffect(() => {
    const unsubscribe = characterSelectStore.subscribe(setState);
    return unsubscribe;
  }, []);
  
  // All event handling through store methods
  const chooseCharacter = (id) => characterSelectStore.chooseCharacter(id);
  const createCharacter = () => characterSelectStore.createCharacter();
  const deleteCharacter = (id) => characterSelectStore.deleteCharacter(id);
}
```

### Customization Component
```tsx
function Customization() {
  const [state, setState] = useState(customizationStore.getState());
  
  useEffect(() => {
    const unsubscribe = customizationStore.subscribe(setState);
    return unsubscribe;
  }, []);
  
  // All customization through store methods
  const setComponent = (type, style, option) => customizationStore.setComponent(type, style, option);
  const changeFaceFeature = (feature, value) => customizationStore.changeFaceFeature(feature, value);
  // etc...
}
```

## Store Initialization

All stores are initialized in `app/index.tsx`:
```typescript
export default (socket: Socket) => {
  // Initialize all stores before rendering
  inventoryStore.initialize(socket);
  characterSelectStore.initialize(socket);
  customizationStore.initialize(socket);
  
  // Render app
  const root = createRoot(document.body);
  root.render(<App socket={socket} />);
  
  // Initialize controllers (legacy, being phased out)
  CharacterSelectController(socket); // Now empty, logic moved to store
  // ...other controllers
}
```

## Benefits of This Architecture

1. **Centralized State**: All state for a feature is in one place
2. **Testability**: Stores can be tested independently of UI
3. **Reusability**: Multiple components can use the same store
4. **Performance**: Only subscribed components re-render on state changes
5. **Maintainability**: Clear separation between UI and business logic
6. **Type Safety**: Full TypeScript support with proper interfaces

## Migration Guide for Other Components

To migrate other UI layers to use stores:

1. Create a new store file extending the pattern
2. Move all state from the component to the store
3. Move all event handlers (socket/client) to the store
4. Replace `useClientEvent` with store subscriptions
5. Update component to use store methods for all actions
6. Remove/empty the corresponding controller file
7. Initialize the store in `app/index.tsx`

## Next Components to Migrate

Other components still using `useClientEvent` that could be migrated:
- threejs
- target
- doctor
- form
- interact
- log
- hud
- animations
- notification
- jobs
- chat

These can be migrated following the same pattern as character-select and customization stores.