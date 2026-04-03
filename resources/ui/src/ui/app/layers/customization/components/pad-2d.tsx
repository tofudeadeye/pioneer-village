import { clamp } from 'lodash';
import { MouseEvent as ReactMouseEvent, ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { conditionalClass } from '@uiLib/helpers';

import styles from './pad-2d.module.scss';

interface Pad2DProps {
  labelX: string;
  labelY: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  step?: number;
  xValue: number;
  yValue: number;
  onChange: (xValue: number, yValue: number) => void;
}

export default function Pad2D({
  labelX,
  labelY,
  xMin,
  xMax,
  yMin,
  yMax,
  step = 0.1,
  xValue,
  yValue,
  onChange,
}: Pad2DProps): ReactNode {
  const padRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const positionFromValue = useCallback(
    (x: number, y: number): { left: string; top: string } => {
      const xPercent = ((x - xMin) / (xMax - xMin)) * 100;
      // Y-axis inverted: top of pad = yMax, bottom = yMin
      const yPercent = (1 - (y - yMin) / (yMax - yMin)) * 100;
      return {
        left: `${clamp(xPercent, 0, 100)}%`,
        top: `${clamp(yPercent, 0, 100)}%`,
      };
    },
    [xMin, xMax, yMin, yMax],
  );

  const valueFromPosition = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      if (!padRef.current) return { x: xValue, y: yValue };

      const rect = padRef.current.getBoundingClientRect();
      const px = clamp((clientX - rect.left) / rect.width, 0, 1);
      const py = clamp((clientY - rect.top) / rect.height, 0, 1);

      let x = xMin + px * (xMax - xMin);
      let y = yMax - py * (yMax - yMin);

      x = Math.round(x / step) * step;
      y = Math.round(y / step) * step;

      x = clamp(x, Math.min(xMin, xMax), Math.max(xMin, xMax));
      y = clamp(y, Math.min(yMin, yMax), Math.max(yMin, yMax));

      return { x, y };
    },
    [xMin, xMax, yMin, yMax, step, xValue, yValue],
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number): void => {
      const { x, y } = valueFromPosition(clientX, clientY);
      if (x !== xValue || y !== yValue) {
        onChange(x, y);
      }
    },
    [valueFromPosition, xValue, yValue, onChange],
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent): void => handleMove(e.clientX, e.clientY);
    const onUp = (): void => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return (): void => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, handleMove]);

  const onMouseDown = (e: ReactMouseEvent<HTMLDivElement>): void => {
    if (e.button === 2) {
      // Right-click resets to midpoint
      const midX = Math.round((xMin + xMax) / 2 / step) * step;
      const midY = Math.round((yMin + yMax) / 2 / step) * step;
      onChange(midX, midY);
      return;
    }
    if (e.button !== 0) return;
    setDragging(true);
    handleMove(e.clientX, e.clientY);
  };

  const onContextMenu = (e: ReactMouseEvent<HTMLDivElement>): void => {
    e.preventDefault();
  };

  const pos = positionFromValue(xValue, yValue);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>{labelX} &amp; {labelY}</span>
        <span className={styles.headerValue}>
          {xValue.toFixed(1)}, {yValue.toFixed(1)}
        </span>
      </div>
      <div className={styles.padWrapper}>
        <div ref={padRef} className={styles.pad} onMouseDown={onMouseDown} onContextMenu={onContextMenu}>
          <span className={conditionalClass([styles.axisLabel, styles.top])}>{labelY}</span>
          <span className={conditionalClass([styles.axisLabel, styles.bottom])}>{labelY}</span>
          <span className={conditionalClass([styles.axisLabel, styles.left])}>{labelX}</span>
          <span className={conditionalClass([styles.axisLabel, styles.right])}>{labelX}</span>
          <div
            className={conditionalClass(styles.indicator, { [styles.dragging]: dragging })}
            style={{ left: pos.left, top: pos.top }}
          />
        </div>
      </div>
    </div>
  );
}
