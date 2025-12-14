import { PVGame, PVPrompt, PVTarget, PVWorld, addZone } from '@lib/client';
import { Log } from '@lib/client/comms/ui';
import { AnimFlag } from '@lib/flags';
import { Delay } from '@lib/functions';

let soundId: number;

let crackpotActive = false;
let crackpotSoundId = 0;
let crackpotSoundId2 = 0;

let engineOneActive = false; // 2511.316162, 2284.134521, 177.351471
let engineTwoActive = false; // 2512.821777, 2289.186035, 177.351471
let engineOneSoundId: number; // ELECTRIC_GENERATOR RRTL7_Sounds
let engineTwoSoundId: number; // ELECTRIC_GENERATOR RRTL7_Sounds

on('onResourceStop', (resourceName: string) => {
  if (resourceName === GetCurrentResourceName()) {
    StopSound(soundId);
    ReleaseSoundId(soundId);

    if (crackpotActive) {
      StopSound(crackpotSoundId);
      ReleaseSoundId(crackpotSoundId);
      PVWorld.stopFx('ptfx_crackpot');
    }

    if (engineOneActive) {
      StopSound(engineOneSoundId);
      ReleaseSoundId(engineOneSoundId);
    }

    if (engineTwoActive) {
      StopSound(engineTwoSoundId);
      ReleaseSoundId(engineTwoSoundId);
    }
  }
});

const flipTeslaLever = async () => {
  PVPrompt.hide('tesla_coil_lever');
  SetPedDesiredHeading(PlayerPedId(), 335.89);
  await Delay(1500);
  await PVGame.playAnimTask({
    dict: 'script_rc@ckpt@ig@ig4_switches',
    anim: `pull_middle_switch_${crackpotActive ? 'up' : 'down'}_arthur`,
    duration: crackpotActive ? 3500 : 2000,
  });

  if (crackpotActive) {
    // Stop crackpot fx and sound
    PVWorld.stopFx('ptfx_crackpot');
    StopSound(crackpotSoundId);
    ReleaseSoundId(crackpotSoundId);
  } else {
    // Start crackpot fx and sound
    await PVWorld.startFxAtCoords(
      'ptfx_crackpot',
      true,
      'scr_crackpot',
      'scr_crackpot_tesla_coil',
      { x: 2515.84, y: 2285.24, z: 179.46 },
      { x: 0, y: 0, z: 0 },
      1.0,
    );

    crackpotSoundId = GetSoundId();
    Log('crackpotSoundId', crackpotSoundId);
    PrepareSoundset('RCKPT2_Sounds', false);
    PlaySoundFromPositionWithId(crackpotSoundId, 'DEVICE', 2515.84, 2285.24, 179.46, 'RCKPT2_Sounds', false, 0, false);
  }

  crackpotActive = !crackpotActive;
  PVPrompt.show('tesla_coil_lever');
};

PVPrompt.register(flipTeslaLever, 'createHold', 'tesla_coil_lever', 0xcefd9220, 'Flip Lever');

addZone({
  _type: 'sphere',
  coords: { x: 2521.847168, y: 2284.270264, z: 177.351501 },
  radius: 0.75,
  name: 'tesla_coil_lever',
  onEnter: () => {
    if (!engineOneActive || !engineTwoActive) return;
    PVPrompt.enable('tesla_coil_lever');
    PVPrompt.show('tesla_coil_lever');
  },
  onExit: () => {
    PVPrompt.hide('tesla_coil_lever');
  },
});

// Engine 1 uses a lever instead of a valve
const turnEngineOneValue = async () => {
  const entity = GetClosestObjectOfType(
    2510.823242,
    2284.524902,
    177.351471,
    1.0,
    `P_DOV_LAB_GENERATOR01`,
    false,
    false,
    false,
  );
  if (!entity) {
    Log('No entity found for engine two lever');
    return;
  }

  Log(entity);
  PVPrompt.hide('engine_two_lever');
  SetPedDesiredHeading(PlayerPedId(), 157.81008911133);
  await Delay(1500);
  await PVGame.playAnimTask({
    dict: 'script_rc@ckpt@ig@ig4_switches',
    anim: `pull_middle_switch_${engineOneActive ? 'up' : 'down'}_arthur`,
    duration: engineOneActive ? 3500 : 2000,
  });

  if (engineOneActive) {
    StopSound(engineOneSoundId);
    PVGame.taskPlayEntityAnim([
      {
        obj: entity,
        loop: false,
        delta: 0.75,
        dict: 'script_rc@ckpt@ig@temp',
        anim: 'p_dov_lab_generator01',
      },
    ]);
  } else {
    engineOneSoundId = GetSoundId();
    PrepareSoundset('RRTL7_Sounds', false);
    PlaySoundFromPositionWithId(
      engineOneSoundId,
      'ELECTRIC_GENERATOR',
      2510.823242,
      2284.524902,
      177.351471,
      'RRTL7_Sounds',
      false,
      10,
      false,
    );
    Citizen.invokeNative('0x531A78D6BF27014B', 'RRTL7_Sounds');
    PVGame.taskPlayEntityAnim([
      {
        obj: entity,
        loop: true,
        dict: 'script_rc@ckpt@ig@temp',
        anim: 'p_dov_lab_generator01',
      },
    ]);
  }

  engineOneActive = !engineOneActive;
  PVPrompt.show('engine_two_lever');
};

PVPrompt.register(turnEngineOneValue, 'createHold', 'engine_two_lever', 0xcefd9220, 'Pull Lever');

const turnEngineTwoValue = async () => {
  const entity = GetClosestObjectOfType(
    2513.862549,
    2289.636719,
    177.863708,
    1.0,
    `P_DOV_LAB_GENERATOR02`,
    false,
    false,
    false,
  );
  if (!entity) {
    Log('No entity found for engine one valve');
    return;
  }

  Log(entity);

  PVPrompt.hide('engine_one_valve');
  const dict = `amb_work@world_human_valve@med@male_${engineTwoActive ? 'a' : 'b'}@wip_base`;
  SetPedDesiredHeading(PlayerPedId(), 357.71298217773);
  await Delay(1500);
  await PVGame.playAnimTask({
    dict,
    anim: 'wip_base',
  });

  if (engineTwoActive) {
    StopSound(engineTwoSoundId);
    PVGame.taskPlayEntityAnim([
      {
        obj: entity,
        loop: false,
        delta: 0.75,
        dict: 'script_rc@ckpt@ig@temp',
        anim: 'p_dov_lab_generator02',
      },
    ]);
  } else {
    engineTwoSoundId = GetSoundId();
    PrepareSoundset('RRTL7_Sounds', false);
    PlaySoundFromPositionWithId(
      engineTwoSoundId,
      'ELECTRIC_GENERATOR',
      2513.862549,
      2289.636719,
      177.863708,
      'RRTL7_Sounds',
      true,
      0,
      false,
    );
    Citizen.invokeNative('0x531A78D6BF27014B', 'RRTL7_Sounds');
    PVGame.taskPlayEntityAnim([
      {
        obj: entity,
        loop: true,
        dict: 'script_rc@ckpt@ig@temp',
        anim: 'p_dov_lab_generator02',
      },
    ]);
  }

  engineTwoActive = !engineTwoActive;
  PVPrompt.show('engine_one_valve');
};

PVPrompt.register(turnEngineTwoValue, 'createHold', 'engine_one_valve', 0xcefd9220, 'Turn Valve');

addZone({
  _type: 'sphere',
  coords: { x: 2512.821777, y: 2289.186035, z: 177.351471 },
  radius: 0.75,
  name: 'engine_1_valve',
  onEnter: () => {
    PVPrompt.enable('engine_one_valve');
    PVPrompt.show('engine_one_valve');
  },
  onExit: () => {
    PVPrompt.hide('engine_one_valve');
  },
});

addZone({
  _type: 'sphere',
  coords: { x: 2511.316162, y: 2284.134521, z: 177.351471 },
  radius: 0.75,
  name: 'engine_2_lever',
  onEnter: () => {
    PVPrompt.enable('engine_two_lever');
    PVPrompt.show('engine_two_lever');
  },
  onExit: () => {
    PVPrompt.hide('engine_two_lever');
  },
});

RegisterCommand(
  'meteor_shower',
  async (source: number, args: any[], rawCommand: string) => {
    // Log({ source, args, rawCommand });

    await PVWorld.startFxAtCoords(
      'meteor_shower',
      true,
      'scr_discoverables',
      'scr_disc_meteor_shower',
      { x: 2895.893, y: 1650.213, z: 1000.863 },
      { x: 0, y: 0, z: 0 },
      2.0,
    );

    await Delay(60e3);

    PVWorld.stopFx('meteor_shower');
  },
  false,
);

RegisterCommand(
  'crackpot',
  async (source: number, args: any[], rawCommand: string) => {
    // Log({ source, args, rawCommand });
    await PVWorld.startFxAtCoords(
      'ptfx_test',
      true,
      'scr_crackpot',
      'scr_crackpot_tesla_coil',
      { x: 2515.84, y: 2285.24, z: 179.46 },
      { x: 0, y: 0, z: 0 },
      1.0,
    );

    soundId = GetSoundId();
    // Log({ source, args, rawCommand });
    PrepareSoundset('RCKPT2_Sounds', false);
    // PlaySoundFromEntity('DEVICE', playerPed, 'RCKPT2_Sounds', true, 0, 0);
    PlaySoundFromPositionWithId(soundId, 'DEVICE', 2515.84, 2285.24, 179.46, 'RCKPT2_Sounds', false, 0, false);

    await Delay(5000);

    StopSound(soundId);
    ReleaseSoundId(soundId);

    PVWorld.stopFx('ptfx_test');
  },
  false,
);

const locs = [
  { x: 2521.12, y: 2302.99, z: 193.24 },
  { x: 2389.52, y: 2291.71, z: 242.51 },
  { x: 2381.77, y: 2397.26, z: 251.36 },
  { x: 2394.05, y: 2302.79, z: 243.02 },
  { x: 2372.04, y: 2382.25, z: 262.96 },
  { x: 2341.92, y: 2341.52, z: 263.26 },
  { x: 2412.97, y: 2344.84, z: 240.92 },
  { x: 2521.55, y: 2301.41, z: 197.35 },
  { x: 2518.76, y: 2298.03, z: 195.23 },
  { x: 2517.07, y: 2302.53, z: 195.3 },
  { x: 2520.89, y: 2301.48, z: 197.35 },
  { x: 2520.89, y: 2301.48, z: 197.35 },
];

RegisterCommand(
  'ptfx_test',
  async () => {
    PVWorld.stopFx('ptfx_test');

    const coords = PVGame.playerCoords(true);
    // coords.x -= 1;

    await PVWorld.startFxAtCoords(
      'ptfx_test',
      false,
      'scr_crackpot',
      'scr_crackpot_rc_lightening',
      // coords,
      { x: 2520.91, y: 2301.47, z: 196.82 },
      { x: 0, y: 0, z: 0 },
      1.0,
    );
    await Delay(250);

    // for (const loc of locs) {
    //   Log('Spawning at', loc);
    //   await PVWorld.startFxAtCoords(
    //     'ptfx_test',
    //     false,
    //     'scr_crackpot',
    //     'scr_crackpot_rc_lightening',
    //     // coords,
    //     loc,
    //     { x: 0, y: 0, z: 0 },
    //     1.0,
    //   );
    //
    //   await Delay(250);
    //   PVWorld.stopFx('ptfx_test');
    //   await Delay(250);
    // }

    // PVWorld.setFxEvolution('ptfx_test', 'scrub', 1.0);
    // PVWorld.setFxEvolution('ptfx_test', 'density', 1.0);
    // PVWorld.setFxEvolution('ptfx_test', 'strength', 1.0);
    // PVWorld.setFxEvolution('ptfx_test', 'intensity', 1.0);

    await Delay(60_000);

    PVWorld.stopFx('ptfx_test');
  },
  false,
);

RegisterCommand(
  'ptfx_test_stop',
  async (source: number, args: any[], rawCommand: string) => {
    // Log({ source, args, rawCommand });

    PVWorld.stopFx('ptfx_test');
  },
  false,
);

RegisterCommand(
  'sound_test',
  async (source: number, args: any[], rawCommand: string) => {
    soundId = GetSoundId();
    // Log({ source, args, rawCommand });
    PrepareSoundset('RCKPT2_Sounds', false);
    // PlaySoundFromEntity('DEVICE', playerPed, 'RCKPT2_Sounds', true, 0, 0);
    const coords = PVGame.playerCoords(true);
    PlaySoundFromPositionWithId(soundId, 'DEVICE', coords.x, coords.y, coords.z, 'RCKPT2_Sounds', false, 0, false);

    await Delay(5000);

    StopSound(soundId);
    ReleaseSoundId(soundId);
  },
  false,
);
