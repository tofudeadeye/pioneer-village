import { CSSProperties, PropsWithChildren } from 'react';

import { HiddenActiveVisible } from '@styled/core';
import theme from '@styled/theme';

import { uiSize } from '@uiLib/helpers';

import styles from './ProgressIcon.module.scss';

interface ProgressIconProps {
  width: number;
  height: number;
  color?: keyof UI.Theme['colors'];
  fill: number;
  style?: CSSProperties;
  iconStyle?: CSSProperties;
  className?: string | undefined;
}

export default function ProgressIcon(props: PropsWithChildren<ProgressIconProps>) {
  return (
    <HiddenActiveVisible
      className={props.className}
      style={{ position: 'relative', width: uiSize(props.width), height: uiSize(props.height), ...props.style }}
    >
      <div className={styles.icon} style={{ color: '#333' }}>
        {props.children}
      </div>
      <div
        className={styles.icon}
        style={{
          color: props.color ? theme.colors[props.color].hex : undefined,
          clipPath: `polygon(0 ${100 - props.fill}%, 100% ${100 - props.fill}%, 100% 100%, 0 100%)`,
          ...props.iconStyle,
        }}
      >
        {props.children}
      </div>
    </HiddenActiveVisible>
  );
}
