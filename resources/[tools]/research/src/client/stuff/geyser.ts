import { PVGame, PVWorld, addZone } from '@lib/client';
import { Log } from '@lib/client/comms/ui';
import { Delay } from '@lib/functions';
import { Vector3 } from '@lib/math';

const geyserEject = async (coords: Vector3Format, force: number) => {
  const playerPed = PlayerPedId();
  const playerCoords = Vector3.fromArray(GetEntityCoords(playerPed, true));

  await PVWorld.startPtfxAtCoords('geyser', true, 'scr_discoverables', 'ent_amb_steam_geyser', coords);
  PVWorld.setFxEvolutions('geyser', {
    steam: 0.5,
    erupt: 1.0,
  });

  let forceVector = playerCoords.sub({ x: coords.x, y: coords.y, z: playerCoords.z - 3.0 });
  forceVector = forceVector.magnitude() !== 0 ? forceVector.normalize() : new Vector3(0, 0, 0);
  forceVector = forceVector.multiplyScalar(force);

  SetPedToRagdoll(playerPed, 3000, 5000, 0, false, false, false);
  await Delay(1);
  ApplyForceToEntity(
    playerPed,
    1,
    forceVector.x,
    forceVector.y,
    forceVector.z,
    0.0,
    0.0,
    0.0,
    0,
    false,
    false,
    true,
    false,
    true,
  );

  await Delay(2_000);
  PVWorld.setFxEvolutions('geyser', {
    erupt: 0.0,
    steam: 1.0,
  });

  await Delay(5_000);
  PVWorld.setFxEvolution('geyser', 'steam', 0.75);

  await Delay(5_000);
  PVWorld.setFxEvolution('geyser', 'steam', 0.5);

  await Delay(5_000);
  PVWorld.setFxEvolution('geyser', 'steam', 0.25);

  await Delay(5_000);
  PVWorld.stopFx('geyser');
};

addZone({
  _type: 'sphere',
  coords: { x: 224.4436, y: 1906.525, z: 206.9073 },
  radius: 1.25,
  name: 'geyser_zone_1',
  onEnter: () => {
    Log('Entered geyser zone 1');
    geyserEject({ x: 224.4436, y: 1906.525, z: 206.0843 }, 32);
  },
  onExit: () => {
    Log('Exited geyser zone 1');
  },
});

addZone({
  _type: 'sphere',
  coords: { x: 191.666, y: 1831.29, z: 202.4614 },
  radius: 1.25,
  name: 'geyser_zone_2',
  onEnter: () => {
    Log('Entered geyser zone 2');
    geyserEject({ x: 191.666, y: 1831.29, z: 200.4614 }, 28);
  },
  onExit: () => {
    Log('Exited geyser zone 2');
  },
});

addZone({
  _type: 'sphere',
  coords: { x: 129.107, y: 1878.372, z: 201.1505 },
  radius: 1.25,
  name: 'geyser_zone_3',
  onEnter: () => {
    Log('Entered geyser zone 3');
    geyserEject({ x: 129.107, y: 1878.372, z: 200.1505 }, 24);
  },
  onExit: () => {
    Log('Exited geyser zone 3');
  },
});

RegisterCommand(
  'meteor_shower',
  async (source: number, args: any[], rawCommand: string) => {
    // Log({ source, args, rawCommand });

    await PVWorld.startPtfxAtCoords(
      'meteor_shower',
      true,
      'scr_discoverables',
      'scr_disc_meteor_shower',
      { x: 2895.893, y: 1650.213, z: 1000.863 },
      { x: 0, y: 0, z: 0 },
      2.0,
    );

    await Delay(60);

    PVWorld.stopFx('meteor_shower');
  },
  false,
);

RegisterCommand(
  'fog_test',
  async () => {
    PVWorld.stopFx('fog_test');

    const coords = PVGame.playerCoords(true);
    // coords.x -= 1;

    await PVWorld.startPtfxAtCoords(
      'fog_test',
      true,
      'core',
      'ped_horse_mouth_froth',
      coords,
      { x: 0, y: 0, z: 0 },
      1.0,
    );
    // PVWorld.setFxEvolution('fog_test', 'scrub', 1.0);
    // PVWorld.setFxEvolution('fog_test', 'density', 1.0);
    // PVWorld.setFxEvolution('fog_test', 'strength', 1.0);
    // PVWorld.setFxEvolution('fog_test', 'intensity', 1.0);

    await Delay(60_000);

    PVWorld.stopFx('fog_test');
  },
  false,
);

RegisterCommand(
  'fog_test_stop',
  async (source: number, args: any[], rawCommand: string) => {
    // Log({ source, args, rawCommand });

    PVWorld.stopFx('fog_test');
  },
  false,
);
