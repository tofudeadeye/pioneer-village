import { PVBase, PVGame, PVInit, PVZone, onResourceInit } from '@lib/client';
import { Log, awaitUI } from '@lib/client/comms/ui';
import { PedConfigFlag } from '@lib/flags';
import { Delay } from '@lib/functions';

import StableData from '../../shared/data/stableData';
import Horse from '../classes/horse';
import Stable from '../classes/stable';

const DECOR_HORSE_ID = 'stable::horse.id';
DecorRegister(DECOR_HORSE_ID, 3);

class StableController {
  protected static instance: StableController;

  protected _horses: Map<Horse.Id, Horse> = new Map();

  protected _stables: Map<Stable.Id, Stable> = new Map();
  protected _stabledHorses: Map<Horse.Id, Stable.Id> = new Map();

  protected _currentStable: Stable.Id = '';
  // protected _currentStableStalls: Vector4Format[] = [];

  // protected _characterInStables: Map<Stable.Id, Set<number>> = new Map(); // Map<StableId, Set<CharacterId>>
  protected _stableHorsePeds: Map<Stable.Id, Map<number, Set<number>>> = new Map(); // Map<StableId, Map<CharacterId, Set<EntityId>>
  protected _horsePedsStalls: Map<number, number> = new Map();

  protected _unstabledHorsePedsTemp: Set<number> = new Set();

  static getInstance(): StableController {
    if (!StableController.instance) {
      StableController.instance = new StableController();
    }
    return StableController.instance;
  }

  constructor() {
    onResourceInit('game', () => {
      const character = PVGame.getCurrentCharacter();
      if (character) {
        this.loadHorses(character.id);
      }
    });
    onNet('game:character-selected', async (characterId: number) => {
      this.loadHorses(characterId);
    });
    on('events_manager:mount', (onMount: number, mount: number, currentSeat: number) => {
      if (this._unstabledHorsePedsTemp.has(mount)) {
        this.horseMakeNetworked(mount);
      }
    });
  }

  get currentStable(): Stable.Id {
    return this._currentStable;
  }

  currentStableData(): Stable.Data | undefined {
    for (const stable of StableData) {
      if (stable.identifier === this._currentStable) {
        return stable;
      }
    }
  }

  async loadHorses(characterId: number) {
    Log('Load Horses Started');
    PVInit.register('stable::load-hoses', { reset: true });
    const horses = await awaitUI('stable.load-character-horses', characterId);
    for (const horse of horses) {
      // Log('horse', horse);
      this._horses.set(horse.id, new Horse(horse));
      this._stabledHorses.set(horse.id, horse.stable || '');
    }
    PVInit.resolve('stable::load-hoses');
    Log('Load Horses Finished');
  }

  addStable(data: Stable.Data): void {
    const stable = new Stable(data.identifier, data.name);
    stable.addStalls(data.stalls);

    this._stables.set(stable.id, stable);
  }

  getById(id: Stable.Id): Stable | undefined {
    return this._stables.get(id);
  }

  getByHorseId(horseId: Horse.Id): Stable | undefined {
    const stableId = this._stabledHorses.get(horseId);
    if (stableId) {
      return this.getById(stableId);
    }
  }

  async enterStable(stableId: Stable.Id): Promise<void> {
    if (this._currentStable === stableId) {
      Log('Already in stable');
      return;
    }

    this._currentStable = stableId;

    const stable = this.getById(stableId);

    if (!stable) {
      Log('Stable not found');
      return;
    }

    let usedStalls = 0;

    const stableHorses = this._stableHorsePeds.get(stableId) || new Map<number, Set<number>>();

    const characterId = PVGame.characterId();

    Log('characterId', characterId);

    if (!characterId) {
      Log('Character not found');
      return;
    }

    await PVInit.initialized('stable::load-hoses');
    Log('Spawn Horses');

    const stableHorsePeds = stableHorses.get(characterId) || new Set<number>();

    for (const horse of this._horses.values()) {
      if (horse.stable === stableId) {
        const stall = stable.stalls[usedStalls];
        const horsePed = await this.spawnHorse(horse, {
          local: true,
          overrideCoord: {
            x: stall.x,
            y: stall.y,
            z: stall.z,
            w: stall.w,
          },
        });
        stableHorsePeds.add(horsePed);
        SetPedConfigFlag(horsePed, PedConfigFlag.CannotBeMounted, true);
        this._horsePedsStalls.set(horsePed, usedStalls);
        usedStalls++;
      }
    }

    stableHorses.set(characterId, stableHorsePeds);
    this._stableHorsePeds.set(stableId, stableHorses);
  }

  async exitStable(stableId: Stable.Id): Promise<void> {
    const stableHorsePeds = this._stableHorsePeds.get(stableId) || new Map<number, Set<number>>();

    Log('stableHorsePeds', stableHorsePeds.entries());

    const characterId = PVGame.characterId();
    if (!characterId) {
      return;
    }

    const stableHorses = stableHorsePeds.get(characterId) || new Set<number>();

    // const horsesInStables: number[] = [];

    // NOTE: Moved to PVTarget for removing horses from stables and making them networked.
    // for (const horsePed of stableHorses.values()) {
    //   const inZone = PVZone.IsEntityInZone(`${ZonePrefix}${stableId}`, horsePed);
    //   if (inZone) {
    //     horsesInStables.push(horsePed);
    //     continue;
    //   }
    //   Log(`Horse ${horsePed} not in stable zone, removing from stable`);
    //   NetworkRegisterEntityAsNetworked(horsePed);
    //   const horseId = DecorGetInt(horsePed, DECOR_HORSE_ID);
    //   Log('horseId', horseId);
    //
    //   if (horseId) {
    //     this.unstableHorse(horseId);
    //   }
    // }

    PVBase.deleteEntities([...stableHorses.values()]);

    this._stableHorsePeds.set(stableId, stableHorsePeds);

    this._currentStable = '';
  }

  isStabled(horseId: Horse.Id): boolean {
    return this._stabledHorses.has(horseId);
  }

  stableHorse(ped: number, horseId: Horse.Id, stableId: Stable.Id): void {
    const stable = this.getById(stableId);
    if (!stable || stable.horses.includes(horseId)) {
      return;
    }
    const characterId = PVGame.characterId();
    if (!characterId) {
      return;
    }

    stable.horses.push(horseId);

    const stableHorsePeds = this._stableHorsePeds.get(stableId) || new Map<number, Set<number>>(); // Map<StableId, Map<CharacterId, Set<EntityId>>
    const stabledHorses = stableHorsePeds.get(characterId) || new Set<number>();
    stabledHorses.add(ped);
    Log(`stabledHorses.add(${ped});`);
    Log('stabledHorses', [...stabledHorses.values()]);
    stableHorsePeds.set(characterId, stabledHorses);
    this._stableHorsePeds.set(stableId, stableHorsePeds);

    this._stabledHorses.set(horseId, stableId);

    const horse = this._horses.get(horseId);
    if (horse) {
      horse.stable = stable.id;
      horse.save();
    }
  }

  getHorseStall(horsePed: number): number | undefined {
    return this._horsePedsStalls.get(horsePed);
  }

  unstableHorse(horseId: Horse.Id, horsePed: number, makeNetworked = false): void {
    Log('unstableHorse', horseId);
    const stable = this.getByHorseId(horseId);

    if (!stable) {
      return;
    }

    this._stabledHorses.delete(horseId);
    const stableHorsePeds = this._stableHorsePeds.get(stable.id);
    if (stableHorsePeds) {
      for (const [characterId, horsePeds] of stableHorsePeds.entries()) {
        if (horsePeds.has(horsePed)) {
          horsePeds.delete(horsePed);
          Log(`horsePeds.delete(${horsePed});`);
          Log('horsePeds', [...horsePeds.values()]);
          stableHorsePeds.set(characterId, horsePeds);
          break;
        }
      }
      this._stableHorsePeds.set(stable.id, stableHorsePeds);
    }

    if (makeNetworked) {
      NetworkRegisterEntityAsNetworked(horsePed);
    } else {
      this._unstabledHorsePedsTemp.add(horsePed);
    }
    SetPedConfigFlag(horsePed, PedConfigFlag.Unridable, false);

    if (stable.horses.includes(horseId)) {
      const horses = [...stable.horses];
      horses.splice(horses.indexOf(horseId), 1);
      stable.horses = horses;
    }

    const horse = this._horses.get(horseId);
    if (horse) {
      horse.stable = null;
      horse.save();
    }
  }

  horseMakeNetworked(horsePed: number): void {
    NetworkRegisterEntityAsNetworked(horsePed);
    this._unstabledHorsePedsTemp.delete(horsePed);
  }

  /**
   * horse stuff
   */

  async spawnHorse(horse: Horse, options: Horse.SpawnOptions = {}): Promise<number> {
    // if (this._spawningHorse.get(horse.id)) {
    //   return;
    // }
    // this._spawningHorse.set(horse.id, true);

    Log('spawning horse', horse.name);

    const playerPed = PVGame.playerPed();
    const characterId = PVGame.characterId();
    if (!characterId) {
      Log('Error no character');
      return 0;
    }

    let spawnCoord = {
      x: horse.lastX,
      y: horse.lastY,
      z: horse.lastZ - 1.0,
      w: 0.0,
    };
    if (options.overrideCoord) {
      spawnCoord = {
        x: options.overrideCoord.x,
        y: options.overrideCoord.y,
        z: options.overrideCoord.z,
        w: options.overrideCoord.w,
      };
    }

    await PVGame.loadModel(horse.model);
    const horsePed = CreatePed(
      horse.model,
      spawnCoord.x,
      spawnCoord.y,
      spawnCoord.z,
      spawnCoord.w,
      false,
      false,
      false,
      false,
    );

    SetAttributePoints(horsePed, 0, horse.statHealth);
    SetAttributePoints(horsePed, 1, horse.statEndurance);
    SetAttributePoints(horsePed, 4, horse.statHandling);
    SetAttributePoints(horsePed, 5, horse.statSpeed);
    SetAttributePoints(horsePed, 6, horse.statAcceleration);
    if (horse.statBonding[characterId]) {
      SetAttributePoints(horsePed, 7, horse.statBonding[characterId]);
    }

    // Log('spawnedHorse', horsePed);

    await Delay(1);
    await PVGame.pedIsReadyToRender(horsePed);

    SetPedConfigFlag(horsePed, PedConfigFlag.BlockHorsePromptsForTargetPed, true);

    SetEntityVisible(horsePed, true);
    SetEntityAlpha(horsePed, 255, false);
    SetRandomOutfitVariation(horsePed, true);

    if (options.scale) {
      SetPedScale(horsePed, options.scale);
    }

    await Delay(100);

    if (horse.gender === 'MALE') {
      Log('Set Horse Face Features to Male');
      PVGame.setPedFaceFeature(horsePed, 0xa28b, 0.0); // Default
    } else if (horse.gender === 'FEMALE') {
      Log('Set Horse Face Features to Female');
      PVGame.setPedFaceFeature(horsePed, 0xa28b, 1.0);
    }
    // HORSE_EQUIPMENT_MALE_GENITALS
    // HORSE_EQUIPMENT_FEMALE_GENITALS
    await Delay(1);
    Citizen.invokeNative('0x704c908e9c405136', horsePed); // FIX_OUTFIT

    await Delay(50);

    for (const component of horse.components) {
      // Log('component', component);
      const componentData = PVGame.getComponentById(component);
      // Log('componentData', componentData);
      ApplyShopItemToPed(horsePed, component, false, componentData?.isMp || false, false); // _SET_PED_COMPONENT_ENABLED
      await Delay(1);
    }
    await Delay(1);
    Citizen.invokeNative('0x704c908e9c405136', horsePed); // FIX_OUTFIT
    // SetActiveMetaPedComponentsUpdated
    Citizen.invokeNative('0xaab86462966168ce', horsePed, true);
    await Delay(1);
    UpdatePedVariation(horsePed, false, true, true, true, false);

    await Delay(50);

    SetModelAsNoLongerNeeded(horse.model);
    await Delay(50);

    // Citizen.invokeNative('0xD2CB0FB0FDCB473D', gameManager.playerId, horsePed) // SetPedAsSaddleHorseForPlayer
    // Citizen.invokeNative('0xE6D4E435B56D5BD0', gameManager.playerId, horsePed) // SetPlayerOwnsMount
    SetPedRelationshipGroupHash(horsePed, GetPedRelationshipGroupHash(horsePed));
    //SetPedOwnsAnimal
    Citizen.invokeNative('0x931B241409216C1F', playerPed, horsePed);

    if (options.local) {
      NetworkSetEntityOnlyExistsForParticipants(horsePed, true);
    } else {
      await PVGame.registerNetworkEntity(horsePed);
      // SetPedMotivation
      // for (let n = 10; n--; ) {
      //   Citizen.invokeNative('0x06D26A96CA1BCA75', horsePed, n, 0.0, gameManager.playerPed)
      // }
      // Citizen.invokeNative('0x06D26A96CA1BCA75', horsePed, 0, 0.8, gameManager.playerPed);
    }

    // this._spawningHorse.set(horse.id, false);

    // this.entitySetHorse(horsePed, horse);

    DecorSetInt(horsePed, DECOR_HORSE_ID, horse.id);

    return horsePed;
  }
}

export default StableController.getInstance();
