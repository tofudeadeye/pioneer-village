import { useCallback, useEffect, useState } from 'react';

import { emitClient } from '@lib/ui';

import { uiSize } from '@uiLib/helpers';

import { useEscapeKey } from '../../hooks/use-game-events';
import targetStore from '../../stores/target-store';
import { getIcon, getIconAny } from './components/icon-registry';
import styles from './styles.module.scss';

export default function Target() {
  const [state, setState] = useState(targetStore.getState());

  useEffect(() => {
    const unsubscribe = targetStore.subscribe(setState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Store handles all events
  }, [state.actions]);

  // Handle escape key
  const onEscape = useCallback(() => {
    targetStore.reset();
  }, []);

  useEscapeKey(state.show, onEscape);

  const performAction = (action: Target.Item) => {
    console.log('performAction', action);
    emitClient('target.action', state.context, action);
    targetStore.reset();
    emitClient('nui.close');
  };

  const getIconData = (): { style?: 'light' | 'regular' | 'solid' | 'duotone'; icon: string } => {
    // console.log(state.flag);
    switch (state.flag) {
      case 'isHorse':
        return { style: 'solid', icon: 'horse-saddle' };
      case 'isCashRegister':
        return { style: 'duotone', icon: 'cash-register' };
    }

    switch (state.type) {
      case 3:
        return { style: 'solid', icon: 'hand-paper' }; // Objects / Doors
      case 2:
        return { style: 'solid', icon: 'wagon-covered' };
      case 1:
        return { style: 'solid', icon: 'male' };
      case 0:
        return { style: 'solid', icon: 'hand-paper' };
      default:
        return { style: 'light', icon: 'eye' };
    }
  };

  const interactIconData = getIconData();
  const InteractIconComponent = getIcon(interactIconData.style || 'solid', interactIconData.icon);

  return (
    <div className={styles.frame}>
      {state.show && state.actions.length === 0 && InteractIconComponent && (
        <InteractIconComponent
          width={uiSize(28)}
          height={uiSize(28)}
          color={state.active ? 'var(--theme-white)' : 'var(--theme-gray-medium)'}
        />
      )}
      <ul className={styles.choices}>
        {state.actions.map((action) => {
          const ActionIconComponent = getIconAny(action.icon);
          return (
            <li key={action.id} onClick={() => performAction(action)}>
              {ActionIconComponent && <ActionIconComponent />} {action.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
