import { ColorPaletteNames, ColorPalettes } from '@lib/shared/color-palettes';

import { uiSize } from '@uiLib/helpers';

import styles from './styles.module.scss';

const tsThumbScale = 5.3;

type Props = Customization.Palette & {
  label?: string;
  identifier: string;
  onChange: (identifier: string, tint: Customization.Palette) => void;
};

export default function TintSelector({ label, identifier, palette, tint0, tint1, tint2, onChange }: Props) {
  if (typeof palette === 'string') {
    palette = palette.GetHashKey();
  }

  const handleTint0Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(identifier, { palette, tint0: Number(e.target.value), tint1, tint2 });
  };

  const handleTint1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(identifier, { palette, tint0, tint1: Number(e.target.value), tint2 });
  };

  const handleTint2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(identifier, { palette, tint0, tint1, tint2: Number(e.target.value) });
  };

  const removePalette = () => {
    onChange(identifier, { palette: -1, tint0, tint1, tint2 });
  };

  const setPalette = (palette: Customization.PaletteNames) => {
    onChange(identifier, { palette: ColorPalettes[palette].hash, tint0, tint1, tint2 });
  };

  const setTints = (value: number) => {
    onChange(identifier, { palette, tint0: value, tint1: value, tint2: value });
  };

  return (
    <div className={styles.tsContainer}>
      {label && <h1>{label}</h1>}

      <h2>Presets</h2>
      {/* TODO */}

      <h2>Palettes</h2>
      <div className={styles.tsPalettes}>
        <label className={styles.tsPalette}>
          <input type="radio" name="palette" value={0} checked={palette === -1} onClick={() => removePalette()} />
          None
        </label>
        {Object.keys(ColorPalettes).map((p: Customization.PaletteNames) => {
          return (
            <label className={styles.tsPalette}>
              <input
                type="radio"
                name={`palette-${identifier}`}
                value={ColorPalettes[p].hash}
                checked={ColorPalettes[p].hash === palette >>> 0}
                onClick={() => setPalette(p)}
              />
              {p.replace('metaped_tint_', '').split('_').join(' ')}
            </label>
          );
        })}
      </div>

      <h2>Dyes</h2>
      <div className={styles.tsOptions}>
        {palette !== -1 &&
          new Array(ColorPalettes[ColorPaletteNames[palette >>> 0]]?.count || 0).fill(0).map((_, i) => (
            <div key={i} className={styles.tsOption}>
              <div
                className={styles.tsThumb}
                style={{
                  width: uiSize(8 * tsThumbScale),
                  height: uiSize(8 * tsThumbScale),
                  backgroundSize: uiSize(64 * tsThumbScale),
                  backgroundImage: `url(https://p--v.b-cdn.net/customization/palettes/${
                    ColorPaletteNames[palette >>> 0]
                  }_thumbs.png)`,
                  backgroundPosition: `-${uiSize((i % 8) * 8 * tsThumbScale)} -${uiSize(
                    Math.floor(i / 8) * 8 * tsThumbScale,
                  )}`,
                }}
                onClick={() => setTints(i)}
              >
                {i}
              </div>
              <label className={styles.tsRadio}>
                <input
                  type="radio"
                  name={`primary-${identifier}`}
                  value={i}
                  checked={tint0 === i}
                  onChange={handleTint0Change}
                />
                1
              </label>
              <label className={styles.tsRadio}>
                <input
                  type="radio"
                  name={`secondary-${identifier}`}
                  value={i}
                  checked={tint1 === i}
                  onChange={handleTint1Change}
                />
                2
              </label>
              <label className={styles.tsRadio}>
                <input
                  type="radio"
                  name={`tertiary-${identifier}`}
                  value={i}
                  checked={tint2 === i}
                  onChange={handleTint2Change}
                />
                3
              </label>
            </div>
          ))}
      </div>
    </div>
  );
}
