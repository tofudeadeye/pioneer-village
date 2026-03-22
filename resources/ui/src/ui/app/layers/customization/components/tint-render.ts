/**
 * Palette tint rendering utilities.
 *
 * RDR2 swatch textures encode blend weights in their RGB channels:
 *   G channel -> selects a column from palette row tint0 (base color)
 *   R channel -> lerps toward palette row tint1
 *   B channel -> lerps toward palette row tint2
 */

// ---------------------------------------------------------------------------
// Hardcoded asset lists (local PNGs under resources/ui/assets/)
// ---------------------------------------------------------------------------

export const PALETTE_NAMES = [
  'metaped_tint_animal',
  'metaped_tint_combined',
  'metaped_tint_combined_leather',
  'metaped_tint_combined_leather1',
  'metaped_tint_combined_leather2',
  'metaped_tint_combined_leather3',
  'metaped_tint_combined_leather4',
  'metaped_tint_combined_leather5',
  'metaped_tint_combined_leather6',
  'metaped_tint_eye',
  'metaped_tint_eyes_ui',
  'metaped_tint_generic',
  'metaped_tint_generic_clean',
  'metaped_tint_generic_weathered',
  'metaped_tint_generic_worn',
  'metaped_tint_hair',
  'metaped_tint_hair1',
  'metaped_tint_hair2',
  'metaped_tint_hair_bed',
  'metaped_tint_hair_ui',
  'metaped_tint_hat',
  'metaped_tint_hat_clean',
  'metaped_tint_hat_weathered',
  'metaped_tint_hat_worn',
  'metaped_tint_horse',
  'metaped_tint_horse_001',
  'metaped_tint_horse_combined',
  'metaped_tint_horse_leather',
  'metaped_tint_horse_leather_001',
  'metaped_tint_leather',
  'metaped_tint_makeup',
  'metaped_tint_mpadv',
  'metaped_tint_si_template',
  'metaped_tint_skirt_clean',
  'metaped_tint_skirt_weathered',
  'metaped_tint_skirt_worn',
  'metaped_tint_teeth',
  'weapon_tint_wood',
  'weapon_tint_wood_working',
] as const;

export const SWATCH_NAMES = [
  'uisw_canvas_000',
  'uisw_canvas_ck000',
  'uisw_canvas_ck001',
  'uisw_canvas_ck002',
  'uisw_canvas_ck003',
  'uisw_canvas_sv000',
  'uisw_canvas_sv001',
  'uisw_canvas_sv003',
  'uisw_cotton_000',
  'uisw_cotton_ck000',
  'uisw_cotton_ck001',
  'uisw_cotton_ck002',
  'uisw_cotton_ck003',
  'uisw_cotton_pd000',
  'uisw_cotton_pt000',
  'uisw_cotton_pt001',
  'uisw_cotton_pt002',
  'uisw_cotton_pt003',
  'uisw_cotton_pt004',
  'uisw_cotton_sv000',
  'uisw_cotton_sv001',
  'uisw_cotton_sv003',
  'uisw_denim_000',
  'uisw_denim_ck000',
  'uisw_denim_ck001',
  'uisw_denim_ck002',
  'uisw_denim_ck003',
  'uisw_denim_sv000',
  'uisw_denim_sv001',
  'uisw_denim_sv003',
  'uisw_flat_ck000',
  'uisw_horse_000',
  'uisw_horse_cotton_new000',
  'uisw_horse_cotton_pt001',
  'uisw_horse_cotton_pt002',
  'uisw_horse_cotton_pt003',
  'uisw_horse_cotton_pt004',
  'uisw_horse_cotton_pt005',
  'uisw_horse_cotton_pt006',
  'uisw_horse_cotton_pt007',
  'uisw_horse_cotton_pt008',
  'uisw_horse_cotton_pt009',
  'uisw_horse_cotton_pt010',
  'uisw_horse_cotton_pt011',
  'uisw_horse_cotton_pt012',
  'uisw_horse_cotton_used000',
  'uisw_horse_hair_000',
  'uisw_horse_hair_001',
  'uisw_horse_hair_002',
  'uisw_horse_hair_003',
  'uisw_horse_hair_004',
  'uisw_horse_leather_new000',
  'uisw_horse_leather_used000',
  'uisw_horse_mask_hm000',
  'uisw_horse_mask_hm001',
  'uisw_horse_mask_hm002',
  'uisw_horse_metal_000',
  'uisw_horse_trapperblanket_001',
  'uisw_horse_trapperblanket_002',
  'uisw_horse_trapperblanket_003',
  'uisw_horse_trapperblanket_004',
  'uisw_horse_trapperblanket_005',
  'uisw_leather_000',
  'uisw_leather_cow_000',
  'uisw_leather_pt000',
  'uisw_leather_pt001',
  'uisw_leather_pt002',
  'uisw_eyes_000',
  'uisw_hair_000',
  'uisw_skin_000',
] as const;

// ---------------------------------------------------------------------------
// Asset URL helpers
// ---------------------------------------------------------------------------

export const FALLBACK_SWATCH = 'uisw_cotton_pt002';

export function paletteUrl(name: string): string {
  return `assets/palettes/${name}.png`;
}

export function swatchUrl(name: string): string {
  return `assets/swatches/${name}.png`;
}

// ---------------------------------------------------------------------------
// Image loading (PNG only — cached)
// ---------------------------------------------------------------------------

const imageDataCache = new Map<string, Promise<ImageData>>();

export function loadImageData(url: string): Promise<ImageData> {
  const cached = imageDataCache.get(url);
  if (cached) return cached;

  const promise = new Promise<ImageData>((resolve, reject) => {
    const img = new Image();
    img.onload = (): void => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, c.width, c.height));
    };
    img.onerror = reject;
    img.src = url;
  });

  imageDataCache.set(url, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// Swatch downsampling (cached per swatch URL + target size)
// ---------------------------------------------------------------------------

const downsampleCache = new Map<string, ImageData>();

export function downsampleSwatch(swatch: ImageData, targetSize: number, cacheKey?: string): ImageData {
  if (swatch.width <= targetSize && swatch.height <= targetSize) return swatch;

  const fullKey = cacheKey ? `${cacheKey}@${targetSize}` : undefined;
  if (fullKey) {
    const cached = downsampleCache.get(fullKey);
    if (cached) return cached;
  }

  const sw = swatch.width;
  const sh = swatch.height;
  const sd = swatch.data;
  const tw = targetSize;
  const th = targetSize;
  const out = new ImageData(tw, th);
  const od = out.data;
  const scaleX = sw / tw;
  const scaleY = sh / th;

  for (let y = 0; y < th; y++) {
    for (let x = 0; x < tw; x++) {
      const x0 = Math.floor(x * scaleX);
      const y0 = Math.floor(y * scaleY);
      const x1 = Math.min(Math.floor((x + 1) * scaleX), sw);
      const y1 = Math.min(Math.floor((y + 1) * scaleY), sh);
      let sumR = 0,
        sumG = 0,
        sumB = 0,
        sumA = 0,
        count = 0;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const si = (sy * sw + sx) * 4;
          sumR += sd[si];
          sumG += sd[si + 1];
          sumB += sd[si + 2];
          sumA += sd[si + 3];
          count++;
        }
      }
      const di = (y * tw + x) * 4;
      od[di] = Math.round(sumR / count);
      od[di + 1] = Math.round(sumG / count);
      od[di + 2] = Math.round(sumB / count);
      od[di + 3] = Math.round(sumA / count);
    }
  }

  if (fullKey) downsampleCache.set(fullKey, out);
  return out;
}

// ---------------------------------------------------------------------------
// Tint rendering
// ---------------------------------------------------------------------------

function mapValueToColumn(value: number, paletteWidth: number): number {
  return Math.round(((value - 1) / 254) * (paletteWidth - 1));
}

export function renderTinted(
  swatch: ImageData,
  palette: ImageData,
  tint0: number,
  tint1: number,
  tint2: number,
): ImageData {
  const sw = swatch.width;
  const sh = swatch.height;
  const src = swatch.data;
  const pw = palette.width;
  const pd = palette.data;

  const output = new ImageData(sw, sh);
  const dst = output.data;

  for (let i = 0; i < sw * sh; i++) {
    const si = i * 4;
    const srcR = src[si];
    const srcG = src[si + 1];
    const srcB = src[si + 2];
    const srcA = src[si + 3];

    const col = mapValueToColumn(srcG, pw);

    // Sample tint0 row at G's column — base color
    const g0 = (tint0 * pw + col) * 4;
    let outR = pd[g0];
    let outG = pd[g0 + 1];
    let outB = pd[g0 + 2];

    // Lerp toward tint1 by R/255
    const rF = srcR / 255;
    if (rF > 0) {
      const r1 = (tint1 * pw + col) * 4;
      outR = outR * (1 - rF) + pd[r1] * rF;
      outG = outG * (1 - rF) + pd[r1 + 1] * rF;
      outB = outB * (1 - rF) + pd[r1 + 2] * rF;
    }

    // Lerp toward tint2 by B/255
    const bF = srcB / 255;
    if (bF > 0) {
      const b2 = (tint2 * pw + col) * 4;
      outR = outR * (1 - bF) + pd[b2] * bF;
      outG = outG * (1 - bF) + pd[b2 + 1] * bF;
      outB = outB * (1 - bF) + pd[b2 + 2] * bF;
    }

    dst[si] = Math.round(outR);
    dst[si + 1] = Math.round(outG);
    dst[si + 2] = Math.round(outB);
    dst[si + 3] = srcA;
  }

  return output;
}
