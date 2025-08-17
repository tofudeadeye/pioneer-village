import { PVGame, emitUI, focusUI, onUI } from '@lib/client';
import { Log } from '@lib/client/comms/ui';
import { AnimFlag } from '@lib/flags';
import { Delay } from '@lib/functions';

import healthManager from '../managers/health-manager';

RegisterCommand(
  'melee',
  async () => {
    const coord = PVGame.playerCoords();
    const meleePed = await PVGame.createPed('A_M_M_ARMTOWNFOLK_01', coord.x, coord.y, coord.z, 0, true, true);

    TaskCombatPed(meleePed, PVGame.playerPed(), 0, 0);
  },
  false,
);

RegisterCommand(
  'heal',
  async () => {
    healthManager.resetHealth();
  },
  false,
);

RegisterCommand(
  'eatDrink',
  async () => {
    healthManager.food = 100;
    healthManager.water = 100;
  },
  false,
);

RegisterCommand(
  'damageBone',
  async (source: number, args: any[], rawCommand: string) => {
    healthManager.damageBoneByName(args[0], args[1]);
  },
  false,
);

RegisterCommand(
  'shootBone',
  async (source: number, args: any[], rawCommand: string) => {
    healthManager.damageBoneByName(args[0], 5);
    for (let n = Number(args[1] ?? 1); n--; ) {
      healthManager.shootBoneByName(args[0]);
    }
  },
  false,
);

RegisterCommand(
  'bloodLoss',
  async (source: number, args: any[], rawCommand: string) => {
    healthManager.litersOfBlood -= Number(args[0]);
  },
  false,
);

RegisterCommand(
  'bed',
  async (source: number, args: any[], rawCommand: string) => {
    const playerPed = PlayerPedId();
    // const playerPed = 643074;

    FreezeEntityPosition(playerPed, true);
    SetEntityCollision(playerPed, false, false);
    SetEntityCoords(playerPed, -286.2163391113281, 816.0573120117188, 119.1258642578125, false, false, false, false);
    SetEntityHeading(playerPed, 98.1);

    PVGame.taskPlayAnim({
      entity: playerPed,
      dict: 'amb_rest@prop_human_sleep_bed@pillow@male_b@idle_a',
      anim: 'idle_a',
      flags: AnimFlag.STOP_LAST_FRAME,
      blendInSpeed: 8,
      blendOutSpeed: -8,
    });

    await Delay(150);
    SetEntityCollision(playerPed, true, true);
    // FreezeEntityPosition(playerPed, false);

    TaskKnockedOut(playerPed, 30.0, true);
  },
  false,
);

const bones = [
  'SKEL_HEAD',
  'SKEL_L_CALF',
  'SKEL_L_CLAVICLE',
  'SKEL_L_FOOT',
  'SKEL_L_FOREARM',
  'SKEL_L_HAND',
  'SKEL_L_THIGH',
  'SKEL_L_UPPERARM',
  'SKEL_NECK1',
  'SKEL_PENIS00',
  'SKEL_R_CALF',
  'SKEL_R_CLAVICLE',
  'SKEL_R_FOOT',
  'SKEL_R_FOREARM',
  'SKEL_R_HAND',
  'SKEL_R_THIGH',
  'SKEL_R_UPPERARM',
  'SKEL_SPINE4',
];

const offsetBoneCoords = (bone: UI.Doctor.BoneStatus, boneTwo: UI.Doctor.BoneStatus, distance = 0.333) => {
  if (!bone || !boneTwo) {
    return;
  }
  bone.coords.x = bone.coords.x + (boneTwo.coords.x - bone.coords.x) * distance;
  bone.coords.y = bone.coords.y + (boneTwo.coords.y - bone.coords.y) * distance;
};

const offsetBoneCoordsEnd = (
  bone: UI.Doctor.BoneStatus,
  boneTwo: UI.Doctor.BoneStatus,
  boneThree: UI.Doctor.BoneStatus,
  distance = 0.333,
) => {
  if (!bone || !boneTwo || !boneThree) {
    return;
  }
  bone.coords.x = bone.coords.x + (boneTwo.coords.x - boneThree.coords.x) * distance;
  bone.coords.y = bone.coords.y + (boneTwo.coords.y - boneThree.coords.y) * distance;
};

const getUIBones = (ped = PlayerPedId()): [number, UI.Doctor.BoneStatus[]] => {
  const uiBonesBase: Record<string, UI.Doctor.BoneStatus> = {};
  const uiBones: UI.Doctor.BoneStatus[] = [];

  // Log('ped', ped);
  // Log('bones', bones);
  // Log('healthManager.boneStatus', [...healthManager.boneStatus.entries()]);

  for (const boneName of bones) {
    const bone = healthManager.boneNames[boneName];
    if (!bone) {
      // Log('bone not found', boneName);
      continue;
    }
    const coords = GetPedBoneCoords(ped, bone.id, 0.0, 0.0, 0.0);
    const screenCoords = GetScreenCoordFromWorldCoord(coords[0], coords[1], coords[2]);

    if (screenCoords[0]) {
      const boneStatus = healthManager.boneStatus.get(bone.id);
      // Log('boneStatus', boneStatus);
      if (!boneStatus) {
        // Log('boneStatus missing?', boneStatus);
        continue;
      }
      // Log('boneStatus', boneStatus);
      uiBonesBase[boneName] = {
        coords: { x: screenCoords[1] * 100, y: screenCoords[2] * 100 },
        name: boneName,
        health: healthManager.boneHealth.get(bone.id) ?? 100,
        broken: boneStatus.broken,
        wound: boneStatus.slash,
        burned: boneStatus.burned,
        infection: boneStatus.infection,
      };
    }
  }

  for (const boneName of bones) {
    const bone = uiBonesBase[boneName];
    if (!bone) {
      continue;
    }

    switch (boneName) {
      case 'SKEL_HEAD':
        offsetBoneCoordsEnd(bone, uiBonesBase['SKEL_NECK1'], uiBonesBase['SKEL_SPINE4'], 0.4);
        break;
      case 'SKEL_SPINE4':
        offsetBoneCoordsEnd(bone, uiBonesBase['SKEL_NECK1'], uiBonesBase['SKEL_HEAD'], 0.4);
        break;
      case 'SKEL_L_CLAVICLE':
        offsetBoneCoords(bone, uiBonesBase['SKEL_L_UPPERARM'], 0.5);
        break;
      case 'SKEL_R_CLAVICLE':
        offsetBoneCoords(bone, uiBonesBase['SKEL_R_UPPERARM'], 0.5);
        break;
      case 'SKEL_L_UPPERARM':
        offsetBoneCoords(bone, uiBonesBase['SKEL_L_FOREARM'], 0.25);
        break;
      case 'SKEL_R_UPPERARM':
        offsetBoneCoords(bone, uiBonesBase['SKEL_R_FOREARM'], 0.25);
        break;
      case 'SKEL_L_FOREARM':
        offsetBoneCoords(bone, uiBonesBase['SKEL_L_HAND']);
        break;
      case 'SKEL_R_FOREARM':
        offsetBoneCoords(bone, uiBonesBase['SKEL_R_HAND']);
        break;
      case 'SKEL_L_HAND':
        offsetBoneCoordsEnd(bone, uiBonesBase['SKEL_L_FOREARM'], uiBonesBase['SKEL_L_UPPERARM'], 0.2);
        break;
      case 'SKEL_R_HAND':
        offsetBoneCoordsEnd(bone, uiBonesBase['SKEL_R_FOREARM'], uiBonesBase['SKEL_R_UPPERARM'], 0.2);
        break;
      case 'SKEL_L_THIGH':
        offsetBoneCoords(bone, uiBonesBase['SKEL_L_CALF'], 0.4);
        break;
      case 'SKEL_R_THIGH':
        offsetBoneCoords(bone, uiBonesBase['SKEL_R_CALF'], 0.4);
        break;
      case 'SKEL_L_CALF':
        offsetBoneCoords(bone, uiBonesBase['SKEL_L_FOOT']);
        break;
      case 'SKEL_R_CALF':
        offsetBoneCoords(bone, uiBonesBase['SKEL_R_FOOT']);
        break;
      case 'SKEL_L_FOOT':
        offsetBoneCoordsEnd(bone, uiBonesBase['SKEL_L_CALF'], uiBonesBase['SKEL_L_THIGH'], 0.2);
        break;
      case 'SKEL_R_FOOT':
        offsetBoneCoordsEnd(bone, uiBonesBase['SKEL_R_CALF'], uiBonesBase['SKEL_R_THIGH'], 0.2);
        break;
    }

    uiBones.push(bone);
  }

  return [ped, uiBones];
};

RegisterCommand(
  'inspect',
  async (source: number, args: any[], rawCommand: string) => {
    // const playerPed = 643074;

    const [entity, uiBones] = getUIBones();

    if (args[0] === '1' || args[0] === 'true') {
      const update = setInterval(() => {
        Log('Update');
        const [entity, uiBones] = getUIBones();
        emitUI('doctor.state', { entity: entity, boneStatus: uiBones });
      }, 1000);

      onUI('nui.close', () => {
        clearInterval(update);
      });
    }

    // Log({ show: true, entity, boneStatus: uiBones });

    emitUI('doctor.state', { show: true, entity, boneStatus: uiBones });
    focusUI(true, true);
  },
  false,
);

RegisterCommand(
  'chair_doctor',
  async (source: number, args: any[], rawCommand: string) => {
    // const playerPed = PlayerPedId();
    const playerPed = 643074;
    const x = 2732.02978515625;
    const y = -1230.1536865234375;
    const z = 49.3677978515625;

    SetEntityCoords(playerPed, x, y, z, false, false, false, false);
    SetEntityHeading(playerPed, 95.116);

    PVGame.taskPlayAnim({
      entity: playerPed,
      dict: 'script_re@murder_for_hire@doctor_office',
      anim: ['passout_fail_loop_vic', 'passout_success_loop_vic'],
      flags: AnimFlag.REPEAT,
      blendInSpeed: 1,
      blendOutSpeed: -1,
    });
  },
  false,
);
