import { useEffect, useRef } from 'react';

import { ColorPaletteNames } from '@lib/shared/color-palettes';

import { FALLBACK_SWATCH, downsampleSwatch, loadImageData, paletteUrl, renderTinted, swatchUrl } from './tint-render';

const SWATCH_DISPLAY_SIZE = 96;

interface TintSwatchesProps {
  palette: string | number;
  tint0: number;
  tint1: number;
  tint2: number;
  swatchTexture?: string;
  imageUrl?: string;
  displaySize?: number;
  onRenderError?: () => void;
}

export default function TintSwatches({
  palette,
  tint0,
  tint1,
  tint2,
  swatchTexture,
  imageUrl,
  displaySize = SWATCH_DISPLAY_SIZE,
  onRenderError,
}: TintSwatchesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paletteName = typeof palette === 'string' ? palette : ColorPaletteNames[palette >>> 0];
  const resolvedSwatch = swatchTexture || FALLBACK_SWATCH;
  const swatchSrc = imageUrl || swatchUrl(resolvedSwatch);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !paletteName) return;

    let cancelled = false;

    Promise.all([loadImageData(swatchSrc), loadImageData(paletteUrl(paletteName))])
      .then(([swatchData, paletteData]) => {
        if (cancelled) return;

        const small = downsampleSwatch(swatchData, displaySize, swatchSrc);
        const output = renderTinted(small, paletteData, tint0, tint1, tint2);
        canvas.width = output.width;
        canvas.height = output.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.putImageData(output, 0, 0);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('TintSwatches render error:', err);
          onRenderError?.();
        }
      });

    return (): void => {
      cancelled = true;
    };
  }, [paletteName, swatchSrc, tint0, tint1, tint2, displaySize]);

  if (!paletteName) {
    return null;
  }

  return <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }} />;
}

export type { TintSwatchesProps };
