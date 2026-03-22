import { useState, useEffect } from 'react';
import interactStore from '../../stores/interact-store';

import styles from './styles.module.scss';

export default function Interact() {
  const [state, setState] = useState(interactStore.getState());

  useEffect(() => {
    const unsubscribe = interactStore.subscribe(setState);
    return unsubscribe;
  }, []);

  // Store handles all events

  return state.pois.map(
    (poi) =>
      poi.distance < 5 && (
        <div
          key={poi.id}
          className={`${styles.poi} ${poi.id === state.active ? 'active' : ''}`}
          style={{
            left: `${poi.screenX * 100}%`,
            top: `${poi.screenY * 100}%`,
            transform: `scale(${(5 - poi.distance) / 5})`,
          }}
        >
          {poi.id === state.active && 'E'}
        </div>
      ),
  );
}
