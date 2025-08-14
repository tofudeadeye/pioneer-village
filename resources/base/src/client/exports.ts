import { exports } from '@lib/client';
import { Delay } from '@lib/functions';
import { Log, onUI } from '@lib/client/comms/ui';

// Character data management
let character: CharacterData | null = null;

onUI('character-client-update.getCharacter', (pCharacter) => {
  character = JSON.parse(pCharacter) as CharacterData;
  // Log('character-client-update.getCharacter', character);
});

onUI('character-client-update.updateAttribute', (attribute, newVal) => {
  if (!character) return;
  (character[attribute] as any) = newVal;

  // Log(
  //   'character-client-update.updateAttribute',
  //   attribute,
  //   typeof newVal === 'object' ? JSON.stringify(newVal, null, 2) : newVal,
  // );
});

const getCurrentCharacter = (): CharacterData | null => {
  return character;
};

// Entity management functions
const getNetworkControlOfEntity: Base.getNetworkControlOfEntity = async (entity) => {
  do {
    NetworkRequestControlOfEntity(entity);
    await Delay(5);
  } while (!NetworkHasControlOfEntity(entity));
};

const deleteEntity: Base.deleteEntity = async (entity: number): Promise<void> => {
  if (!DoesEntityExist(entity)) {
    Log(`Entity doesn't exist ${entity}`);
    return;
  }
  if (NetworkGetEntityIsNetworked(entity)) {
    Log(`Requesting control ${entity}`);
    await getNetworkControlOfEntity(entity);
  }

  const attachedEntity = GetEntityAttachedTo(entity);
  if (attachedEntity) {
    DetachEntity(entity, true, false);
  }

  await Delay(5);
  SetEntityAsMissionEntity(entity, true, true);

  // await Delay(5);
  // if (IsEntityAPed(entity)) {
  //   Log(`DeletePed(${entity})`);
  //   DeletePed(entity);
  // }
  //
  // await Delay(5);
  // if (IsEntityAnObject(entity)) {
  //   Log(`DeleteObject(${entity})`);
  //   DeleteObject(entity);
  // }
  //
  // if (!DoesEntityExist(entity)) {
  //   Log(`Entity doesn't exist ${entity}`);
  //   return;
  // }

  await Delay(5);
  Log(`DeleteEntity(${entity})`);
  DeleteEntity(entity);

  await Delay(10);
  if (DoesEntityExist(entity)) {
    Log(`Entity Still exists: ${entity}`);
    SetEntityAsMissionEntity(entity, false, false);

    await Delay(5);
    SetEntityCoords(entity, -10000.0, -10000.0, 0.0, false, false, false, false);
  }
};

const deleteEntities: Base.deleteEntities = (entities: number[]): void => {
  for (const entity of entities) {
    deleteEntity(entity);
  }
};

// Register all exports
exports<'base'>('getCurrentCharacter', getCurrentCharacter);
exports<'base'>('getNetworkControlOfEntity', getNetworkControlOfEntity);
exports<'base'>('deleteEntity', deleteEntity);
exports<'base'>('deleteEntities', deleteEntities);