import { useState } from 'react';

import { ColorPaletteNames, ColorPalettes } from '@lib/shared/color-palettes';

import { uiSize } from '@uiLib/helpers';
import { conditionalClass } from '@uiLib/helpers';

import styles from './tint-selector.module.scss';

const THUMB_SCALE = 5.3;

type Props = Customization.Palette & {
  label?: string;
  identifier: string;
  onChange: (identifier: string, tint: Customization.Palette) => void;
};

export default function TintSelector({ label, identifier, palette, tint0, tint1, tint2, onChange }: Props) {
  const [activeTint, setActiveTint] = useState<0 | 1 | 2>(0);

  if (typeof palette === 'string') {
    palette = palette.GetHashKey();
  }

  const removePalette = (): void => {
    onChange(identifier, { palette: -1, tint0, tint1, tint2 });
  };

  const setPalette = (paletteName: Customization.PaletteNames): void => {
    onChange(identifier, { palette: ColorPalettes[paletteName].hash, tint0, tint1, tint2 });
  };

  const paletteCount = ColorPalettes[ColorPaletteNames[palette >>> 0]]?.count || 0;

  return (
    <div className={styles.container}>
      {label && <div className={styles.label}>{label}</div>}

      <div className={styles.sectionTitle}>Palettes</div>
      <div className={styles.palettes}>
        <label className={conditionalClass(styles.paletteChip, { [styles.selected]: palette === -1 })}>
          <input
            type="radio"
            name={`palette-${identifier}`}
            value={0}
            checked={palette === -1}
            onChange={removePalette}
          />
          None
        </label>
        {(Object.keys(ColorPalettes) as Customization.PaletteNames[]).map((p) => (
          <label
            key={p}
            className={conditionalClass(styles.paletteChip, {
              [styles.selected]: ColorPalettes[p].hash === palette >>> 0,
            })}
          >
            <input
              type="radio"
              name={`palette-${identifier}`}
              value={ColorPalettes[p].hash}
              checked={ColorPalettes[p].hash === palette >>> 0}
              onChange={() => setPalette(p)}
            />
            {p.replace('metaped_tint_', '').split('_').join(' ')}
          </label>
        ))}
      </div>

      {palette !== -1 && paletteCount > 0 && (
        <>
          <div className={styles.sectionTitle}>Dyes</div>
          <div className={styles.tintSlots}>
            {([0, 1, 2] as const).map((slot) => {
              const tintValue = [tint0, tint1, tint2][slot];
              const previewScale = 2.25;
              return (
                <button
                  key={slot}
                  className={conditionalClass(styles.tintSlot, { [styles.active]: activeTint === slot })}
                  onClick={() => setActiveTint(slot)}
                >
                  <div
                    className={styles.tintPreview}
                    style={{
                      backgroundImage: `url(https://p--v.b-cdn.net/customization/palettes/${ColorPaletteNames[palette >>> 0]}_thumbs.png)`,
                      backgroundPosition: `-${uiSize((tintValue % 8) * 8 * previewScale)} -${uiSize(Math.floor(tintValue / 8) * 8 * previewScale)}`,
                      backgroundSize: uiSize(64 * previewScale),
                    }}
                  />
                  Tint {slot}
                </button>
              );
            })}
          </div>

          <div className={styles.dyeGrid}>
            {new Array(paletteCount).fill(0).map((_, i) => {
              const isSelectedByAny = tint0 === i || tint1 === i || tint2 === i;
              const isSelectedByActive = [tint0, tint1, tint2][activeTint] === i;
              return (
                <div
                  key={i}
                  className={conditionalClass(styles.dyeThumb, {
                    [styles.selected]: isSelectedByActive,
                    [styles.used]: isSelectedByAny && !isSelectedByActive,
                  })}
                  style={{
                    width: uiSize(8 * THUMB_SCALE),
                    height: uiSize(8 * THUMB_SCALE),
                    backgroundSize: uiSize(64 * THUMB_SCALE),
                    backgroundImage: `url(https://p--v.b-cdn.net/customization/palettes/${ColorPaletteNames[palette >>> 0]}_thumbs.png)`,
                    backgroundPosition: `-${uiSize((i % 8) * 8 * THUMB_SCALE)} -${uiSize(Math.floor(i / 8) * 8 * THUMB_SCALE)}`,
                  }}
                  onClick={() => {
                    if (activeTint === 0) {
                      onChange(identifier, { palette, tint0: i, tint1, tint2 });
                    } else if (activeTint === 1) {
                      onChange(identifier, { palette, tint0, tint1: i, tint2 });
                    } else {
                      onChange(identifier, { palette, tint0, tint1, tint2: i });
                    }
                  }}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
