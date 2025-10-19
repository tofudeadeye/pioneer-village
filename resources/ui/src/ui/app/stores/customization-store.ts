import { debounce } from 'lodash';
import { Socket } from 'socket.io-client';

import { LoadResourceJson, emitClient, onClient } from '@lib/ui';

// Store state interface matching the component's state
interface CustomizationState {
  show: boolean;
  state: Customization.State;
  components: Record<string, number>; // Component values from the event
  model: string | number;
  gender: 'male' | 'female';
  currentComponents: Record<string, { style: number; option: number }>;
  hiddenComponents: Record<string, { style: number; option: number }>;
  currentFaceOptions: Record<string, number>;
  currentFaceFeatures: Record<string, number>;
  currentBodyOptions: Record<string, number>;
  currentLayers: UI.Customization.LayerData[];
  currentWhistle: Record<string, any>;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  tints: Record<string, CustomizationPalette>;
  head: number;
  teeth: number;
  skinTone: number;
  bodyType: number;
}

// State listener type
type StateListener = (state: CustomizationState) => void;

// Component categories
const pedComponentCategories = [
  'hats',
  'eyewear',
  'neckties',
  'neckwear',
  'shirts_full',
  'suspenders',
  'vests',
  'coats',
  'coats_closed',
  'cloaks',
  'ponchos',
  'gauntlets',
  'gloves',
  'belts',
  'belt_buckles',
  'gunbelts',
  'skirts',
  'pants',
  'boots',
  'boot_accessories',
  'spats',
  'chaps',
  'accessories',
  'jewelry_bracelets',
  'jewelry_rings_left',
  'jewelry_rings_right',
];

const horseComponentCategories = ['head', 'hand', 'hair', 'mane', 'teef'];

const componentFiles = [
  '2886757168',
  'accessories',
  'ammo_pistols',
  'ammo_rifles',
  'aprons',
  'armor',
  'badges',
  'beards_chin',
  'beards_chops',
  'beards_complete',
  'beards_mustache',
  'belt_buckles',
  'belts',
  'bodies_lower',
  'bodies_upper',
  'boot_accessories',
  'boots',
  'chaps',
  'cloaks',
  'coats',
  'coats_closed',
  'dresses',
  'eyes',
  'eyewear',
  'gauntlets',
  'gloves',
  'gunbelt_accs',
  'gunbelts',
  'hair',
  'hair_accessories',
  'hats',
  'heads',
  'holsters_crossdraw',
  'holsters_knife',
  'holsters_left',
  'holsters_right',
  'horse_accessories',
  'horse_bedrolls',
  'horse_blankets',
  'horse_bridles',
  'horse_manes',
  'horse_mustache',
  'horse_saddlebags',
  'horse_saddles',
  'horse_shoes',
  'horse_tails',
  'jewelry_bracelets',
  'jewelry_rings_left',
  'jewelry_rings_right',
  'loadouts',
  'masks',
  'masks_large',
  'neckties',
  'neckwear',
  'pants',
  'ponchos',
  'saddle_horns',
  'saddle_lanterns',
  'saddle_stirrups',
  'satchels',
  'shirts_full',
  'skirts',
  'spats',
  'suspenders',
  'talisman_belt',
  'talisman_holster',
  'talisman_satchel',
  'talisman_wrist',
  'teeth',
  'vests',
];

class CustomizationStore {
  private static instance: CustomizationStore;
  private state: CustomizationState;
  private listeners = new Set<StateListener>();
  private initialized = false;
  private socket: Socket<UISocketEvents, SocketServer.Client & SocketServer.ClientEvents> | null = null;
  private ComponentsData: Record<string, UI.Customization.ComponentJson[]> = {};
  private OverlaysData: Record<string, UI.Customization.OverlayJson> = {};
  private sendClientData: ReturnType<typeof debounce>;

  private constructor() {
    this.state = {
      show: false,
      state: 'gender',
      components: {},
      model: '',
      gender: 'male',
      currentComponents: {},
      hiddenComponents: {},
      currentFaceOptions: {},
      currentFaceFeatures: {},
      currentBodyOptions: {},
      currentLayers: [],
      currentWhistle: {},
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      tints: {},
      head: 0,
      teeth: 0,
      skinTone: 0,
      bodyType: 2,
    };

    // Initialize debounced function
    this.sendClientData = debounce((updateCategory: string) => {
      for (const [category, data] of Object.entries(this.state.tints)) {
        if (category !== updateCategory) continue;
        if (data.palette === 0) {
          emitClient('customization.set-tint-by-category', category, {
            palette: -1,
            tint0: 0,
            tint1: 0,
            tint2: 0,
          });
        } else {
          emitClient('customization.set-tint-by-category', category, data);
        }
      }
    }, 1000);

    // Load components on initialization
    this.loadComponents();
  }

  static getInstance(): CustomizationStore {
    if (!CustomizationStore.instance) {
      CustomizationStore.instance = new CustomizationStore();
    }
    return CustomizationStore.instance;
  }

  // Initialize the store with socket connection
  initialize(socket: Socket<UISocketEvents, SocketServer.Client & SocketServer.ClientEvents>): void {
    if (this.initialized) {
      this.cleanup();
    }

    this.socket = socket;
    this.initialized = true;

    // Reset components on initialization
    this.resetComponents();

    // Set up event handlers
    this.setupSocketListeners();
    this.setupClientListeners();
  }

  // Load component data
  async loadComponents(): Promise<void> {
    for (const componentFile of componentFiles) {
      this.ComponentsData[componentFile] = (await LoadResourceJson(
        'rdr3-shared',
        `components-ui/${componentFile}.json`,
      )) as UI.Customization.ComponentJson[];
    }

    const overlays = (await LoadResourceJson('rdr3-shared', 'resources/overlays.json')) as Record<
      string,
      UI.Customization.OverlayJson
    >;

    for (const [category, overlayData] of Object.entries(overlays)) {
      this.OverlaysData[category] = overlayData;
    }
  }

  // Reset components to default
  resetComponents(): void {
    const tints: Record<string, CustomizationPalette> = {};
    const currentComponents: Record<string, { style: number; option: number }> = {};

    for (const category of [...pedComponentCategories, ...horseComponentCategories]) {
      tints[category] = {
        palette: -1,
        tint0: 0,
        tint1: 0,
        tint2: 0,
      };

      currentComponents[category] = {
        style: -1,
        option: 0,
      };
    }

    this.updateState({
      tints,
      currentComponents,
    });
  }

  // Setup socket event listeners
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Handle customization finalize response
    this.socket.on('customization.finalized', () => {
      this.updateState({
        show: false,
      });
      this.resetComponents();
    });
  }

  // Setup client event listeners
  private setupClientListeners(): void {
    // Handle state updates from game client
    onClient('customization.state', (stateUpdate: UI.Customization.Event) => {
      this.updateState(stateUpdate);
      if (!stateUpdate.show) {
        this.resetComponents();
      }
    });

    // Handle tint updates from client
    onClient('customization.set-tint-by-category', (category: string, tint: CustomizationPalette) => {
      this.updateState({
        tints: { ...this.state.tints, [category]: tint },
      });
    });
  }

  // Initialize client handlers (called from component)
  initializeClientHandlers(): void {
    this.setupClientListeners();
    this.resetComponents();
    this.loadComponents();
  }

  // Get component array for current selection
  private getComponentArray(currentComponents?: Record<string, { style: number; option: number }>): number[] {
    if (!currentComponents) {
      currentComponents = this.state.currentComponents;
    }

    const components = [];
    for (const [category, data] of Object.entries(currentComponents)) {
      if (data.style > -1 && this.ComponentsData[category]) {
        const component = this.ComponentsData[category][data.style]?.components[data.option];
        if (component) {
          components.push(component.component);
        }
      }
    }

    return components;
  }

  // Get component data array
  getComponentDataArray(): Record<string, { name: string; category: string; shopItem: string | number }> {
    const currentComponents = this.state.currentComponents;
    const components: Record<string, { name: string; category: string; shopItem: string | number }> = {};

    for (const [category, data] of Object.entries(currentComponents)) {
      if (data.style > -1 && this.ComponentsData[category]) {
        const component = this.ComponentsData[category][data.style]?.components[data.option];
        if (component) {
          let name = component.friendlyName || component.name || component.category;

          if (typeof name === 'string') {
            name = name.replace(/^CLOTHING_ITEM_[A-Z]{1,2}_/, '');
            name = name.replace(/_[0-9]{3}_TINT_[0-9]{3}$/, '');
            name = name.replace(/_/g, ' ');
            name = name
              .split(' ')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
          }

          components[category] = {
            name: String(name),
            category: category.toUpperCase(),
            shopItem: component.name || component.component,
          };
        }
      }
    }

    return components;
  }

  // Set a component
  setComponent(componentType: string, style: number, option: number): void {
    const currentComponents = { ...this.state.currentComponents, [componentType]: { style, option } };
    this.updateState({
      currentComponents,
    });

    const components = this.getComponentArray(currentComponents);
    emitClient('customization.set-components', components);
  }

  // Set tint by category
  setTintByCategory(category: string, tint: Customization.Palette): void {
    this.updateState({
      tints: { ...this.state.tints, [category]: tint },
    });
    this.sendClientData(category);
  }

  // Highlight gender
  highlightGender(gender: 'male' | 'female'): void {
    this.updateState({
      gender,
    });
    emitClient('customization.highlight', gender);
  }

  // Choose gender
  chooseGender(): void {
    emitClient('customization.choose-gender');
  }

  // Set customization state
  setState(newState: Customization.State): void {
    if (newState === 'finalize') {
      const finalState = {
        ...this.state,
        currentComponents: this.getComponentDataArray(),
        tints: {},
        currentLayers: [],
      };
      if (this.socket) {
        this.socket.emit('customization.finalize', JSON.stringify(finalState));
      }
    } else {
      emitClient('customization.set-state', newState);
    }
  }

  // Change skin tone
  changeSkinTone(value: number): void {
    this.updateState({
      skinTone: value,
    });
    emitClient('customization.set-skin-tone', value);
    emitClient('customization.set-layers', this.state.currentLayers);
  }

  // Change head
  changeHead(value: number): void {
    this.updateState({
      head: value,
    });
    emitClient('customization.set-head', value);
  }

  // Change teeth
  changeTeeth(value: number): void {
    this.updateState({
      teeth: value,
    });
    emitClient('customization.set-teeth', value);
  }

  // Change body type
  changeBodyType(value: number): void {
    this.updateState({
      bodyType: value,
    });
    emitClient('customization.set-body-type', value);
  }

  // Change waist
  changeWaist(value: number): void {
    emitClient('customization.set-waist', value);
  }

  // Change face feature
  changeFaceFeature(feature: number, value: number): void {
    emitClient('customization.set-face-feature', feature, value);
    this.updateState({
      currentFaceFeatures: { ...this.state.currentFaceFeatures, [`${feature}`]: value },
    });
  }

  // Update first name
  updateFirstName(value: string): void {
    this.updateState({
      firstName: value,
    });
  }

  // Update last name
  updateLastName(value: string): void {
    this.updateState({
      lastName: value,
    });
  }

  // Update date of birth
  updateDateOfBirth(value: string): void {
    this.updateState({
      dateOfBirth: value,
    });
  }

  // Handle face change
  handleFaceChange(option: string, value: number, option2?: string, value2?: number): void {
    const currentFaceOptions = { ...this.state.currentFaceOptions, [option]: value };
    if (option2 && value2 !== undefined) {
      currentFaceOptions[option2] = value2;
    }
    emitClient('customization.set-face-option', currentFaceOptions);
    this.updateState({
      currentFaceOptions,
    });
  }

  // Handle rotation
  handleRotation(value: number): void {
    emitClient('customization.rotate-chosen', value);
  }

  // Change layers
  changeLayers(layers: UI.Customization.LayerData[]): void {
    this.updateState({
      currentLayers: layers,
    });
    emitClient('customization.set-layers', layers);
  }

  // Setter methods for component compatibility
  setCurrentComponents(components: Record<string, { style: number; option: number }>): void {
    this.updateState({ currentComponents: components });
  }

  setGender(gender: 'male' | 'female'): void {
    this.updateState({ gender });
  }

  setSkinTone(value: number): void {
    this.changeSkinTone(value);
  }

  setHead(value: number): void {
    this.changeHead(value);
  }

  setTeeth(value: number): void {
    this.changeTeeth(value);
  }

  setBodyType(value: number): void {
    this.changeBodyType(value);
  }

  setFaceFeature(feature: number, value: number): void {
    this.changeFaceFeature(feature, value);
  }

  setFirstName(value: string): void {
    this.updateFirstName(value);
  }

  setLastName(value: string): void {
    this.updateLastName(value);
  }

  setDateOfBirth(value: string): void {
    this.updateDateOfBirth(value);
  }

  setFaceOptions(options: Record<string, number>): void {
    this.updateState({ currentFaceOptions: options });
  }

  setCurrentLayers(layers: UI.Customization.LayerData[]): void {
    this.changeLayers(layers);
  }

  // Update state and notify listeners
  updateState(newState: Partial<CustomizationState>): void {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach((listener) => listener(this.state));
  }

  // Subscribe to state changes
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state); // Call immediately with current state

    return () => {
      this.listeners.delete(listener);
    };
  }

  // Get current state
  getState(): CustomizationState {
    return this.state;
  }

  // Get components data
  getComponentsData(): Record<string, UI.Customization.ComponentJson[]> {
    return this.ComponentsData;
  }

  // Get overlays data
  getOverlaysData(): Record<string, UI.Customization.OverlayJson> {
    return this.OverlaysData;
  }

  // Cleanup when store is destroyed
  cleanup(): void {
    if (this.socket) {
      // Remove socket handlers
      this.socket.off('customization.finalized');
    }

    this.listeners.clear();
    this.initialized = false;
  }

  // Required abstract method implementations from BaseSocketHandler
  protected onDestroy(): void {
    this.cleanup();
  }
}

export default CustomizationStore.getInstance();
