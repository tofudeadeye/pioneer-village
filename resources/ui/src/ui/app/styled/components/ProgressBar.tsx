import { PropsWithChildren } from 'react';
import { HTMLAttributes } from 'react';

import { uiSize } from '@uiLib/helpers';

import { themeColor } from '../theme';
import styles from './ProgressBar.module.scss';

interface ProgressBarProps {
  progress: number;
  width?: number | string;
  height?: number | string;
  color?: keyof UI.Theme['colors'];
  backgroundColor?: string;
  source?: 'left' | 'right' | 'center' | 'top' | 'bottom' | 'middle';
  border?: boolean;
}

const defaultProps = {
  width: uiSize(120),
  height: uiSize(8),
  color: 'blue',
  backgroundColor: undefined,
  source: 'left',
  border: false,
};

export default function ProgressBar(props: PropsWithChildren<ProgressBarProps>) {
  const { width, height, backgroundColor, source } = { ...defaultProps, ...props };
  const isVertical = source === 'top' || source === 'bottom' || source === 'middle';
  const color = themeColor('hex', defaultProps.color, props.color);

  const style: HTMLAttributes<HTMLDivElement>['style'] = { backgroundColor: color };
  if (isVertical) {
    style.width = '100%';
    style.height = `${props.progress * 100}%`;
  } else {
    style.width = `${props.progress * 100}%`;
    style.height = '100%';
  }

  const classes = [styles.fillContainer];
  if (props.border) {
    classes.push(styles.border);
  }
  if (isVertical) {
    classes.push(styles.vertical);
  } else {
    classes.push(styles.horizontal);
  }

  return (
    <div style={{ width, height, backgroundColor }} className={classes.join(' ')}>
      {source === 'left' && <div className={`${styles.fillBarLeft} ${styles.fillBarHorizontal}`} style={style} />}
      {source === 'center' && <div className={`${styles.fillBarCenter} ${styles.fillBarHorizontal}`} style={style} />}
      {source === 'right' && <div className={`${styles.fillBarRight} ${styles.fillBarHorizontal}`} style={style} />}
      {source === 'top' && <div className={`${styles.fillBarTop} ${styles.fillBarVertical}`} style={style} />}
      {source === 'middle' && <div className={`${styles.fillBarMiddle} ${styles.fillBarVertical}`} style={style} />}
      {source === 'bottom' && <div className={`${styles.fillBarBottom} ${styles.fillBarVertical}`} style={style} />}
      {props.children}
    </div>
  );
}
