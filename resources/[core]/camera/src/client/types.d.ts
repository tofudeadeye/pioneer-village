declare interface ClientExports {
  camera: Camera.ClientExports;
}

declare namespace Camera {
  interface Data {
    id: string;
    _type?: number | 'DEFAULT_SCRIPTED_CAMERA' | 'DEFAULT_SPLINE_CAMERA';
    coords: Vector3Format;
    rot: Vector3Format;
    fov: number;
  }

  type create = (data: Data) => void;
  type setCoord = (id: string, coords: Vector3Format) => void;
  type setRot = (id: string, rot: Vector3Format) => void;
  type pointAtCoord = (id: string, coords: Vector3Format) => void;
  type pointAtEntity = (id: string, entity: number, offset?: Vector3Format) => void;
  type destroy = (id: string) => void;
  type setActive = (id: string, easeTime?: number) => void;
  type setInactive = (id: string, easeTime?: number) => void;
  type interpolate = (id: string, duration: number, easeLocation?: boolean, easeRotation?: boolean) => Promise<void>;
  type attachCamToEntity = (id: string, entity: number, offset: Vector3Format, isRelative?: boolean) => void;
  type attachCamToPedBone = (
    id: string,
    ped: number,
    boneIndex: number,
    offset: Vector3Format,
    heading?: boolean,
  ) => void;
  type detachCam = (id: string) => void;

  // Light Management Types
  interface LightData {
    id: string;
    x?: number;
    y?: number;
    z?: number;
    posX?: number;
    posY?: number;
    posZ?: number;
    r?: number;
    g?: number;
    b?: number;
    colorR?: number;
    colorG?: number;
    colorB?: number;
    range?: number;
    intensity?: number;
  }

  interface LightInfo {
    id: string;
    posX: number;
    posY: number;
    posZ: number;
    colorR: number;
    colorG: number;
    colorB: number;
    range: number;
    intensity: number;
    active: boolean;
  }

  type lightCreate = (data: LightData) => boolean;
  type lightUpdate = (id: string, data: Partial<LightData>) => boolean;
  type lightSetPosition = (id: string, x: number, y: number, z: number) => boolean;
  type lightSetColor = (id: string, r: number, g: number, b: number) => boolean;
  type lightSetRange = (id: string, range: number) => boolean;
  type lightSetIntensity = (id: string, intensity: number) => boolean;
  type lightTurnOn = (id: string) => boolean;
  type lightTurnOff = (id: string) => boolean;
  type lightToggle = (id: string) => boolean;
  type lightExists = (id: string) => boolean;
  type lightIsActive = (id: string) => boolean;
  type lightGet = (id: string) => LightInfo | undefined;
  type lightGetAll = () => Record<string, LightInfo>;
  type lightGetActive = () => Record<string, LightInfo>;
  type lightDestroy = (id: string) => boolean;
  type lightCreateAndTurnOn = (data: LightData) => boolean;
  type lightCreateOrUpdate = (data: LightData) => boolean;
  type lightDestroyAll = () => boolean;

  type ClientExports = {
    create: create;
    setCoord: setCoord;
    setRot: setRot;
    pointAtCoord: pointAtCoord;
    pointAtEntity: pointAtEntity;
    destroy: destroy;
    setActive: setActive;
    setInactive: setInactive;
    interpolate: interpolate;
    attachCamToEntity: attachCamToEntity;
    attachCamToPedBone: attachCamToPedBone;
    detachCam: detachCam;

    // Light exports
    lightCreate: lightCreate;
    lightUpdate: lightUpdate;
    lightSetPosition: lightSetPosition;
    lightSetColor: lightSetColor;
    lightSetRange: lightSetRange;
    lightSetIntensity: lightSetIntensity;
    lightTurnOn: lightTurnOn;
    lightTurnOff: lightTurnOff;
    lightToggle: lightToggle;
    lightExists: lightExists;
    lightIsActive: lightIsActive;
    lightGet: lightGet;
    lightGetAll: lightGetAll;
    lightGetActive: lightGetActive;
    lightDestroy: lightDestroy;
    lightCreateAndTurnOn: lightCreateAndTurnOn;
    lightCreateOrUpdate: lightCreateOrUpdate;
    lightDestroyAll: lightDestroyAll;
  };
}
