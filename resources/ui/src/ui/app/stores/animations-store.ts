import { Socket } from 'socket.io-client';

import { LoadResourceJson, emitClient, onClient, onClientCall } from '@lib/ui';

interface AnimationsState {
  show: boolean;
  animations: Record<string, string[]>;
  query: string;
  dict: string;
  clip: string;
  flags: number;
  entity: number;
  blendInSpeed: number;
  blendOutSpeed: number;
}

export enum AnimationFlag {
  REPEAT = 1,
  STOP_LAST_FRAME = 2,
  UNK_4 = 4,
  UPPERBODY = 8,
  ENABLE_PLAYER_CONTROL = 16,
  CANCELABLE = 32,
  UNK_64 = 64,
  OFFSET_POSITION = 128,
  OFFSET_POSITION_ENTITY = 256,
  UNK_512 = 512,
  UNK_1024 = 1024,
  UNK_2048 = 2048,
  UNK_4096 = 4096,
  UNK_8192 = 8192,
  UNK_16384 = 16384,
  UNK_IS_ENTITY = 32768,
}

type StateListener = () => void;

class AnimationsStore {
  private static instance: AnimationsStore;
  private socket: Socket<SocketOut.ToClient, SocketIn.FromClient> | null = null;
  private state: AnimationsState;
  private listeners = new Set<StateListener>();
  private initialized = false;

  private constructor() {
    this.state = {
      show: false,
      animations: {},
      query: '',
      dict: '',
      clip: '',
      flags: 0,
      entity: 0,
      blendInSpeed: 1,
      blendOutSpeed: -1,
    };
  }

  static getInstance(): AnimationsStore {
    if (!AnimationsStore.instance) {
      AnimationsStore.instance = new AnimationsStore();
    }
    return AnimationsStore.instance;
  }

  initialize(socket: Socket<SocketOut.ToClient, SocketIn.FromClient>): void {
    if (this.initialized) {
      this.cleanup();
    }

    this.socket = socket;
    this.initialized = true;
    this.setupClientHandlers();
    this.loadAnimations();
  }

  private async loadAnimations(): Promise<void> {
    try {
      const animations = await LoadResourceJson('rdr3-shared', 'resources/animations.json');
      this.updateState({ animations });
    } catch (error) {
      console.error('Failed to load animations:', error);
    }
  }

  private setupClientHandlers(): void {
    onClient('animations.state', this.handleAnimationsState);
  }

  private handleAnimationsState = (event: UI.Animations.Event): void => {
    if (!event) return;
    this.updateState(event);
  };

  playAnimation(): void {
    emitClient('animations.play-anim', {
      dict: this.state.dict,
      clip: this.state.clip,
      flags: this.state.flags,
      blendInSpeed: this.state.blendInSpeed,
      blendOutSpeed: this.state.blendOutSpeed,
      entity: this.state.entity,
    });
  }

  stopAnimation(): void {
    emitClient('animations.stop-anim', { entity: this.state.entity });
  }

  setQuery(query: string): void {
    this.updateState({ query });
  }

  setDict(dict: string): void {
    this.updateState({ dict, clip: '' });
  }

  setClip(clip: string): void {
    this.updateState({ clip });
  }

  setFlags(flags: number): void {
    this.updateState({ flags });
  }

  updateFlag(flagValue: number, checked: boolean): void {
    let newFlags = this.state.flags;
    if (checked) {
      newFlags = this.state.flags | flagValue;
    } else {
      newFlags -= this.state.flags & flagValue;
    }
    this.setFlags(newFlags);
  }

  setEntity(entity: number): void {
    this.updateState({ entity });
  }

  setBlendInSpeed(speed: number): void {
    this.updateState({ blendInSpeed: speed });
  }

  setBlendOutSpeed(speed: number): void {
    this.updateState({ blendOutSpeed: speed });
  }

  getFilteredDictionaries(): string[] {
    if (!this.state.query) {
      return Object.keys(this.state.animations);
    }

    const terms = this.state.query.toLowerCase().split(' ');
    return Object.keys(this.state.animations).filter((animationDict) => {
      return terms.every((term) => {
        if (term.startsWith('!')) {
          return !animationDict.toLowerCase().includes(term.substring(1));
        }
        return animationDict.toLowerCase().includes(term);
      });
    });
  }

  getClips(): string[] {
    if (!this.state.dict || !this.state.animations[this.state.dict]) {
      return [];
    }
    return this.state.animations[this.state.dict];
  }

  getFlagsString(): string {
    const flagStrings: string[] = [];

    if ((this.state.flags & AnimationFlag.REPEAT) !== 0) {
      flagStrings.push('AnimFlag.REPEAT');
    }
    if ((this.state.flags & AnimationFlag.STOP_LAST_FRAME) !== 0) {
      flagStrings.push('AnimFlag.STOP_LAST_FRAME');
    }
    if ((this.state.flags & AnimationFlag.UNK_4) !== 0) {
      flagStrings.push('AnimFlag.UNK_4');
    }
    if ((this.state.flags & AnimationFlag.UPPERBODY) !== 0) {
      flagStrings.push('AnimFlag.UPPERBODY');
    }
    if ((this.state.flags & AnimationFlag.ENABLE_PLAYER_CONTROL) !== 0) {
      flagStrings.push('AnimFlag.ENABLE_PLAYER_CONTROL');
    }
    if ((this.state.flags & AnimationFlag.CANCELABLE) !== 0) {
      flagStrings.push('AnimFlag.CANCELABLE');
    }
    if ((this.state.flags & AnimationFlag.UNK_64) !== 0) {
      flagStrings.push('AnimFlag.UNK_64');
    }
    if ((this.state.flags & AnimationFlag.OFFSET_POSITION) !== 0) {
      flagStrings.push('AnimFlag.OFFSET_POSITION');
    }
    if ((this.state.flags & AnimationFlag.OFFSET_POSITION_ENTITY) !== 0) {
      flagStrings.push('AnimFlag.OFFSET_POSITION_ENTITY');
    }
    if ((this.state.flags & AnimationFlag.UNK_512) !== 0) {
      flagStrings.push('AnimFlag.UNK_512');
    }
    if ((this.state.flags & AnimationFlag.UNK_1024) !== 0) {
      flagStrings.push('AnimFlag.UNK_1024');
    }
    if ((this.state.flags & AnimationFlag.UNK_2048) !== 0) {
      flagStrings.push('AnimFlag.UNK_2048');
    }
    if ((this.state.flags & AnimationFlag.UNK_4096) !== 0) {
      flagStrings.push('AnimFlag.UNK_4096');
    }
    if ((this.state.flags & AnimationFlag.UNK_8192) !== 0) {
      flagStrings.push('AnimFlag.UNK_8192');
    }
    if ((this.state.flags & AnimationFlag.UNK_16384) !== 0) {
      flagStrings.push('AnimFlag.UNK_16384');
    }
    if ((this.state.flags & AnimationFlag.UNK_IS_ENTITY) !== 0) {
      flagStrings.push('AnimFlag.UNK_IS_ENTITY');
    }

    return flagStrings.join(' + ');
  }

  getAnimationConfigString(): string {
    return `{
    dict: '${this.state.dict}',
    anim: '${this.state.clip}',${
      this.state.flags !== 0
        ? `
    flags: ${this.getFlagsString()},`
        : ''
    }
    blendInSpeed: ${this.state.blendInSpeed},
    blendOutSpeed: ${this.state.blendOutSpeed},
}`;
  }

  close(): void {
    this.updateState({ show: false });
  }

  private updateState(partial: Partial<AnimationsState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => listener());
  }

  subscribe = (listener: StateListener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getState = (): AnimationsState => {
    return this.state;
  };

  hasFlag(flag: AnimationFlag): boolean {
    return (this.state.flags & flag) !== 0;
  }

  cleanup(): void {
    this.listeners.clear();
    this.initialized = false;
  }
}

export default AnimationsStore.getInstance();
