import { type EventData, PVEvents, PVGame, awaitUI } from '@lib/client';
import { Log } from '@lib/client/comms/ui';
import { Delay } from '@lib/functions';

import { PELTS_HASHED, PROVISION_HASHES } from '../../shared/data/pelts';
import stableController from './stable-controller';

export class PeltController {
  protected static instance: PeltController;

  static getInstance(): PeltController {
    if (!PeltController.instance) {
      PeltController.instance = new PeltController();
    }
    return PeltController.instance;
  }

  initialized = false;

  constructor() {
    PVEvents.register('EVENT_PLACE_CARRIABLE_ONTO_PARENT', (data) => {
      this.eventPlaceCarriable(data);
    });

    this.init();
  }

  async init() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
  }

  eventPlaceCarriable(data: EventData['EVENT_PLACE_CARRIABLE_ONTO_PARENT']) {
    // Log('EVENT_PLACE_CARRIABLE_ONTO_PARENT', data);

    if (data.provision === 0 || data.ped !== PlayerPedId() || !GetIsCarriablePelt(data.carriable)) return;

    const horseEntity = data.parent;
    const horseId = Entity(horseEntity).state.horseId;
    // Log('Horse ID:', horseId);
    if (!horseId) {
      return false;
    }

    const provision = data.provision;
    const peltTexture = Citizen.invokeNative<number>('0x120376c23f019c6c', data.carriable, Citizen.pointerValueInt());
    const horseState = Entity(horseEntity).state;

    // Log('Pelt with texture placed on horse', peltTexture);

    const pelts = horseState.pelts || [];

    // Log(`Horse ${horseEntity} last pelts:`, pelts);

    pelts.push([provision, peltTexture]);

    horseState.set('pelts', pelts, true);
    Log('Pelts\n', pelts.join('\n '));

    this.updateHorsePelts(pelts, horseId);
  }

  async removePelt(horsePed: number) {
    const horseState = Entity(horsePed).state;
    const pelts: [number, number][] = horseState.pelts || [];
    if (pelts.length === 0) {
      return false;
    }

    const pelt = pelts.pop();
    if (!pelt) {
      return false;
    }

    const spawned = await this.spawnPelt(pelt);
    if (!spawned) {
      return false;
    }

    Log('Remaining Pelts', pelts.length);
    horseState.set('pelts', pelts, true);

    stableController.setupHorsePelts(horsePed);

    const horseId = horseState.horseId;
    if (horseId) {
      this.updateHorsePelts(pelts, horseId);
    }
    return true;
  }

  async spawnPelt(pelt: [number, number]) {
    const [provision, texture] = pelt;

    const provisionData = PROVISION_HASHES[provision];
    const textureData = PELTS_HASHED[texture];
    if (!provisionData || !textureData) {
      return false;
    }

    Log('Spawning pelt with provision:', provisionData, textureData);

    const { model, carryConfig } = provisionData;
    const { albedo, normal, material } = textureData;

    const coords = PVGame.playerCoords();
    coords.z -= 2;

    const object = await PVGame.createObject(model, coords);
    if (!object) {
      return false;
    }

    TaskCarriable(object, carryConfig, 0, 0, 0);
    SetEntityCarcassType(object, provision);

    RequestStreamedTxd(albedo, false);
    RequestStreamedTxd(normal, false);
    RequestStreamedTxd(material, false);

    await Delay(100);

    Citizen.invokeNative(
      '0xDD03FC2089AD093C', // Apply pelt texture
      object,
      provision,
      texture,
      0,
    );

    await PVGame.playAnimTask({
      dict: 'mech_skin@armadillo@horse_satchel@remove@lt',
      anim: 'enter_lf',
    });

    TaskPickupCarriableEntity(PlayerPedId(), object);

    return true;
  }

  updateHorsePelts(pelts: [number, number][], horseId: number) {
    const horse = stableController.getHorseById(horseId);
    if (!horse) {
      return;
    }
    horse.pelts = pelts;
    horse.save();
  }
}

const peltController = PeltController.getInstance();

export default peltController;
