import { PVBase, PVCustomization, PVGame, PVInit, PVZone, onResourceInit } from '@lib/client';
import { Log, awaitUI } from '@lib/client/comms/ui';
import { PedConfigFlag } from '@lib/flags';
import { Delay } from '@lib/functions';
import { Vector3, clamp, lerp } from '@lib/math';
import { GetDays } from '@lib/shared/time';

import HorseExpressions from '../../shared/data/horse-expressions';
import StableData from '../../shared/data/stableData';
import type { DNA } from '../../shared/dna';
import Horse from '../classes/horse';
import Stable from '../classes/stable';

DecorRegister('horseId', 3);

export enum WhistleType {
  WHISTLE_MAIN,
  WHISTLE_SECONDARY,
  WHISTLE_DOUBLE,
  WHISTLE_URGENT,
  WHISTLE_LONG,
}

class StableController {
  protected static instance: StableController;

  protected _horses: Map<Horse.Id, Horse> = new Map();
  protected _pregnancies: Horse.Pregnancy[] = [];

  protected _stables: Map<Stable.Id, Stable> = new Map();
  protected _stabledHorses: Map<Horse.Id, Stable.Id> = new Map();

  protected _currentStable: Stable.Id = '';
  // protected _currentStableStalls: Vector4Format[] = [];

  // protected _characterInStables: Map<Stable.Id, Set<number>> = new Map(); // Map<StableId, Set<CharacterId>>
  protected _stableHorsePeds: Map<Stable.Id, Map<number, Set<number>>> = new Map(); // Map<StableId, Map<CharacterId, Set<EntityId>>
  protected _horsePedsStalls: Map<number, number> = new Map();

  protected _unstabledHorsePeds: Set<number> = new Set();
  protected _unstabledHorsePedsTemp: Set<number> = new Set();

  protected _whistlingHorse = false;

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
    const handleUnstabledHorse = (mount: number) => {
      if (this._unstabledHorsePedsTemp.has(mount)) {
        this.horseMakeNetworked(mount);
      }
    };
    on('events_manager:mount', (onMount: number, horse: number, currentSeat: number) => {
      // Log('events_manager:mount', onMount, horse, currentSeat);
      handleUnstabledHorse(horse);
    });
    on('events_manager:leading', (isLeading: number, horse: number) => {
      // Log('isLeading', isLeading, horse);
      handleUnstabledHorse(horse);
    });
    on('events_manager:onRoad', (onRoad: boolean) => {
      Log('onRoad', onRoad);
      if (onRoad) {
        // Rescale Handling | Speed | Acceleration based on horseshoes by about 1/3 each
      } else {
        // Rescale Handling | Speed | Acceleration based on OffRoad stat by about 1/3 each
        // const horsePed = GetSaddleHorseForPlayer(PlayerId());
        // SetAttributePoints(horse, 4, newHandling);
        // SetAttributePoints(horse, 5, newSpeed);
        // SetAttributePoints(horse, 6, newAcceleration);
      }
    });

    setInterval(() => {
      this.updateUnstableHorseCoords();
    }, 5e3);
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

  updateUnstableHorseCoords(): void {
    for (const horsePed of this._unstabledHorsePeds) {
      if (!DoesEntityExist(horsePed)) {
        this._unstabledHorsePeds.delete(horsePed);
        continue;
      }

      const horseId = Entity(horsePed).state.horseId;
      if (!horseId) {
        this._unstabledHorsePeds.delete(horsePed);
        continue;
      }

      const horse = this._horses.get(horseId);
      if (!horse) {
        this._unstabledHorsePeds.delete(horsePed);
        continue;
      }

      const coords = GetEntityCoords(horsePed, true);
      horse.lastX = coords[0];
      horse.lastY = coords[1];
      horse.lastZ = coords[2];
    }
  }

  async loadHorses(characterId: number) {
    Log('Load Horses Started');
    PVInit.register('stable::load-hoses', { reset: true });
    const [horses, pregnancies] = await awaitUI('stable.load-character-horses', characterId);
    // Log('horses', horses);
    // Log('pregnancies', pregnancies);
    for (const horse of horses) {
      // Log('horse', horse);
      this._horses.set(horse.id, new Horse(horse));
      this._stabledHorses.set(horse.id, horse.stable || '');
    }
    this._pregnancies.push(...pregnancies);
    PVInit.resolve('stable::load-hoses');
    Log('Load Horses Finished');
  }

  isHorsePregnant(horseId: Horse.Id): boolean {
    return this._pregnancies.some((pregnancy) => pregnancy.motherId === horseId && pregnancy.status === 'ACTIVE');
  }

  getHorsePregnancy(horseId: Horse.Id, status?: Horse.PregnancyStatus): Horse.Pregnancy | undefined {
    return this._pregnancies.find(
      (pregnancy) => pregnancy.motherId === horseId && (!status || pregnancy.status === status),
    );
  }

  pregnancyProgress(horseId: Horse.Id): number | null {
    const pregnancy = this.getHorsePregnancy(horseId, 'ACTIVE');
    if (!pregnancy) {
      return null;
    }
    const now = Date.now();
    const conceivedAt = new Date(pregnancy.conceivedAt).getTime();
    const daysPregnant = GetDays(now - conceivedAt);
    return Math.min(daysPregnant / 6, 1.0);
  }

  async birthFoal(motherPed: number, motherId: Horse.Id) {
    const pregnancy = this.getHorsePregnancy(motherId, 'ACTIVE');
    if (!pregnancy) {
      Log('No active pregnancy found for horse', motherId);
      return;
    }
    pregnancy.status = 'BIRTHED';

    const motherHorse = this._horses.get(motherId);
    if (!motherHorse) {
      Log('Mother horse not found', motherId);
      return;
    }

    const coords = Vector3.fromArray(GetEntityCoords(motherPed, true, false));
    const forward = Vector3.fromArray(GetEntityForwardVector(motherPed));
    const heading = GetEntityHeading(motherPed);

    coords.sub(forward.multiplyScalar(1.5));

    const foalHorse = this._horses.get(pregnancy.foalId);
    if (!foalHorse) {
      Log('Foal horse not found', pregnancy.foalId);
      return;
    }

    foalHorse.lastX = coords.x;
    foalHorse.lastY = coords.y;
    foalHorse.lastZ = coords.z;

    SetEntityCollision(motherPed, false, true);
    const foalPed = await this.spawnHorse(foalHorse, { heading: heading + 180 });
    this.horsePedLoadDNA(motherPed, motherHorse.dna, motherHorse.age);
    SetEntityCollision(motherPed, true, true);

    PVGame.taskPlayAnim({
      entity: foalPed,
      dict: 'amb_creature_mammal@world_horse_injured_on_ground@fidget',
      anim: 'fidget_a',
      blendInSpeed: 8,
      blendOutSpeed: -1,
      duration: 500,
    });
    await Delay(500);
    SetPedToRagdoll(foalPed, 1000, 3000, 0, false, false, false);

    // foalHorse.save();
    Log('Foal born', foalHorse);
  }

  canHorseSpawn(horseId: Horse.Id): boolean {
    const foalPregnancy = this._pregnancies.find((pregnancy) => pregnancy.foalId === horseId);

    if (foalPregnancy && foalPregnancy.status !== 'BIRTHED') {
      return false;
    }

    return true;
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
        if (horsePed === 0) {
          continue;
        }
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
    //   const horseId = Entity(horsePed).state.horseId;
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
    return !!this._stabledHorses.get(horseId);
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
      this.horseMakeNetworked(horsePed);
    } else {
      this._unstabledHorsePedsTemp.add(horsePed);
    }

    if (stable.horses.includes(horseId)) {
      const horses = [...stable.horses];
      horses.splice(horses.indexOf(horseId), 1);
      stable.horses = horses;
    }

    const horse = this._horses.get(horseId);
    if (horse) {
      horse.stable = null;
      horse.save();

      if (horse.age > 3) {
        SetPedConfigFlag(horsePed, PedConfigFlag.Unridable, false);
      }
    }

    this.makeHorseActiveMount(horsePed);
  }

  makeHorseActiveMount(horsePed: number): void {
    SetPlayerOwnsMount(PlayerPedId(), horsePed);
    // SetPedActivePlayerHorse(PlayerId(), horsePed);
    SetPedAsSaddleHorseForPlayer(PlayerId(), horsePed);
    SetAttributePoints(horsePed, 7, 2450);
    CompendiumHorseBonding(horsePed, 4);
    SetMountBondingLevel(horsePed, 4);
  }

  whistleHorsePed(horsePed: number, whistleEventType: number): boolean {
    if (!horsePed || !DoesEntityExist(horsePed)) {
      return false;
    }
    if (IsPedDeadOrDying(horsePed, true)) {
      return true;
    }
    let whistleType = WhistleType.WHISTLE_MAIN;
    switch (whistleEventType) {
      case GetHashKey('WHISTLEHORSERESPONSIVE'):
      case GetHashKey('WHISTLEHORSETALK'):
        whistleType = WhistleType.WHISTLE_MAIN;
        break;
      case GetHashKey('WHISTLEHORSEDOUBLE'):
        whistleType = WhistleType.WHISTLE_DOUBLE;
        break;
      case GetHashKey('WHISTLEHORSESHORT'):
        whistleType = WhistleType.WHISTLE_URGENT;
        break;
      case GetHashKey('WHISTLEHORSELONG'):
        whistleType = WhistleType.WHISTLE_LONG;
    }

    const playerPed = PVGame.playerPed();
    TaskGoToWhistle(horsePed, playerPed, whistleType);
    Log(`TaskGoToWhistle(${horsePed}, ${playerPed}, ${whistleType});`);
    return true;
  }

  async whistleLastOrNearby(whistleEventType: number): Promise<void> {
    const horsePed = GetSaddleHorseForPlayer(PlayerId());
    if (horsePed && this.whistleHorsePed(horsePed, whistleEventType)) {
      Log('Whistled current mount');
      return;
    }

    if (this._whistlingHorse) {
      return;
    }
    this._whistlingHorse = true;

    const playerCoords = PVGame.playerCoords();
    const nearbyUnstabledHorses = [];

    // Log('Horses', this._horses.size);

    for (const horse of this._horses.values()) {
      if (!horse.stable) {
        const horseCoords = new Vector3(horse.lastX, horse.lastY, horse.lastZ);

        const distance = horseCoords.getDistance(playerCoords);

        // Log('distance', distance);

        if (distance > 60) {
          continue;
        }

        nearbyUnstabledHorses.push(horse);
      }
    }

    // Log(nearbyUnstabledHorses);

    for (const horse of nearbyUnstabledHorses) {
      const horsePed = await this.spawnHorse(horse);
      this.makeHorseActiveMount(horsePed);
      await Delay(125);
      this.whistleHorsePed(horsePed, whistleEventType);
    }

    this._whistlingHorse = false;
  }

  /**
   * horse stuff
   */
  async horseMakeNetworked(horsePed: number): Promise<void> {
    await PVGame.registerNetworkEntity(horsePed);
    const horseNetId = NetworkGetNetworkIdFromEntity(horsePed);
    if (horseNetId) {
      emitNet('stable:track-horse', horseNetId);
    }

    this._unstabledHorsePedsTemp.delete(horsePed);
    this._unstabledHorsePeds.add(horsePed);

    const horseId = DecorGetInt(horsePed, 'horseId');
    Entity(horsePed).state.set('horseId', horseId, true);
    Log(`Entity(${horsePed}).state.set('horseId', ${horseId}, true);`);

    if (this.isHorsePregnant(horseId)) {
      Entity(horsePed).state.set('pregnant', true, true);
    }
  }

  setHorseBlip(horsePed: number, horse: Horse): void {
    const horseBlip = BlipAddForEntity(-1230993421, horsePed); // _BLIP_ADD_FOR_ENTITY
    SetBlipSprite(horseBlip, GetHashKey('blip_horse_owned'), true);
    SetBlipName(horseBlip, horse.name);
  }

  async spawnHorse(horse: Horse, options: Horse.SpawnOptions = {}): Promise<number> {
    if (!this.canHorseSpawn(horse.id) && !options.force) {
      Log('Horse cannot spawn yet', horse.id);
      return 0;
    }

    Log('spawning horse', horse.name);
    // Log('horse dna', horse.dna);

    const playerPed = PVGame.playerPed();
    const characterId = PVGame.characterId();
    if (!characterId) {
      Log('Error no character');
      return 0;
    }

    const [retval, groundZ] = GetGroundZFor_3dCoord(horse.lastX, horse.lastY, horse.lastZ - 1.0, false);

    let spawnCoord = {
      x: horse.lastX,
      y: horse.lastY,
      z: retval ? groundZ : horse.lastZ - 1.0,
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
      spawnCoord.z - 10,
      spawnCoord.w,
      false,
      false,
      false,
      false,
    );

    SetEntityCoords(horsePed, spawnCoord.x, spawnCoord.y, spawnCoord.z, false, false, false, true);

    if (horse.statBonding[characterId]) {
      SetAttributePoints(horsePed, 7, horse.statBonding[characterId]);
    }

    // Log('spawnedHorse', horsePed);

    await Delay(1);
    await PVGame.pedIsReadyToRender(horsePed);

    if (options.heading) {
      SetEntityHeading(horsePed, options.heading);
    }

    SetPedConfigFlag(horsePed, PedConfigFlag.BlockHorsePromptsForTargetPed, true);

    SetEntityAlpha(horsePed, 255, false);
    SetRandomOutfitVariation(horsePed, true);
    SetEntityVisible(horsePed, false);

    if (options.scale) {
      SetPedScale(horsePed, options.scale);
    }

    await Delay(50);
    // HORSE_EQUIPMENT_MALE_GENITALS
    // HORSE_EQUIPMENT_FEMALE_GENITALS
    await Delay(1);
    Citizen.invokeNative('0x704c908e9c405136', horsePed); // FIX_OUTFIT

    await Delay(1);

    for (const component of horse.components) {
      // Log('component', component);
      const componentData = PVGame.getComponentById(component);
      // Log('componentData', componentData);
      ApplyShopItemToPed(horsePed, component, false, componentData?.isMp || false, false); // _SET_PED_COMPONENT_ENABLED
      await Delay(10);
    }
    await Delay(1);
    Citizen.invokeNative('0x704c908e9c405136', horsePed); // FIX_OUTFIT
    // SetActiveMetaPedComponentsUpdated
    Citizen.invokeNative('0xaab86462966168ce', horsePed, true);
    await Delay(1);

    await this.horsePedLoadDNA(horsePed, horse.dna, horse.age);
    if (horse.gender === 'MALE') {
      Log('Set Horse Face Features to Male');
      PVGame.setPedFaceFeature(horsePed, 0xa28b, 0.0); // Default
    } else if (horse.gender === 'FEMALE') {
      Log('Set Horse Face Features to Female');
      PVGame.setPedFaceFeature(horsePed, 0xa28b, 1.0);
    }

    const pregnancyProgress = this.pregnancyProgress(horse.id);
    if (pregnancyProgress) {
      Log('Set Pregnant Horse Face Features');
      const bellyHeight = GetPedFaceFeature(horsePed, 63348);
      const bellyWidth = GetPedFaceFeature(horsePed, 57577);

      SetPedFaceFeature(horsePed, 63348, bellyHeight - pregnancyProgress * 1.5);
      SetPedFaceFeature(horsePed, 57577, bellyWidth + pregnancyProgress * 1.5);

      const maxSpeed = lerp(1.0, 3.0, 1.0 - pregnancyProgress);
      emit('health:client:horseSpeedLimit', horsePed, maxSpeed);
    }

    const bellyHeight = GetPedFaceFeature(horsePed, 63348);
    const bellyWidth = GetPedFaceFeature(horsePed, 57577);

    const weightFactor = (horse.weight - 30) / 70;

    if (weightFactor !== 0) {
      SetPedFaceFeature(horsePed, 63348, bellyHeight - weightFactor * 1.5);
      SetPedFaceFeature(horsePed, 57577, bellyWidth + weightFactor * 1.5);

      if (horse.weight > 50) {
        const maxSpeed = lerp(3.0, 1.0, (horse.weight - 50) / 50);
        emit('health:client:horseSpeedLimit', horsePed, maxSpeed);
      }
    }

    if (horse.age > 20) {
      const maxSpeed = lerp(1.0, 3.0, (30 - horse.age) / 10);
      emit('health:client:horseSpeedLimit', horsePed, maxSpeed);
    }
    if (horse.age > 30) {
      SetEntityHealth(horsePed, 0, horsePed);
    }

    // UpdatePedVariation(horsePed, false, true, true, true, false);
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
      await this.horseMakeNetworked(horsePed);

      // SetPedMotivation
      // for (let n = 10; n--; ) {
      //   Citizen.invokeNative('0x06D26A96CA1BCA75', horsePed, n, 0.0, gameManager.playerPed)
      // }
      // Citizen.invokeNative('0x06D26A96CA1BCA75', horsePed, 0, 0.8, gameManager.playerPed);
    }

    // this._spawningHorse.set(horse.id, false);

    // this.entitySetHorse(horsePed, horse);

    Log(`Entity(${horsePed}).state.set('horseId', ${horse.id}, true);`);
    Entity(horsePed).state.set('horseId', horse.id, true);
    DecorSetInt(horsePed, 'horseId', horse.id);

    SetEntityVisible(horsePed, true);

    this.setHorseBlip(horsePed, horse);

    return horsePed;
  }

  async horsePedLoadDNA(horsePed: number, dna: DNA, age: number): Promise<void> {
    const health = dna.getGene<number>('Health');
    if (health !== undefined) {
      SetAttributePoints(horsePed, 0, health.value);
      await Delay(1);
      // Log('Set Health', health.value);
    }
    const endurance = dna.getGene<number>('Endurance');
    if (endurance !== undefined) {
      SetAttributePoints(horsePed, 1, endurance.value);
      await Delay(1);
      // Log('Set Endurance', endurance.value);
    }
    const handling = dna.getGene<number>('Handling');
    if (handling !== undefined) {
      SetAttributePoints(horsePed, 4, handling.value);
      await Delay(1);
      // Log('Set Handling', handling.value);
    }
    const speed = dna.getGene<number>('Speed');
    if (speed !== undefined) {
      SetAttributePoints(horsePed, 5, speed.value);
      await Delay(1);
      // Log('Set Speed', speed.value);
    }
    const acceleration = dna.getGene<number>('Acceleration');
    if (acceleration !== undefined) {
      SetAttributePoints(horsePed, 6, acceleration.value);
      await Delay(1);
      // Log('Set Acceleration', acceleration.value);
    }

    for (const [name, id] of Object.entries(HorseExpressions)) {
      const gene = dna.getGene<number>(name);
      if (gene) {
        SetPedFaceFeature(horsePed, id, gene.value);
        await Delay(1);
        // Log(`Set ${name}`, gene.value);
      }
    }

    const HealthHandlingSpeed =
      (dna.getGene<number>('Health')?.value || 0) +
      (dna.getGene<number>('Handling')?.value || 0) +
      (dna.getGene<number>('Speed')?.value || 0);
    SetPedFaceFeature(horsePed, 8147, lerp(-1, 1, HealthHandlingSpeed / 6000));
    await Delay(1);
    // Log('HealthHandlingSpeed', lerp(-1, 1, HealthHandlingSpeed / 6000), HealthHandlingSpeed);
    const OffRoadEnduranceAcceleration =
      (dna.getGene<number>('OffRoad')?.value || 0) +
      (dna.getGene<number>('Endurance')?.value || 0) +
      (dna.getGene<number>('Acceleration')?.value || 0);
    SetPedFaceFeature(horsePed, 3015, lerp(-1, 1, OffRoadEnduranceAcceleration / 6000));
    await Delay(1);
    // Log('OffRoadEnduranceAcceleration', lerp(-1, 1, OffRoadEnduranceAcceleration / 6000), OffRoadEnduranceAcceleration);

    const scaleGene = dna.getGene<number>('Scale');
    let scale = 1.0;
    if (scaleGene) {
      scale = scaleGene.value;
    }

    if (age < 5) {
      scale *= lerp(0.5, 1.0, age / 5);
    }

    SetPedScale(horsePed, scale);
    await Delay(1);
    Log('Set Scale', scale);

    if (dna.getGene<number>('BodyTint0') || dna.getGene<number>('BodyTint1') || dna.getGene<number>('BodyTint2')) {
      for (const part of ['head', 'hand']) {
        PVCustomization.setTintByHorsePart(
          horsePed,
          // @ts-ignore
          part,
          'metaped_tint_horse',
          Math.floor(dna.getGene<number>('BodyTint0')?.value || 0),
          Math.floor(dna.getGene<number>('BodyTint1')?.value || 0),
          Math.floor(dna.getGene<number>('BodyTint2')?.value || 0),
        );
        await Delay(1);
        // Log(`Set ${part} tint`, {
        //   part,
        //   tint0: Math.floor(dna.getGene<number>('BodyTint0')?.value || 0),
        //   tint1: Math.floor(dna.getGene<number>('BodyTint1')?.value || 0),
        //   tint2: Math.floor(dna.getGene<number>('BodyTint2')?.value || 0),
        // });
      }
    }

    if (dna.getGene<number>('HairTint0') || dna.getGene<number>('HairTint1') || dna.getGene<number>('HairTint2')) {
      for (const part of ['hair', 'mane']) {
        PVCustomization.setTintByHorsePart(
          horsePed,
          // @ts-ignore
          part,
          'metaped_tint_horse',
          Math.floor(dna.getGene<number>('HairTint0')?.value || 0),
          Math.floor(dna.getGene<number>('HairTint1')?.value || 0),
          Math.floor(dna.getGene<number>('HairTint2')?.value || 0),
        );
        await Delay(1);
        // Log(`Set ${part} tint`, {
        //   part,
        //   tint0: Math.floor(dna.getGene<number>('HairTint0')?.value || 0),
        //   tint1: Math.floor(dna.getGene<number>('HairTint1')?.value || 0),
        //   tint2: Math.floor(dna.getGene<number>('HairTint2')?.value || 0),
        // });
      }
    }
  }

  getHorseById(id: Horse.Id): Horse | undefined {
    return this._horses.get(id);
  }
}

export default StableController.getInstance();
