type HatItemId = number;
type HatData = {
  entity: number;
  netId: number;
};

export class HatManager {
  protected static instance: HatManager;

  protected hats: Map<HatItemId, HatData> = new Map();

  static getInstance(): HatManager {
    if (!HatManager.instance) {
      HatManager.instance = new HatManager();
    }
    return HatManager.instance;
  }

  initialized = false;

  constructor() {
    this.init();
  }

  async init() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
  }

  registerHat(itemId: HatItemId, hatEntity: number) {
    const hatNetId = NetworkGetNetworkIdFromEntity(hatEntity);
    this.hats.set(itemId, { entity: hatEntity, netId: hatNetId });
    Entity(hatEntity).state.set('hatItemId', itemId, true);
  }

  registerHatByNetId(itemId: HatItemId, hatNetId: number) {
    const hatEntity = NetworkGetEntityFromNetworkId(hatNetId);
    this.hats.set(itemId, { entity: hatEntity, netId: hatNetId });
    console.log('this.hats.set', itemId, { entity: hatEntity, netId: hatNetId });
    Entity(hatEntity).state.set('hatItemId', itemId, true);
  }

  deleteHatByItemId(itemId: HatItemId) {
    const hatData = this.hats.get(itemId);
    console.log('deleteHatByItemId', itemId, hatData);
    if (hatData) {
      this.hats.delete(itemId);
      DeleteEntity(hatData.entity);
      console.log('Hat entity deleted:', hatData.entity);
    }
  }
}

const hatManager = HatManager.getInstance();

export default hatManager;
