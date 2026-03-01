import { type MouseEvent, useCallback, useEffect, useRef, useState } from 'react';

import styles from './slider.module.scss';

interface SliderProps {
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  displayValue?: string;
  onChange: (value: number) => void;
  debounce?: number;
  resetTo?: number;
}

function formatDisplay(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1);
}

export default function Slider({
  label,
  min = 0,
  max = 100,
  step = 1,
  value,
  displayValue,
  onChange,
  debounce,
  resetTo,
}: SliderProps) {
  const [internalValue, setInternalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const debouncedOnChange = useCallback(
    (next: number): void => {
      if (debounce && debounce > 0) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => onChange(next), debounce);
      } else {
        onChange(next);
      }
    },
    [onChange, debounce],
  );

  useEffect(() => {
    return (): void => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const next = parseFloat(e.target.value);
    setInternalValue(next);
    debouncedOnChange(next);
  };

  const handleContextMenu = (e: MouseEvent<HTMLInputElement>): void => {
    e.preventDefault();
    const resetValue = resetTo ?? (min + max) / 2;
    setInternalValue(resetValue);
    debouncedOnChange(resetValue);
  };

  const shown = displayValue ?? formatDisplay(internalValue);

  return (
    <div className={styles.container}>
      {label && (
        <div className={styles.header}>
          <span className={styles.label}>{label}</span>
          <span className={styles.value}>{shown}</span>
        </div>
      )}
      <div className={styles.trackContainer}>
        <input
          className={styles.range}
          type="range"
          min={min}
          max={max}
          step={step}
          value={internalValue}
          onChange={handleChange}
          onContextMenu={handleContextMenu}
        />
      </div>
    </div>
  );
}
