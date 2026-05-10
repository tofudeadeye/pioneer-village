import { PVBase, emitUI, focusUI } from '@lib/client';
import { emitSocket } from '@lib/client/comms/ui';
import { DecorType } from '@lib/shared/decor-type';

type InventoryDetail = {
  identifier: string;
  coords: Vector3Format;
  objectId: number;
};

DecorRegister('isInventory', DecorType.BOOL);

/*
 *  p_moneybag01x
 *  p_cs_dirtybag01x
 *  p_cs_vegsack_up
 */
const objectModel = GetHashKey('p_cs_dirtybag01x');

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
  inventoryDetails = new Map<string, InventoryDetail>();
  objects = new Map<number, string>();

  constructor() {
    this.init();
    console.log('constructor');

    // Cleanup on resource stop
    on('onResourceStop', (resourceName: string) => {
      if (resourceName === GetCurrentResourceName()) {
        this.destruct();
      }
    });
  }

  destruct() {
    const allSpawnedEntities = Array.from(this.inventoryDetails.values()).map((detail) => detail.objectId);
    console.log('Cleaning up inventory objects', allSpawnedEntities);
    PVBase.deleteEntities(allSpawnedEntities);
  }

  init() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    console.log('WorldManager initialized');

    emitSocket('inventory.get-world-inventories');
  }

  setInventories(inventories: string[]) {
    this.inventories = new Set(inventories);

    console.log('this.inventories', this.inventories);
    this.placeInventoryObjects();
    this.cleanupInventoryObjects();
  }

  cleanupInventoryObjects() {
    for (const [objectId, identifier] of this.objects.entries()) {
      if (!this.inventories.has(identifier)) {
        console.log('Removing inventory object for identifier:', identifier, 'with objectId:', objectId);
        this.inventoryDetails.delete(identifier);
        PVBase.deleteEntity(objectId);
      }
    }
  }

  placeInventoryObjects() {
    for (const identifier of this.inventories.values()) {
      if (this.inventoryDetails.has(identifier)) {
        console.log('Inventory object already exists for identifier:', identifier);
        continue;
      }

      const stringCoords = identifier.split(':')[1]?.split('_');
      if (stringCoords.length !== 3) {
        continue;
      }

      const [x, y, z] = stringCoords.map(Number).map((n) => n + 0.0001);

      const objectId = CreateObjectNoOffset(objectModel, x, y, z + 2, false, false, false);
      PlaceObjectOnGroundProperly(objectId, true);
      SetEntityHeading(objectId, 0.0);
      FreezeEntityPosition(objectId, true);
      // SetPickupLight(objectId, true);
      DecorSetBool(objectId, 'isInventory', true);
      console.log('isInventory', typeof objectId, objectId, DecorGetBool(objectId, 'isInventory'));

      console.log('Placing inventory object', identifier, 'at coords:', x, y, z, 'with objectId:', objectId);

      this.inventoryDetails.set(identifier, { identifier, coords: { x, y, z }, objectId });
      this.objects.set(objectId, identifier);
    }
  }

  openWorldInventory(objectId: number) {
    const identifier = this.objects.get(objectId);
    if (!identifier) {
      console.log('No inventory found for objectId:', objectId);
      return;
    }

    console.log('Opening world inventory for identifier:', identifier);
    emitUI('inventory.state', { show: true, targetInventory: identifier });
    focusUI(true, true);
  }
}

const worldManager = WorldManager.getInstance();

export default worldManager;
