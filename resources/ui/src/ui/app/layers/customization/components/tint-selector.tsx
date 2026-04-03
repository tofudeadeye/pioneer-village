import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ColorPaletteNames, ColorPalettes } from '@lib/shared/color-palettes';

import { conditionalClass } from '@uiLib/helpers';

import styles from './tint-selector.module.scss';
import { downsampleSwatch, FALLBACK_SWATCH, loadImageData, paletteUrl, renderTinted, swatchUrl } from './tint-render';

type Props = Customization.Palette & {
  label?: string;
  identifier: string;
  swatchTexture?: string;
  useFallbackSwatch?: boolean;
  onChange: (identifier: string, tint: Customization.Palette) => void;
};

const GRID_CELL_SIZE = 32;
const PREVIEW_SIZE = 64;
const BATCH_SIZE = 16;

export default function TintSelector({
  label,
  identifier,
  palette,
  tint0,
  tint1,
  tint2,
  swatchTexture,
  useFallbackSwatch = true,
  onChange,
}: Props) {
  const [activeTint, setActiveTint] = useState<0 | 1 | 2>(0);
  const [renderSwatchData, setRenderSwatchData] = useState<ImageData | null>(null);
  const [previewSwatchData, setPreviewSwatchData] = useState<ImageData | null>(null);
  const [paletteData, setPaletteData] = useState<ImageData | null>(null);
  const cellCanvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const tintPreviewRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const selectedPreviewRef = useRef<HTMLCanvasElement>(null);

  if (typeof palette === 'string') {
    palette = palette.GetHashKey();
  }

  const paletteName = ColorPaletteNames[palette >>> 0];
  const paletteCount = paletteData ? paletteData.height : 0;
  const activeSwatch = useFallbackSwatch ? FALLBACK_SWATCH : (swatchTexture || FALLBACK_SWATCH);
  const previewSwatchName = swatchTexture || FALLBACK_SWATCH;

  // Load the swatch used for grid/tint slot rendering
  useEffect(() => {
    setRenderSwatchData(null);

    loadImageData(swatchUrl(activeSwatch))
      .then(setRenderSwatchData)
      .catch((err) => console.error('TintSelector swatch load error:', err));
  }, [activeSwatch]);

  // Load the item swatch for the selected preview (always uses real swatch)
  useEffect(() => {
    setPreviewSwatchData(null);

    loadImageData(swatchUrl(previewSwatchName))
      .then(setPreviewSwatchData)
      .catch((err) => console.error('TintSelector preview swatch load error:', err));
  }, [previewSwatchName]);

  // Load palette texture
  useEffect(() => {
    setPaletteData(null);
    if (!paletteName) return;

    loadImageData(paletteUrl(paletteName))
      .then(setPaletteData)
      .catch((err) => console.error('TintSelector palette load error:', err));
  }, [paletteName]);

  // Pre-downsample for grid cells
  const gridSwatch = useMemo((): ImageData | null => {
    if (!renderSwatchData) return null;
    return downsampleSwatch(renderSwatchData, GRID_CELL_SIZE, activeSwatch);
  }, [renderSwatchData, activeSwatch]);

  // Pre-downsample for tint slot previews
  const previewSwatch = useMemo((): ImageData | null => {
    if (!renderSwatchData) return null;
    return downsampleSwatch(renderSwatchData, PREVIEW_SIZE, `${activeSwatch}-preview`);
  }, [renderSwatchData, activeSwatch]);

  // Render tint slot previews
  useEffect(() => {
    if (!previewSwatch || !paletteData) return;

    const output = renderTinted(previewSwatch, paletteData, tint0, tint1, tint2);

    for (let slot = 0; slot < 3; slot++) {
      const canvas = tintPreviewRefs.current.get(slot);
      if (!canvas) continue;

      canvas.width = output.width;
      canvas.height = output.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      ctx.putImageData(output, 0, 0);
    }
  }, [previewSwatch, paletteData, tint0, tint1, tint2]);

  // Render selected tint preview (always uses real item swatch at full res)
  useEffect(() => {
    const canvas = selectedPreviewRef.current;
    if (!canvas || !previewSwatchData || !paletteData) return;

    const output = renderTinted(previewSwatchData, paletteData, tint0, tint1, tint2);
    canvas.width = output.width;
    canvas.height = output.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(output, 0, 0);
  }, [previewSwatchData, paletteData, tint0, tint1, tint2]);

  // Render dye grid cells in batches
  useEffect(() => {
    if (!gridSwatch || !paletteData || paletteCount === 0) return;

    let batchStart = 0;
    let rafId: number;

    function renderBatch(): void {
      if (!gridSwatch || !paletteData) return;
      const end = Math.min(batchStart + BATCH_SIZE, paletteCount);

      for (let row = batchStart; row < end; row++) {
        const canvas = cellCanvasRefs.current.get(row);
        if (!canvas) continue;

        let t0Val = tint0;
        let t1Val = tint1;
        let t2Val = tint2;

        if (activeTint === 0) t0Val = row;
        else if (activeTint === 1) t1Val = row;
        else t2Val = row;

        const output = renderTinted(gridSwatch, paletteData, t0Val, t1Val, t2Val);
        canvas.width = output.width;
        canvas.height = output.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        ctx.putImageData(output, 0, 0);
      }

      batchStart = end;
      if (batchStart < paletteCount) {
        rafId = requestAnimationFrame(renderBatch);
      }
    }

    rafId = requestAnimationFrame(renderBatch);
    return (): void => cancelAnimationFrame(rafId);
  }, [gridSwatch, paletteData, tint0, tint1, tint2, activeTint, paletteCount]);

  const setCellRef = useCallback(
    (row: number) => (el: HTMLCanvasElement | null): void => {
      if (el) cellCanvasRefs.current.set(row, el);
      else cellCanvasRefs.current.delete(row);
    },
    [],
  );

  const setTintPreviewRef = useCallback(
    (slot: number) => (el: HTMLCanvasElement | null): void => {
      if (el) tintPreviewRefs.current.set(slot, el);
      else tintPreviewRefs.current.delete(slot);
    },
    [],
  );

  const removePalette = (): void => {
    onChange(identifier, { palette: -1, tint0, tint1, tint2 });
  };

  const setPalette = (name: Customization.PaletteNames): void => {
    onChange(identifier, { palette: ColorPalettes[name].hash, tint0, tint1, tint2 });
  };

  const hasGrid = !!gridSwatch && !!paletteData;
  const hasPreview = !!previewSwatchData && !!paletteData;

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
              const slotClass = [styles.slotGreen, styles.slotRed, styles.slotBlue][slot];
              return (
                <button
                  key={slot}
                  className={conditionalClass([styles.tintSlot, slotClass], { [styles.active]: activeTint === slot })}
                  onClick={() => setActiveTint(slot)}
                >
                  {hasGrid ? (
                    <canvas
                      ref={setTintPreviewRef(slot)}
                      className={styles.tintPreview}
                    />
                  ) : (
                    <div className={styles.tintPreviewFallback} />
                  )}
                  Tint {slot}
                </button>
              );
            })}

            {hasPreview && (
              <div className={styles.selectedPreview}>
                <canvas
                  ref={selectedPreviewRef}
                  className={styles.selectedPreviewCanvas}
                />
              </div>
            )}
          </div>

          <div className={styles.dyeGrid}>
            {new Array(paletteCount).fill(0).map((_, i) => {
              const isTint0 = tint0 === i;
              const isTint1 = tint1 === i;
              const isTint2 = tint2 === i;
              const isActive = [tint0, tint1, tint2][activeTint] === i;

              let borderClass = '';
              if (isActive) {
                borderClass = [styles.usedGreen, styles.usedRed, styles.usedBlue][activeTint];
              } else if (isTint0) {
                borderClass = styles.usedGreen;
              } else if (isTint1) {
                borderClass = styles.usedRed;
              } else if (isTint2) {
                borderClass = styles.usedBlue;
              }

              return (
                <div
                  key={i}
                  className={conditionalClass(styles.dyeThumb, {
                    [borderClass]: !!borderClass,
                    [styles.selected]: isActive,
                  })}
                  onClick={() => {
                    if (activeTint === 0) {
                      onChange(identifier, { palette, tint0: i, tint1, tint2 });
                    } else if (activeTint === 1) {
                      onChange(identifier, { palette, tint0, tint1: i, tint2 });
                    } else {
                      onChange(identifier, { palette, tint0, tint1, tint2: i });
                    }
                  }}
                >
                  {hasGrid ? (
                    <canvas
                      ref={setCellRef(i)}
                      className={styles.dyeCanvas}
                    />
                  ) : (
                    <div className={styles.dyeFallback} />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
