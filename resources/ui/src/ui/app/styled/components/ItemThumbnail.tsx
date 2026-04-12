import { useRef, useState } from 'react';

import PlaceholderSvg from './PlaceholderSvg';
import TintSwatches from './TintSwatches';

const CDN_DRAWABLES = 'https://p--v.b-cdn.net/drawables';
const CDN_INVENTORY = 'https://p--v.b-cdn.net/inventory';

function drawableUrl(hash: number): string {
  return `${CDN_DRAWABLES}/${hash >>> 0}.png`;
}

function inventoryImageUrl(image: string): string {
  return `${CDN_INVENTORY}/${image}.png`;
}

interface DrawableMapEntry {
  drawable: number;
  swatchTexture: string;
}

interface ItemThumbnailProps {
  /** Static inventory image name (e.g., 'dollar', 'knife') */
  image?: string;
  /** Fallback text when no image loads */
  name?: string;
  /** Drawable map entry for clothing items — if provided, uses drawable rendering */
  drawableData?: DrawableMapEntry;
  /** Palette + tint data — if provided with drawableData, renders tinted */
  palette?: string | number;
  tint0?: number;
  tint1?: number;
  tint2?: number;
  /** Canvas render size for tinted items */
  displaySize?: number;
}

export default function ItemThumbnail({
  image,
  name,
  drawableData,
  palette,
  tint0,
  tint1,
  tint2,
  displaySize = 96,
}: ItemThumbnailProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const failedRef = useRef(false);

  // Tinted drawable rendering (clothing with palette data)
  if (drawableData && palette && tint0 !== undefined && tint1 !== undefined && tint2 !== undefined) {
    return (
      <TintSwatches
        palette={palette}
        tint0={tint0}
        tint1={tint1}
        tint2={tint2}
        swatchTexture={drawableData.swatchTexture}
        imageUrl={drawableUrl(drawableData.drawable)}
        displaySize={displaySize}
        onRenderError={() => setImgFailed(true)}
      />
    );
  }

  // Plain drawable rendering (clothing without tint data)
  if (drawableData && !imgFailed) {
    return (
      <img
        src={drawableUrl(drawableData.drawable)}
        alt={name}
        onError={() => {
          failedRef.current = true;
          setImgFailed(true);
        }}
      />
    );
  }

  // Static inventory image
  if (image && !imgFailed) {
    return (
      <img
        src={inventoryImageUrl(image)}
        alt={name}
        onError={() => {
          failedRef.current = true;
          setImgFailed(true);
        }}
      />
    );
  }

  // Text fallback
  return <PlaceholderSvg text={name} />;
}

export type { ItemThumbnailProps, DrawableMapEntry };
