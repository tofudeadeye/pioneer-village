import { ColorPaletteNames } from '@lib/shared/color-palettes';

import { conditionalClass, uiSize } from '@uiLib/helpers';

import styles from './tint-swatches.module.scss';

interface TintSwatchesProps {
  palette: string | number;
  tint0: number;
  tint1: number;
  tint2: number;
}

export default function TintSwatches({ palette, tint0, tint1, tint2 }: TintSwatchesProps) {
  const tints = [tint0, tint1, tint2];
  const paletteName = typeof palette === 'string' ? palette : ColorPaletteNames[palette >>> 0];

  if (!paletteName) {
    return null;
  }

  return (
    <div className={styles.tintSwatches}>
      {tints.map((tint, i) => {
        const THUMB_SCALE = i === 0 ? 2 : 1;
        return (
          <div
            key={i}
            className={conditionalClass(styles.tintSwatch, {
              [styles.first]: i === 0,
            })}
            style={{
              backgroundImage: `url(https://p--v.b-cdn.net/customization/palettes/${paletteName}_thumbs.png)`,
              backgroundPosition: `-${uiSize((tint % 8) * 12 * THUMB_SCALE)} -${uiSize(
                Math.floor(tint / 8) * 12 * THUMB_SCALE,
              )}`,
            }}
          />
        );
      })}
    </div>
  );
}
