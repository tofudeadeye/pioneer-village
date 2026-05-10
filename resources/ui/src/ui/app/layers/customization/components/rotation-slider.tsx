import { JSX, useCallback, useEffect, useRef, useState } from 'react';

import styles from './rotation-slider.module.scss';

interface RotationSliderProps {
  value: number;
  onChange: (value: number) => void;
}

interface Tick {
  deg: number;
  type: 'center' | 'major' | 'minor';
}

const INTERNAL_MIN = -90;
const INTERNAL_MAX = 270;
const INTERNAL_RANGE = INTERNAL_MAX - INTERNAL_MIN;
const INTERNAL_CENTER = 90;

function toDisplay(internal: number): number {
  return internal - INTERNAL_CENTER;
}

function toPercent(internal: number): number {
  return ((internal - INTERNAL_MIN) / INTERNAL_RANGE) * 100;
}

const STEP = 45;

function fromPercent(pct: number): number {
  const raw = INTERNAL_MIN + (pct / 100) * INTERNAL_RANGE;
  return Math.round(raw / STEP) * STEP;
}

function buildTicks(): Tick[] {
  const ticks: Tick[] = [];
  for (let i = INTERNAL_MIN; i <= INTERNAL_MAX; i += 15) {
    const isCenter = i === INTERNAL_CENTER;
    const isMajor = !isCenter && i % 90 === 0;
    ticks.push({
      deg: i,
      type: isCenter ? 'center' : isMajor ? 'major' : 'minor',
    });
  }
  return ticks;
}

const TICKS = buildTicks();

export default function RotationSlider({ value, onChange }: RotationSliderProps): JSX.Element {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    if (!dragging) {
      setLocalValue(value);
    }
  }, [value, dragging]);

  const displayDegrees = toDisplay(localValue);
  const valuePct = toPercent(localValue);
  const centerPct = toPercent(INTERNAL_CENTER);

  const fillLeft = localValue >= INTERNAL_CENTER ? centerPct : valuePct;
  const fillWidth = localValue >= INTERNAL_CENTER ? valuePct - centerPct : centerPct - valuePct;

  const handleMove = useCallback(
    (clientX: number): void => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const next = fromPercent(pct);
      const clamped = Math.max(INTERNAL_MIN, Math.min(INTERNAL_MAX, next));
      setLocalValue(clamped);
      onChange(clamped);
    },
    [onChange],
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent): void => handleMove(e.clientX);
    const onUp = (): void => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return (): void => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, handleMove]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.button === 2) {
      e.preventDefault();
      setLocalValue(INTERNAL_CENTER);
      onChange(INTERNAL_CENTER);
      return;
    }
    setDragging(true);
    handleMove(e.clientX);
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault();
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.readout}>{displayDegrees}&deg;</div>
      <div className={styles.track} ref={trackRef} onMouseDown={handleMouseDown} onContextMenu={handleContextMenu}>
        <div className={styles.trackBg}>
          <div className={styles.trackFill} style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }} />
        </div>
        <div className={styles.ticks}>
          {TICKS.map((tick) => (
            <div key={tick.deg} className={styles[tick.type]} />
          ))}
        </div>
        <div className={styles.thumb} style={{ left: `${valuePct}%` }} />
      </div>
      <div className={styles.labels}>
        <span>-180&deg;</span>
        <span>0&deg;</span>
        <span>180&deg;</span>
      </div>
    </div>
  );
}
