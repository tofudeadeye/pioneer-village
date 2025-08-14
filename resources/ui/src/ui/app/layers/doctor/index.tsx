import Bacterium from '@fa/5/solid/bacterium.svg';
import BoneBreak from '@fa/5/solid/bone-break.svg';
import ClawMarks from '@fa/5/solid/claw-marks.svg';
import Fire from '@fa/5/solid/fire.svg';
import { useCallback, useEffect, useState } from 'react';

import doctorStore from '../../stores/doctor-store';
import { useEscapeKey } from '../../hooks/use-game-events';
import Circle from './icon/circle';
import styles from './styles.module.scss';

const SPEEDS = {
  slowest: 7500,
  slower: 2000,
  slow: 1500,
  normal: 1250,
  fast: 1000,
  faster: 750,
  fastest: 500,
};

const boneInspectSpeed: Record<string, keyof typeof SPEEDS> = {
  SKEL_HEAD: 'slower',
  SKEL_L_CALF: 'fast',
  SKEL_L_CLAVICLE: 'normal',
  SKEL_L_FOOT: 'normal',
  SKEL_L_FOREARM: 'fastest',
  SKEL_L_HAND: 'fast',
  SKEL_L_THIGH: 'slow',
  SKEL_L_UPPERARM: 'faster',
  SKEL_NECK1: 'slower',
  SKEL_PENIS00: 'slowest',
  SKEL_R_CALF: 'fast',
  SKEL_R_CLAVICLE: 'normal',
  SKEL_R_FOOT: 'normal',
  SKEL_R_FOREARM: 'fastest',
  SKEL_R_HAND: 'fast',
  SKEL_R_THIGH: 'slow',
  SKEL_R_UPPERARM: 'faster',
  SKEL_SPINE4: 'slower',
};

export default function Doctor() {
  const [state, setState] = useState(doctorStore.getState());

  useEffect(() => {
    const unsubscribe = doctorStore.subscribe(setState);
    return unsubscribe;
  }, []);

  // Store handles all events - removed onClient from here

  // Handle escape key
  const onEscape = useCallback(() => {
    doctorStore.close();
  }, []);

  useEscapeKey(state.show, onEscape);

  const inspect = (index: number) => {
    if (state.inspecting !== -1 || state.inspected[index]) {
      return;
    }
    const { boneStatus, inspected } = state;
    const bone = boneStatus[index];

    if (bone) {
      const newInspected = [...inspected];
      newInspected[index] = true;

      doctorStore.setInspecting(index);

      console.log('bone', bone);
      const speed = SPEEDS[boneInspectSpeed[bone.name]] || 500;

      console.log('speed', speed);

      setTimeout(() => {
        doctorStore.finishInspection(newInspected);
      }, speed);
    }
  };

  const boneHealthColor = (b: number, bone: UI.Doctor.BoneStatus) => {
    if (state.inspected[b]) {
      if (bone.health < 20) {
        return 'red';
      }
      if (bone.health < 60) {
        return 'orange';
      }
      return 'green';
    }
    return 'white';
  };

  return (
    state.show && (
      <div className={styles.doctorWrapper}>
        {state.boneStatus.map((bone, b) => (
          <div
            key={b}
            className={`${styles.doctorCircle} ${b === state.inspecting ? styles.inspecting : ''} ${state.inspected[b] ? styles.inspected : ''}`}
            style={{ top: `${bone.coords.y}vh`, left: `${bone.coords.x}vw` }}
            onClick={() => inspect(b)}
            data-name={bone.name
              .replace(/(SKEL_|[0-9])/g, '')
              .replace('L_', 'Left ')
              .replace('R_', 'Right ')
              .toLowerCase()}
          >
            <Circle
              className={`borderCircle ${boneInspectSpeed[bone.name]}`}
              percentage={state.inspected[b] ? bone.health : 0}
              color={boneHealthColor(b, bone)}
            />
            {state.inspected[b] && (
              <>
                {(bone.broken && <BoneBreak />) || ''}
                {(bone.wound && <ClawMarks />) || ''}
                {(bone.burned && <Fire />) || ''}
                {(bone.infection && <Bacterium />) || ''}
              </>
            )}
          </div>
        ))}
      </div>
    )
  );
}
