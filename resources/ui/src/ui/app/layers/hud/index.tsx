import ClawMarks from '@fa/5/duotone/claw-marks.svg';
import VoiceLoud from '@fa/5/modified/mouth-loud.svg';
import VoiceNormal from '@fa/5/modified/mouth-normal.svg';
import VoiceQuiet from '@fa/5/modified/mouth-quiet.svg';
// import Horse from '@fa/5/solid/horse.svg';
// import HorseSaddle from '@fa/5/solid/horse-saddle.svg';
import Bacterium from '@fa/5/solid/bacterium.svg';
import Bolt from '@fa/5/solid/bolt.svg';
import BoneBreak from '@fa/5/solid/bone-break.svg';
import Fire from '@fa/5/solid/fire-alt.svg';
// import Microphone from '@fa/5/solid/microphone-alt.svg';
import Heart from '@fa/5/solid/heart.svg';
import Running from '@fa/5/solid/running.svg';
import Snowflake from '@fa/5/solid/snowflake.svg';
import Speed from '@fa/5/solid/tachometer-alt-average.svg';
import SpeedFast from '@fa/5/solid/tachometer-alt-fast.svg';
import SpeedFastest from '@fa/5/solid/tachometer-alt-fastest.svg';
import SpeedSlow from '@fa/5/solid/tachometer-alt-slow.svg';
import SpeedSlowest from '@fa/5/solid/tachometer-alt-slowest.svg';
import Tint from '@fa/5/solid/tint.svg';
import Walking from '@fa/5/solid/walking.svg';
import { useEffect, useState } from 'react';

import { uiSize } from '@uiLib/helpers';

import hudStore from '../../stores/hud-store';
import FoodAndDrink from './icons/FoodAndDrink';
import ProgressIcon from './icons/ProgressIcon';
import styles from './styles.module.scss';
import animStyles from './animations.module.scss';

export default function HUD() {
  const [state, setState] = useState(hudStore.getState());

  useEffect(() => {
    const unsubscribe = hudStore.subscribe(setState);
    return unsubscribe;
  }, []);

  // Store handles all events

  return (
    state.show && (
      <>
        {state.crosshair && <div className={styles.crosshair} />}
        <div className={styles.hudBottomLeft}>
          <ProgressIcon
            width={36}
            height={36}
            color={state.isSpeaking ? 'red' : 'white'}
            fill={100}
            style={{ transform: `translateY(-${uiSize(4)})` }}
            className={state.isSpeaking || state.speakVolume !== 2 ? 'active' : undefined}
          >
            {state.speakVolume === 1 ? (
              <VoiceQuiet />
            ) : state.speakVolume === 2 ? (
              <VoiceNormal />
            ) : state.speakVolume === 3 ? (
              <VoiceLoud />
            ) : (
              <VoiceNormal />
            )}
          </ProgressIcon>
          {/*<ProgressIcon*/}
          {/*  width={34}*/}
          {/*  height={34}*/}
          {/*  color="white"*/}
          {/*  fill={state.speakVolume * 33.333}*/}
          {/*  style={{ transform: `translateY(-${uiSize(2)})` }}*/}
          {/*  className={state.speakVolume !== 2 ? 'active' : undefined}*/}
          {/*>*/}
          {/*  <Microphone />*/}
          {/*</ProgressIcon>*/}
          <ProgressIcon
            width={40}
            height={40}
            color={state.health < 25 ? 'red' : 'green'}
            fill={state.health}
            style={{ transform: `translateY(-${uiSize(3)})` }}
            className={state.health < 100 ? 'active' : undefined}
          >
            <Heart />
          </ProgressIcon>
          <ProgressIcon width={38} height={38} color="red" fill={100} className={state.isHot ? 'active' : undefined}>
            <Fire />
          </ProgressIcon>
          <ProgressIcon
            width={38}
            height={38}
            color="lightBlue"
            fill={100}
            className={state.isCold ? 'active' : undefined}
          >
            <Snowflake />
          </ProgressIcon>
          <div className={`${animStyles.animBleeding} ${state.bleeding ? 'active' : ''}`}>
            <ProgressIcon
              width={38}
              height={38}
              color="white"
              fill={100}
              className={state.bleeding ? 'active' : undefined}
            >
              <ClawMarks className="clawMarks" />
              {state.bleeding && (
                <>
                  <Tint className="blood" />
                  <Tint className="blood" />
                  <Tint className="blood" />
                </>
              )}
            </ProgressIcon>
          </div>
          <ProgressIcon
            width={38}
            height={38}
            color="white"
            fill={100}
            className={state.brokenBone ? 'active' : undefined}
          >
            <BoneBreak />
          </ProgressIcon>
          <div className={`${animStyles.animInfection} ${state.infection > 50 ? 'active' : ''}`}>
            <ProgressIcon
              width={32}
              height={32}
              fill={state.infection}
              className={state.infection > 0 ? 'active' : undefined}
            >
              <Bacterium />
            </ProgressIcon>
          </div>
          <FoodAndDrink
            width={48}
            height={48}
            food={state.food}
            drink={state.drink}
            className={state.food < 85 || state.drink < 85 ? 'active' : undefined}
          />
          <ProgressIcon
            width={38}
            height={38}
            color={state.stamina < 25 ? 'red' : 'white'}
            fill={state.stamina}
            className={state.stamina < 90 ? 'active' : undefined}
          >
            <Bolt />
          </ProgressIcon>
          <ProgressIcon
            width={38}
            height={38}
            color="white"
            fill={state.moveSpeed}
            className={state.moveSpeed < 100 ? 'active' : undefined}
          >
            {state.moveSpeed <= 50 ? <Walking /> : <Running />}
          </ProgressIcon>
        </div>
        <div className={styles.hudBottomCenter}>
          <ProgressIcon
            width={38}
            height={38}
            color="gray50"
            fill={100}
            className={state.horseSpeed > 0 ? 'active' : undefined}
          >
            {state.horseSpeed > 80 ? (
              <SpeedFastest />
            ) : state.horseSpeed > 60 ? (
              <SpeedFast />
            ) : state.horseSpeed > 40 ? (
              <Speed />
            ) : state.horseSpeed > 20 ? (
              <SpeedSlow />
            ) : (
              <SpeedSlowest />
            )}
          </ProgressIcon>
        </div>
        {/*<div className={styles.hudBottomRight}></div>*/}
      </>
    )
  );
}
