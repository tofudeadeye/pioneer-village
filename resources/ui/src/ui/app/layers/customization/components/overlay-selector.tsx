import TrashAlt from '@fa/5/solid/trash-alt.svg';
import { useCallback, useState } from 'react';

import { uiSize } from '@uiLib/helpers';

import styles from './overlay-selector.module.scss';
import Slider from './slider';
import TintSelector from './tint-selector';

interface OverlaySelectorProps {
  overlays: Record<string, UI.Customization.OverlayJson>;
  layers: UI.Customization.LayerData[];
  onChange: (layers: UI.Customization.LayerData[]) => void;
}

function generateUid(existing: UI.Customization.LayerData[]): string {
  let uid = crypto.randomUUID().slice(0, 13);
  while (existing.some((layer) => layer.uid === uid)) {
    uid = crypto.randomUUID().slice(0, 13);
  }
  return uid;
}

function canUsePalette(overlays: Record<string, UI.Customization.OverlayJson>, layerId: string): boolean {
  for (const overlayData of Object.values(overlays)) {
    if (overlayData.canUsePalette && overlayData.components.some((comp) => comp.id === layerId)) {
      return true;
    }
  }
  return false;
}

export default function OverlaySelector({ overlays, layers, onChange }: OverlaySelectorProps) {
  const updateLayer = useCallback(
    (uid: string, updater: (layer: UI.Customization.LayerData) => UI.Customization.LayerData): void => {
      const next = layers.map((layer) => (layer.uid === uid ? updater({ ...layer }) : layer));
      onChange(next);
    },
    [layers, onChange],
  );

  const addLayer = useCallback((): void => {
    const newLayer: UI.Customization.LayerData = {
      uid: generateUid(layers),
      id: '',
      opacity: 1.0,
    };
    onChange([...layers, newLayer]);
  }, [layers, onChange]);

  const deleteLayer = useCallback(
    (uid: string): void => {
      onChange(layers.filter((layer) => layer.uid !== uid));
    },
    [layers, onChange],
  );

  const setLayerId = useCallback(
    (uid: string, id: string): void => {
      updateLayer(uid, (layer) => ({ ...layer, id }));
    },
    [updateLayer],
  );

  const setLayerOpacity = useCallback(
    (uid: string, opacity: number): void => {
      updateLayer(uid, (layer) => ({ ...layer, opacity }));
    },
    [updateLayer],
  );

  const setLayerPalette = useCallback(
    (uid: string, palette: Customization.Palette): void => {
      updateLayer(uid, (layer) => ({ ...layer, palette }));
    },
    [updateLayer],
  );

  return (
    <div className={styles.container}>
      {layers.map((layer, index) => (
        <div key={layer.uid} className={styles.layer}>
          <div className={styles.selectRow}>
            <select className={styles.select} value={layer.id} onChange={(e) => setLayerId(layer.uid, e.target.value)}>
              <option value="">Choose Layer Texture</option>
              {Object.entries(overlays).map(([category, overlayData]) => (
                <optgroup key={category} label={category}>
                  {overlayData.components.map((comp) => (
                    <option key={String(comp.id)} value={String(comp.id)}>
                      {comp.name || String(comp.id)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <button className={styles.removeButton} onClick={() => deleteLayer(layer.uid)}>
              <TrashAlt width={uiSize(14)} />
            </button>
          </div>

          <div className={styles.opacityWrapper}>
            <Slider
              label="Opacity"
              min={0}
              max={1}
              step={0.01}
              value={layer.opacity}
              onChange={(value) => setLayerOpacity(layer.uid, value)}
            />
          </div>

          {canUsePalette(overlays, layer.id) && (
            <TintSelector
              onChange={(uid, palette) => setLayerPalette(uid, palette)}
              identifier={layer.uid}
              palette={layer.palette?.palette || 0}
              tint0={layer.palette?.tint0 || 0}
              tint1={layer.palette?.tint1 || 0}
              tint2={layer.palette?.tint2 || 0}
            />
          )}
        </div>
      ))}

      <button className={styles.addButton} onClick={addLayer}>
        + Add Layer
      </button>
    </div>
  );
}
