import { PVBase, PVGame, PVWorld, emitUI, focusUI } from '@lib/client';
import { Log } from '@lib/client/comms/ui';
import { AnimFlag } from '@lib/flags';
import { lerp } from '@lib/math';

RegisterCommand(
  'compare_config_flag',
  async (source: number, args: any[], rawCommand: string) => {
    // Log({ source, args, rawCommand });

    const pedOne = Number(args[0]);
    const pedTwo = Number(args[1]);

    for (let i = 1000; i--; ) {
      const flagOne = GetPedConfigFlag(pedOne, i, true);
      const flagTwo = GetPedConfigFlag(pedTwo, i, true);

      if (flagOne !== flagTwo) {
        Log(`Flag ${i} differs: PedOne=${flagOne}, PedTwo=${flagTwo}`);
      }
    }
  },
  false,
);

RegisterCommand(
  'anim_menu',
  () => {
    emitUI('animations.state', { show: true });
    focusUI(true, true);
  },
  false,
);

RegisterCommand(
  'washhands',
  async () => {
    const soapObject = 'P_SOAP01X';
    const playerPed = PVGame.playerPed();
    if (!IsEntityInWater(playerPed) && !IsPedSwimming(playerPed)) {
      const coords = PVGame.playerCoords();
      coords.z -= 5;
      const soap = await PVGame.createObject(soapObject, coords, { x: 0, y: 0, z: 0 }, true);
      PVGame.attachEntityToBoneName(
        soap,
        'SKEL_R_HAND',
        playerPed,
        { x: 0.075, y: 0, z: -0.035 },
        { x: 0, y: 0, z: 90 },
      );
      PVGame.taskPlayAnimArrayNew([
        {
          dict: 'amb_misc@world_human_wash_kneel_river@female_a@stand_enter',
          anim: 'enter_back',
          flags: AnimFlag.STOP_LAST_FRAME,
        },
        {
          dict: 'amb_misc@world_human_wash_kneel_river@male_b@idle_b',
          anim: 'idle_e',
          flags: AnimFlag.STOP_LAST_FRAME,
          async onStart() {
            await PVWorld.startFxOnEntityBoneByName(
              'bathing_foam_l_hand',
              true,
              'scr_mg_bathing',
              'scr_mg_bathing_foam_torso',
              PVGame.playerPed(),
              'SKEL_L_HAND',
              { x: 0, y: 0, z: 0 },
              { x: 0, y: 0, z: 0 },
              0.5,
            );
            PVWorld.setFxEvolution('bathing_foam_l_hand', 'scrub', 0.75);
            await PVWorld.startFxOnEntityBoneByName(
              'bathing_foam_r_hand',
              true,
              'scr_mg_bathing',
              'scr_mg_bathing_foam_torso',
              PVGame.playerPed(),
              'SKEL_R_HAND',
              { x: 0, y: 0, z: 0 },
              { x: 0, y: 0, z: 0 },
              0.5,
            );
            PVWorld.setFxEvolution('bathing_foam_r_hand', 'scrub', 0.75);
          },
        },
        {
          dict: 'amb_misc@world_human_wash_kneel_river@male_b@idle_c',
          anim: 'idle_g',
          onEnd() {
            PVWorld.stopFx('bathing_foam_l_hand');
            PVWorld.stopFx('bathing_foam_r_hand');
            PVBase.deleteEntity(soap);
          },
        },
      ]);
    }
  },
  false,
);

RegisterCommand(
  'daytime',
  (source: number, args: string[]) => {
    const currentHour = GetClockHours();

    const transitionTime = Math.round(lerp(1_000, 10_000, Math.abs(currentHour - 12) / 12));

    console.log(currentHour, transitionTime);

    NetworkClockTimeOverride(12, 0, 0, transitionTime, args[0] === 'true' || args[0] === '1');
  },
  false,
);

RegisterCommand(
  'nighttime',
  async (source: number, args: any[], rawCommand: string) => {
    const currentHour = GetClockHours();

    const transitionTime = Math.round(lerp(1_000, 5_000, currentHour / 12));
    console.log(currentHour, transitionTime);

    NetworkClockTimeOverride(0, 0, 0, transitionTime, args[0] === 'true' || args[0] === '1');
  },
  false,
);
