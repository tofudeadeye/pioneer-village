import { Socket } from 'socket.io-client';
import * as THREE from 'three';
import { onClient } from '@lib/ui';

// Vector3 interface for positions and rotations
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

// Store state interface matching the component's state
interface ThreeJSState {
  show: boolean;
  fov: number;
  cameraPosition: Vector3;
  cameraRotation: Vector3;
  targetPosition: Vector3;
  targetRotation: Vector3;
}

// Scene objects interface
interface SceneObjects {
  camera: THREE.PerspectiveCamera | null;
  scene: THREE.Scene | null;
  renderer: THREE.WebGLRenderer | null;
  cube: THREE.Mesh | null;
  sprite: THREE.Sprite | null;
}

type StateListener = (state: ThreeJSState) => void;
type AnimationCallback = (time: number) => void;

class ThreeJSStore {
  private static instance: ThreeJSStore;
  private socket: Socket<SocketOut.ToClient, SocketIn.FromClient> | null = null;
  private state: ThreeJSState;
  private listeners = new Set<StateListener>();
  private sceneObjects: SceneObjects;
  private animationCallbacks = new Set<AnimationCallback>();
  private initialized = false;
  private lastTime = 0;

  private constructor() {
    this.state = {
      show: false,
      fov: 50,
      cameraPosition: { x: 0, y: 0, z: 0 },
      cameraRotation: { x: 0, y: 0, z: 0 },
      targetPosition: { x: 0, y: 0, z: 0 },
      targetRotation: { x: 0, y: 0, z: 0 },
    };

    this.sceneObjects = {
      camera: null,
      scene: null,
      renderer: null,
      cube: null,
      sprite: null,
    };
  }

  static getInstance(): ThreeJSStore {
    if (!ThreeJSStore.instance) {
      ThreeJSStore.instance = new ThreeJSStore();
    }
    return ThreeJSStore.instance;
  }

  // Initialize the store with socket connection
  initialize(socket: Socket<SocketOut.ToClient, SocketIn.FromClient>): void {
    if (this.initialized) {
      this.cleanup();
    }

    this.socket = socket;
    this.initialized = true;

    // Set up client event handlers
    this.setupClientHandlers();
  }

  private setupClientHandlers(): void {
    // Handle threejs state updates from client
    onClient('threejs.state', this.handleThreeJSState);
  }

  // Handle threejs state update from client with coordinate transformation
  private handleThreeJSState = (event: UI.ThreeJS.Event): void => {
    if (!event) return;

    // Transform coordinates from game space to three.js space
    const transformedEvent = { ...event };

    if (transformedEvent.cameraPosition) {
      transformedEvent.cameraPosition = this.transformGameToThreeJS(transformedEvent.cameraPosition);
    }

    if (transformedEvent.cameraRotation) {
      transformedEvent.cameraRotation = this.transformGameRotationToThreeJS(transformedEvent.cameraRotation);
    }

    if (transformedEvent.targetPosition) {
      transformedEvent.targetPosition = this.transformGameToThreeJS(transformedEvent.targetPosition);
    }

    if (transformedEvent.targetRotation) {
      transformedEvent.targetRotation = this.transformGameRotationToThreeJS(transformedEvent.targetRotation);
    }

    this.updateState(transformedEvent);
  };

  // Transform game coordinates to Three.js coordinates
  private transformGameToThreeJS(coords: Vector3): Vector3 {
    return {
      x: coords.x,
      y: coords.z,
      z: -coords.y,
    };
  }

  // Transform game rotation to Three.js rotation (converts degrees to radians)
  private transformGameRotationToThreeJS(rotation: Vector3): Vector3 {
    return {
      x: THREE.MathUtils.degToRad(rotation.x),
      y: THREE.MathUtils.degToRad(rotation.z),
      z: THREE.MathUtils.degToRad(-rotation.y),
    };
  }

  // Initialize Three.js scene
  initializeScene(containerElement: HTMLDivElement): void {
    if (this.sceneObjects.renderer) {
      this.disposeScene();
    }

    // Create camera
    this.sceneObjects.camera = new THREE.PerspectiveCamera(
      this.state.fov,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Create scene
    this.sceneObjects.scene = new THREE.Scene();

    // Create cube
    const geometry = new THREE.BoxGeometry(0.25, 0.5, 0.25);
    const material = new THREE.MeshNormalMaterial();
    this.sceneObjects.cube = new THREE.Mesh(geometry, material);
    this.sceneObjects.scene.add(this.sceneObjects.cube);

    // Create sprite
    const map = new THREE.TextureLoader().load('https://p--v.b-cdn.net/smear-1.png');
    const spriteMaterial = new THREE.SpriteMaterial({ map });
    this.sceneObjects.sprite = new THREE.Sprite(spriteMaterial);
    this.sceneObjects.sprite.scale.set(0.75, 0.18, 1);
    this.sceneObjects.scene.add(this.sceneObjects.sprite);

    // Create renderer
    this.sceneObjects.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.sceneObjects.renderer.setSize(window.innerWidth, window.innerHeight);
    this.sceneObjects.renderer.setAnimationLoop(this.animate);

    // Add to container
    containerElement.appendChild(this.sceneObjects.renderer.domElement);

    // Apply current state to scene
    this.updateSceneFromState();
  }

  // Animation loop
  private animate = (time: number): void => {
    const delta = time - this.lastTime;
    this.lastTime = time;

    // Notify animation callbacks
    this.animationCallbacks.forEach(callback => callback(time));

    // Render scene
    if (this.sceneObjects.renderer && this.sceneObjects.scene && this.sceneObjects.camera) {
      this.sceneObjects.renderer.render(this.sceneObjects.scene, this.sceneObjects.camera);
    }
  };

  // Dispose of Three.js scene
  disposeScene(): void {
    if (this.sceneObjects.renderer) {
      this.sceneObjects.renderer.setAnimationLoop(null);
      this.sceneObjects.renderer.dispose();
      
      if (this.sceneObjects.renderer.domElement && this.sceneObjects.renderer.domElement.parentElement) {
        this.sceneObjects.renderer.domElement.parentElement.removeChild(this.sceneObjects.renderer.domElement);
      }
    }

    // Clean up geometries and materials
    if (this.sceneObjects.cube) {
      if (this.sceneObjects.cube.geometry) this.sceneObjects.cube.geometry.dispose();
      if (this.sceneObjects.cube.material) {
        if (Array.isArray(this.sceneObjects.cube.material)) {
          this.sceneObjects.cube.material.forEach(m => m.dispose());
        } else {
          this.sceneObjects.cube.material.dispose();
        }
      }
    }

    if (this.sceneObjects.sprite) {
      if (this.sceneObjects.sprite.material) {
        this.sceneObjects.sprite.material.dispose();
        if (this.sceneObjects.sprite.material.map) {
          this.sceneObjects.sprite.material.map.dispose();
        }
      }
    }

    // Reset scene objects
    this.sceneObjects = {
      camera: null,
      scene: null,
      renderer: null,
      cube: null,
      sprite: null,
    };
  }

  // Update scene objects from current state
  private updateSceneFromState(): void {
    // Update camera
    if (this.sceneObjects.camera) {
      this.sceneObjects.camera.fov = this.state.fov;
      this.sceneObjects.camera.updateProjectionMatrix();
      
      this.sceneObjects.camera.position.set(
        this.state.cameraPosition.x,
        this.state.cameraPosition.y,
        this.state.cameraPosition.z
      );
      
      this.sceneObjects.camera.rotation.set(
        this.state.cameraRotation.x,
        this.state.cameraRotation.y,
        this.state.cameraRotation.z
      );
    }

    // Update cube
    if (this.sceneObjects.cube) {
      this.sceneObjects.cube.position.set(
        this.state.targetPosition.x,
        this.state.targetPosition.y,
        this.state.targetPosition.z
      );
      
      this.sceneObjects.cube.rotation.set(
        this.state.targetRotation.x,
        this.state.targetRotation.y,
        this.state.targetRotation.z
      );
    }

    // Update sprite
    if (this.sceneObjects.sprite) {
      this.sceneObjects.sprite.position.set(
        this.state.targetPosition.x,
        this.state.targetPosition.y,
        this.state.targetPosition.z
      );
    }
  }

  // Set FOV
  setFOV(fov: number): void {
    this.updateState({ fov });
  }

  // Set camera position
  setCameraPosition(position: Vector3): void {
    this.updateState({ cameraPosition: position });
  }

  // Set camera rotation
  setCameraRotation(rotation: Vector3): void {
    this.updateState({ cameraRotation: rotation });
  }

  // Set target position
  setTargetPosition(position: Vector3): void {
    this.updateState({ targetPosition: position });
  }

  // Set target rotation
  setTargetRotation(rotation: Vector3): void {
    this.updateState({ targetRotation: rotation });
  }

  // Toggle visibility
  setShow(show: boolean): void {
    this.updateState({ show });
  }

  // Get formatted camera position for display (converting back to game coordinates)
  getDisplayCameraPosition(): Vector3 {
    return {
      x: this.state.cameraPosition.x,
      y: -this.state.cameraPosition.z,
      z: this.state.cameraPosition.y,
    };
  }

  // Get formatted camera rotation for display (converting back to game coordinates)
  getDisplayCameraRotation(): Vector3 {
    return {
      x: this.state.cameraRotation.x,
      y: -this.state.cameraRotation.z,
      z: this.state.cameraRotation.y,
    };
  }

  // Get scene objects (for direct manipulation if needed)
  getSceneObjects(): SceneObjects {
    return this.sceneObjects;
  }

  // Register animation callback
  registerAnimationCallback(callback: AnimationCallback): () => void {
    this.animationCallbacks.add(callback);
    return () => {
      this.animationCallbacks.delete(callback);
    };
  }

  // Handle window resize
  handleResize(): void {
    if (this.sceneObjects.camera && this.sceneObjects.renderer) {
      this.sceneObjects.camera.aspect = window.innerWidth / window.innerHeight;
      this.sceneObjects.camera.updateProjectionMatrix();
      this.sceneObjects.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  // Update state and notify listeners
  updateState(newState: Partial<ThreeJSState>): void {
    this.state = { ...this.state, ...newState };
    this.updateSceneFromState();
    this.listeners.forEach(listener => listener(this.state));
  }

  // Close threejs UI (for escape key compatibility)
  close(): void {
    this.setShow(false);
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
  getState(): ThreeJSState {
    return this.state;
  }

  // Cleanup when store is destroyed
  cleanup(): void {
    this.disposeScene();
    this.animationCallbacks.clear();
    this.listeners.clear();
    this.initialized = false;
  }
}

export default ThreeJSStore.getInstance();