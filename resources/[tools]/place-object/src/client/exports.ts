import { exports } from '@lib/client';
import PlacementManager from './managers/placement-manager';

const placementManager = PlacementManager.getInstance();

const placeObject: PlaceObject.placeObject = async (model, amount = 1, groundOnly = true) => {
  return await placementManager.queuePlaceObject(GetHashKey(model), amount, groundOnly);
};

const placeObjectAdvanced: PlaceObject.placeObjectAdvanced = async (
  { model, amount = 1, uprightLimit = 1.0, subItems = [] }: PlaceObject.Advanced,
  groundOnly = true,
  cb = undefined,
) => {
  const objects = await placementManager.queuePlaceObjectAdv(
    GetHashKey(model),
    amount,
    uprightLimit,
    subItems,
    groundOnly,
  );
  return objects;
};

const placeObjects: PlaceObject.placeObjects = async (objects, cb = undefined) => {
  const allObjects = [];
  for (const obj of objects) {
    allObjects.push(...(await placementManager.queuePlaceObject(obj.model, obj.amount, obj.groundOnly)));
  }
  return allObjects;
};

exports<'place-object'>('placeObject', placeObject);
exports<'place-object'>('placeObjectAdvanced', placeObjectAdvanced);
exports<'place-object'>('placeObjects', placeObjects);