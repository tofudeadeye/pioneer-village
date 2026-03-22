import { ReactNode } from 'react';

import { conditionalClass } from '@uiLib/helpers';

import { SKIN_TONES } from '../constants';
import styles from './skin-tone-bar.module.scss';

interface SkinToneBarProps {
  value: number;
  onChange: (index: number) => void;
}

export default function SkinToneBar({ value, onChange }: SkinToneBarProps): ReactNode {
  return (
    <div className={styles.bar}>
      {SKIN_TONES.map(([index, color]) => (
        <div
          key={index}
          className={conditionalClass(styles.swatch, {
            [styles.selected]: value === index,
          })}
          style={{ backgroundColor: color }}
          onClick={() => onChange(index)}
        />
      ))}
    </div>
  );
}
