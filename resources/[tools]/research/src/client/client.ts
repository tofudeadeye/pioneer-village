import { PVGame, onUI } from '@lib/client';
import { Log } from '@lib/client/comms/ui';

import './commands';
import './natives';
import './stuff/animal';
import './stuff/apple';
import './stuff/geyser';
import './stuff/gold-panning';
import './stuff/hats';
import './stuff/horses';
import './stuff/instruments';
import './stuff/police';
import './stuff/ptfx';
// import './stuff/side-saddle';
import './targets';

onUI('animations.play-anim', (data) => {
  let isPed = true;
  if (data.entity !== 0) {
    isPed = IsEntityAPed(data.entity);
  }
  if (isPed) {
    if (data.dict.startsWith('0x')) {
      const number = Number(data.dict);
      if (!isNaN(number)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        data.dict = number;
      }
    }

    PVGame.taskPlayAnimArrayNew({
      dict: data.dict,
      anim: data.clip,
      flags: data.flags,
      blendInSpeed: data.blendInSpeed,
      blendOutSpeed: data.blendOutSpeed,
      entity: data.entity !== 0 ? data.entity : undefined,
    });
  } else {
    PVGame.taskPlayEntityAnim([
      {
        dict: data.dict,
        anim: data.clip,
        flags: data.flags,
        blendInSpeed: data.blendInSpeed,
        blendOutSpeed: data.blendOutSpeed,
        obj: data.entity,
      },
    ]);
  }
});

onUI('animations.stop-anim', (data) => {
  ClearPedTasks(data.entity || PVGame.playerPed(), false, false);
});

// @ts-ignore
global.Log = Log;

RegisterCommand(
  'jcrun',
  async (source: number, args: string[]) => {
    const rtns = eval(args.join(' '));
    if (!rtns) {
      Log('No return value from command');
      return;
    }
    Log(rtns);
  },
  false,
);
