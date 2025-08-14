import TrashAlt from '@fa/5/solid/trash-alt.svg';
import { Component } from 'react';

import { emitClient } from '@lib/ui';

import { uiSize } from '@uiLib/helpers';

import RangeSlider from '../components/RangeSlider';
import TintSelector from './TintSelector';
import styles from './styles.module.scss';

interface Props {
  onChange?: (layers: UI.Customization.LayerData[]) => void;
  overlays: Record<string, UI.Customization.OverlayJson>;
  layers?: UI.Customization.LayerData[];
}

interface State {
  active: boolean;
  layers: UI.Customization.LayerData[];
}

export default class OverlaySelector extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      active: false,
      layers: this.props.layers || [],
    };
  }

  getUniqueId() {
    while (true) {
      const uid = Math.random().toString(36).substring(2, 15);
      if (!this.state.layers.some((layer) => layer.uid === uid)) {
        return uid;
      }
      console.warn('Duplicate UID found, generating a new one.');
    }
  }

  addLayer() {
    console.log(this.props.overlays);
    const layers = [...this.state.layers];

    layers.push({
      uid: this.getUniqueId(),
      id: '',
      opacity: 1.0,
    });

    this.setState({ layers });
  }

  setLayerId(uid: string, id: string) {
    const layers = [...this.state.layers];
    const index = layers.findIndex((layer) => layer.uid === uid);
    if (index === -1) {
      console.error('Layer not found:', uid);
      return;
    }
    layers[index].id = id;

    this.setState({ layers });
    if (this.props.onChange) {
      this.props.onChange(layers);
    }
  }

  setLayerOpacity(uid: string, value: number) {
    const layers = [...this.state.layers];
    const index = layers.findIndex((layer) => layer.uid === uid);
    if (index === -1) {
      console.error('Layer not found:', uid);
      return;
    }
    layers[index].opacity = value;

    this.setState({ layers });
    if (this.props.onChange) {
      this.props.onChange(layers);
    }
  }

  setLayerPalette(uid: string, palette: Customization.Palette) {
    const layers = [...this.state.layers];
    const index = layers.findIndex((layer) => layer.uid === uid);
    if (index === -1) {
      console.error('Layer not found:', uid);
      return;
    }
    layers[index].palette = palette;

    this.setState({ layers });
    if (this.props.onChange) {
      this.props.onChange(layers);
    }
  }

  canUsePalette(uid: string): boolean {
    const layer = this.state.layers.find((layer) => layer.uid === uid);
    if (!layer) {
      console.error('Layer not found:', uid);
      return false;
    }
    for (const overlay of Object.entries(this.props.overlays)) {
      const [_category, overlayData] = overlay;
      if (overlayData.canUsePalette && overlayData.components.some((comp) => comp.id === layer.id)) {
        return true;
      }
    }
    return false;
  }

  deleteLayer(uid: string) {
    const layers = [...this.state.layers];
    const index = layers.findIndex((layer) => layer.uid === uid);
    if (index === -1) {
      console.error('Layer not found:', uid);
      return;
    }
    layers.splice(index, 1);
    this.setState({ layers });
    if (this.props.onChange) {
      this.props.onChange(layers);
    }
  }

  render() {
    return (
      <div className={styles.osContainer}>
        {this.state.layers.map((layer, index) => (
          <div key={layer.uid} className={styles.osLayer}>
            <div className={styles.osRow}>
              <div>
                Layer Id: {index} | {layer.uid}
              </div>
              <TrashAlt
                width={uiSize(16)}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  this.deleteLayer(layer.uid);
                }}
              />
            </div>

            <div className={styles.osRow}>
              <div>Texture:</div>
              <select
                onChange={(e) => {
                  this.setLayerId(layer.uid, e.target.value);
                }}
                data-layer={index}
              >
                <option>Choose Layer Texture</option>
                {Object.entries(this.props.overlays).map(([category, overlays]) => (
                  <optgroup key={category} label={category}>
                    {overlays.components.map((overlay, index) => (
                      <option key={index} value={overlay.id} selected={overlay.id === layer.id}>
                        {overlay.id}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <RangeSlider
              label="Opacity"
              min={0}
              max={1}
              step={0.01}
              defaultValue={layer.opacity}
              className="layer"
              onChange={(value) => {
                this.setLayerOpacity(layer.uid, value);
              }}
            />
            {this.canUsePalette(layer.uid) && (
              <TintSelector
                onChange={(uid, palette) => {
                  this.setLayerPalette(uid, palette);
                }}
                identifier={layer.uid}
                palette={layer.palette?.palette || 0}
                tint0={layer.palette?.tint0 || 0}
                tint1={layer.palette?.tint1 || 0}
                tint2={layer.palette?.tint2 || 0}
              />
            )}
          </div>
        ))}
        <button className={styles.osAddLayer} onClick={this.addLayer.bind(this)}>
          Add Layer
        </button>
      </div>
    );
  }
}
