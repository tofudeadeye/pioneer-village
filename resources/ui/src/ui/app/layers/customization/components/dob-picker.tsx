import { useCallback, useEffect, useRef, useState } from 'react';

import { conditionalClass } from '@uiLib/helpers';

import styles from './dob-picker.module.scss';

interface DOBPickerProps {
  value: string;
  onChange: (value: string) => void;
}

type Segment = 'month' | 'day' | 'year';

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = Array.from({ length: 1873 - 1790 + 1 }, (_, i) => 1790 + i);

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function parseDateValue(value: string): { year: number; month: number; day: number } {
  const [yearStr, monthStr, dayStr] = value.split('-');
  return {
    year: parseInt(yearStr, 10) || 1850,
    month: parseInt(monthStr, 10) || 1,
    day: parseInt(dayStr, 10) || 1,
  };
}

function formatDateValue(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export default function DOBPicker({ value, onChange }: DOBPickerProps): JSX.Element {
  const [openSegment, setOpenSegment] = useState<Segment | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { year, month, day } = parseDateValue(value);
  const maxDay = daysInMonth(month, year);

  const handleClickOutside = useCallback((e: MouseEvent): void => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpenSegment(null);
    }
  }, []);

  useEffect(() => {
    if (openSegment) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openSegment, handleClickOutside]);

  const toggleSegment = (seg: Segment): void => {
    setOpenSegment((prev) => (prev === seg ? null : seg));
  };

  const setMonth = (newMonth: number): void => {
    const newMax = daysInMonth(newMonth, year);
    const clampedDay = day > newMax ? newMax : day;
    onChange(formatDateValue(year, newMonth, clampedDay));
    setOpenSegment(null);
  };

  const setDay = (newDay: number): void => {
    onChange(formatDateValue(year, month, newDay));
    setOpenSegment(null);
  };

  const setYear = (newYear: number): void => {
    const newMax = daysInMonth(month, newYear);
    const clampedDay = day > newMax ? newMax : day;
    onChange(formatDateValue(newYear, month, clampedDay));
    setOpenSegment(null);
  };

  return (
    <div className={styles.picker} ref={containerRef}>
      <div className={styles.segments}>
        <div className={styles.segment}>
          <button
            className={conditionalClass(styles.segmentBtn, {
              [styles.open]: openSegment === 'month',
            })}
            onClick={() => toggleSegment('month')}
          >
            {MONTH_ABBR[month - 1]}
          </button>
        </div>

        <div className={styles.segment}>
          <button
            className={conditionalClass(styles.segmentBtn, {
              [styles.open]: openSegment === 'day',
            })}
            onClick={() => toggleSegment('day')}
          >
            {String(day).padStart(2, '0')}
          </button>
        </div>

        <span className={styles.separator}>,</span>

        <div className={styles.segment}>
          <button
            className={conditionalClass(styles.segmentBtn, {
              [styles.open]: openSegment === 'year',
            })}
            onClick={() => toggleSegment('year')}
          >
            {year}
          </button>
        </div>
      </div>

      {openSegment === 'month' && (
        <div className={styles.popover}>
          <div className={conditionalClass([styles.grid, styles.monthGrid])}>
            {MONTH_ABBR.map((m, i) => (
              <div
                key={m}
                className={conditionalClass([styles.cell, styles.monthCell], {
                  [styles.selected]: month === i + 1,
                })}
                onClick={() => setMonth(i + 1)}
              >
                {m}
              </div>
            ))}
          </div>
        </div>
      )}

      {openSegment === 'day' && (
        <div className={styles.popover}>
          <div className={conditionalClass([styles.grid, styles.dayGrid])}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <div
                key={d}
                className={conditionalClass(styles.cell, {
                  [styles.selected]: day === d,
                  [styles.disabled]: d > maxDay,
                })}
                onClick={() => d <= maxDay && setDay(d)}
              >
                {d}
              </div>
            ))}
          </div>
        </div>
      )}

      {openSegment === 'year' && (
        <div className={styles.popover}>
          <div className={conditionalClass([styles.grid, styles.yearGrid])}>
            {YEARS.map((y) => (
              <div
                key={y}
                className={conditionalClass([styles.cell, styles.yearCell], {
                  [styles.selected]: year === y,
                })}
                onClick={() => setYear(y)}
              >
                {y}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
