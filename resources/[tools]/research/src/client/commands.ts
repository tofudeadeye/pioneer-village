import { PVGame, emitUI, focusUI } from '@lib/client';
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
  () => {
    const playerPed = PVGame.playerPed();
    if (IsEntityInWater(playerPed) && !IsPedSwimming(playerPed)) {
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
        },
        {
          dict: 'amb_misc@world_human_wash_kneel_river@male_b@idle_c',
          anim: 'idle_g',
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

    const transitionTime = lerp(1_000, 60_000, Math.abs(currentHour - 12) / 12);

    console.log(currentHour, transitionTime);

    NetworkClockTimeOverride(12, 0, 0, transitionTime, args[0] === 'true' || args[0] === '1');
  },
  false,
);
