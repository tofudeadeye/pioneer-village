import { useEffect, useRef } from 'react';

import { ColorPaletteNames } from '@lib/shared/color-palettes';

import styles from './tint-swatches.module.scss';
import { downsampleSwatch, FALLBACK_SWATCH, loadImageData, paletteUrl, renderTinted, swatchUrl } from './tint-render';

const SWATCH_DISPLAY_SIZE = 64;

interface TintSwatchesProps {
  palette: string | number;
  tint0: number;
  tint1: number;
  tint2: number;
  swatchTexture?: string;
}

export default function TintSwatches({ palette, tint0, tint1, tint2, swatchTexture }: TintSwatchesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paletteName = typeof palette === 'string' ? palette : ColorPaletteNames[palette >>> 0];
  const resolvedSwatch = swatchTexture || FALLBACK_SWATCH;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !paletteName) return;

    let cancelled = false;

    Promise.all([
      loadImageData(swatchUrl(resolvedSwatch)),
      loadImageData(paletteUrl(paletteName)),
    ]).then(([swatchData, paletteData]) => {
      if (cancelled) return;

      const small = downsampleSwatch(swatchData, SWATCH_DISPLAY_SIZE, resolvedSwatch);
      const output = renderTinted(small, paletteData, tint0, tint1, tint2);
      canvas.width = output.width;
      canvas.height = output.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.putImageData(output, 0, 0);
    }).catch((err) => {
      if (!cancelled) console.error('TintSwatches render error:', err);
    });

    return (): void => { cancelled = true; };
  }, [paletteName, resolvedSwatch, tint0, tint1, tint2]);

  if (!paletteName) {
    return null;
  }

  return (
    <div className={styles.tintSwatches}>
      <canvas
        ref={canvasRef}
        className={`${styles.tintSwatch} ${styles.first}`}
      />
    </div>
  );
}
