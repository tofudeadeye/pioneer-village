import { PVGame, PVInit, awaitUI, emitUI, focusUI, onUI } from '@lib/client';
import { Log, emitSocket } from '@lib/client/comms/ui';
import { Delay } from '@lib/functions';

import { spawnCharacters } from './controllers/character-select';
import './exports';
import gameManager from './managers/game-manager';

let shouldHideLoadscreen = false;
let firstRun = true;

const playerId = PlayerId();

const spawnCoords = { x: 2948.702, y: 2387.352, z: 196.847 };

const loadedIn = (): Promise<void> => {
  let player;
  return new Promise((resolve) => {
    const loadedInterval = setInterval(() => {
      player = PlayerPedId();
      if (player) {
        SetEntityCoordsNoOffset(player, spawnCoords.x, spawnCoords.y, spawnCoords.z, false, false, false);
      }
      if (!GetIsLoadingScreenActive() && player && HasCollisionLoadedAroundEntity(player)) {
        clearInterval(loadedInterval);
        resolve();
      }
    }, 100);
  });
};

let characterSelectionRunning = false;

const characterSelection = async () => {
  if (characterSelectionRunning) {
    return;
  }
  characterSelectionRunning = true;
  let male = 0;
  let female = 0;
  let horse = 0;
  if (firstRun) {
    // Game acts weird with the first ped created so lets spawn some trash ones to start.
    male = await gameManager.createPed('MP_MALE', spawnCoords.x, spawnCoords.y, spawnCoords.z);
    female = await gameManager.createPed('MP_FEMALE', spawnCoords.x, spawnCoords.y, spawnCoords.z);
    horse = await gameManager.createPed('A_C_HORSE_ARABIAN_WHITE', spawnCoords.x, spawnCoords.y, spawnCoords.z);
    EquipMetaPedOutfit(horse, 0xfbc20910);
    UpdatePedVariation(horse, false, true, true, true, false);
    await Delay(2500);
  }

  const characters = await awaitUI('getCharacters');

  if (firstRun) {
    // Females for some reason spawn with a broken head, so we need to delete them and spawn new ones.
    await spawnCharacters(characters);
    await Delay(2500);
  }

  const uiCharacters = await spawnCharacters(characters);

  if (firstRun) {
    gameManager.deleteEntity(male);
    gameManager.deleteEntity(female);
    gameManager.deleteEntity(horse);
  }
  firstRun = false;

  NetworkSetFriendlyFireOption(true);
  ShutdownLoadingScreen();
  ShutdownLoadingScreenNui();

  await loadedIn();
  await Delay(1000);
  DoScreenFadeIn(500);

  shouldHideLoadscreen = true;
  emitUI('character-select.state', {
    show: true,
    characters: uiCharacters,
  });
  PVInit.resolveResource('game');
  focusUI(true, true);
  characterSelectionRunning = false;
};

const initTick = setTick(() => {
  if (NetworkIsSessionStarted()) {
    DoScreenFadeOut(0);
    characterSelection();

    clearTick(initTick);
  }
});

onUI('socket.connected', async () => {
  Log('socket.connected');
  // Log('socket.connected', PVGame.getCurrentCharacter(), !PVGame.getCurrentCharacter());
  const character = PVGame.getCurrentCharacter();
  if (character) {
    const steamId = await PVGame.getPlayerSteamId();
    emitSocket('character-select.choose', character.id, steamId);
  } else {
    characterSelection();
  }
});

on('game:client:new_character', async (characterData: Game.Character, faceData: Game.Face) => {
  DoScreenFadeOut(500);
  Log(characterData);
  await awaitUI('createCharacter', characterData, faceData);
  characterSelection();
  // TODO: This step will be unnecessary when custimization UI is ported to new UI system.
});

RegisterNuiCallbackType('loadscreen-shutdown-check');
on('__cfx_nui:loadscreen-shutdown-check', (data: Record<string, any>, cb: (res: any) => void) => {
  cb({ shutdown: shouldHideLoadscreen });
});
