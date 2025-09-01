declare interface ClientExports {
  zones: Zones.ClientExports;
}

declare namespace Zones {
  interface PolyOptions {
    debug?: boolean;
    delayEnter?: number;
    delayExit?: number;
  }

  // Zone creation exports
  type AddPoly = (name: string, points: Vector2Format[], minZ: number, maxZ: number, options: PolyOptions) => void;
  type AddBox = (
    name: string,
    coords: Vector3Format,
    size: Vector3Format,
    rotation: number,
    options: PolyOptions,
  ) => void;
  type AddSphere = (name: string, coords: Vector3Format, radius: number, options: PolyOptions) => void;

  // Zone checking exports
  type IsCoordInZone = (zoneName: string, coords: Vector3Format) => boolean;
  type IsEntityInZone = (zoneName: string, entity: number) => boolean;
  type IsEntityInZones = (zoneNames: string[], entity: number) => string | null;
  type GetZonesAtCoord = (coords: Vector3Format) => string[];
  type GetZonesForEntity = (entity: number) => string[];

  // Zone data retrieval
  interface ZoneDataInfo {
    name: string;
    coords: Vector3Format;
    debug?: boolean;
    delayEnter?: number;
    delayExit?: number;
    maxZ?: number;
    minZ?: number;
    size?: Vector3Format;
    radius?: number;
    rotation?: number;
    points?: Vector2Format[];
  }
  type GetZoneData = (zoneName: string) => ZoneDataInfo | null;

  type ClientExports = {
    // Zone creation
    AddPoly: AddPoly;
    AddBox: AddBox;
    AddSphere: AddSphere;
    Remove: (name: string) => void;
    // Zone checking
    IsCoordInZone: IsCoordInZone;
    IsEntityInZone: IsEntityInZone;
    IsEntityInZones: IsEntityInZones;
    GetZonesAtCoord: GetZonesAtCoord;
    GetZonesForEntity: GetZonesForEntity;
    // Zone data
    GetZoneData: GetZoneData;
  };

  interface BaseData {
    name: string;
    options?: PolyOptions;
    onEnter?: () => void;
    onExit?: () => void;
  }

  interface SphereData extends BaseData {
    _type: 'sphere';
    coords: Vector3Format;
    radius: number;
  }

  interface BoxData extends BaseData {
    _type: 'box';
    coords: Vector3Format;
    size: Vector3Format;
    rotation: number;
  }

  interface PolyData extends BaseData {
    _type: 'poly';
    coords: Vector2Format[];
    minZ: number;
    maxZ: number;
  }

  type ZoneData = SphereData | BoxData | PolyData;
}
