import { Log } from '@lib/client/comms/ui';

// TODO: Rename to InventoryWorldManager
export class WorldManager {
  protected static instance: WorldManager;

  static getInstance(): WorldManager {
    if (!WorldManager.instance) {
      WorldManager.instance = new WorldManager();
    }
    return WorldManager.instance;
  }

  initialized = false;

  tick: number | undefined;
  inventories = new Set<string>();

  constructor() {}

  async init() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
  }

  setInventories(inventories: string[]) {
    this.inventories = new Set(inventories);
    this.setupTick();
  }

  /*
   * TODO: Replace Markers with Non-Networked Objects
   *  crun SetPickupLight(__id__, true)
   *
   *  p_moneybag01x
   *  p_cs_dirtybag01x
   *  p_cs_vegsack_up
   */
  drawMarkers() {
    for (const inventory of this.inventories) {
      const stringCoords = inventory.split(':')[1]?.split('_');
      if (stringCoords.length !== 3) {
        continue;
      }

      const [x, y, z] = stringCoords.map(Number);
      // Log(inventory, x, y, z);

      DrawMarker(
        0x94fdae17,
        x + 0.01,
        y + 0.01,
        z + 0.15,
        0,
        0,
        0,
        0,
        0,
        0,
        0.15,
        0.15,
        0.15,
        225,
        0,
        75,
        127,
        false,
        false,
        2,
        false,
        0,
        0,
        false,
      );
    }
  }

  setupTick() {
    if (this.inventories.size) {
      if (!this.tick) {
        Log('Starting Tick');
        this.tick = setTick(this.drawMarkers.bind(this));
      }
    } else if (this.tick) {
      Log('Clearing Tick');
      clearTick(this.tick);
      delete this.tick;
    }
  }
}

const worldManager = WorldManager.getInstance();

export default worldManager;
