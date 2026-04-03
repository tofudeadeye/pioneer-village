import { Log } from '@lib/client/comms/ui';
import { BlipStyles } from '@lib/shared/blips';

export class BlipController {
  protected static instance: BlipController;

  protected blips: Map<string, Base.BlipData> = new Map();

  static getInstance(): BlipController {
    if (!BlipController.instance) {
      BlipController.instance = new BlipController();
    }
    return BlipController.instance;
  }

  initialized = false;

  constructor() {
    on('onResourceStop', (resourceName: string) => {
      if (resourceName === GetCurrentResourceName()) {
        this.destruct();
      }
    });
  }

  destruct(): void {
    for (const [id, data] of this.blips.entries()) {
      Citizen.invokeNative('0x01B928CA2E198B01', data.id);
      RemoveBlip(data.id);
      this.blips.delete(id);
    }
  }

  register(id: string, data: Base.BlipDataWithoutId, style = BlipStyles.NEUTRAL_OBJECTIVE) {
    // Log('BlipController::register', id, data);
    if (this.blips.has(id)) {
      Log(`Blip with id ${id} already exists, unregistering before registering new one.`);
      this.unregister(id);
    }

    const blipId = BlipAddForCoords(style, data.coords.x, data.coords.y, data.coords.z);
    SetBlipSprite(blipId, data.sprite, true);
    if (data.modifiers) {
      for (const modifier of data.modifiers) {
        BlipAddModifier(blipId, modifier);
      }
    }

    SetBlipName(blipId, data.label);
    // Log('Registering blip with id', id, blipId);
    this.blips.set(id, { id: blipId, ...data });
    return blipId;
  }

  unregister(id: string) {
    const blipData = this.blips.get(id);
    if (!blipData) {
      return;
    }
    Log('Unregistering blip with id', id, blipData.id);
    Citizen.invokeNative('0x01B928CA2E198B01', blipData.id);
    RemoveBlip(blipData.id);
    this.blips.delete(id);
  }
}

const blipController = BlipController.getInstance();

export default blipController;
