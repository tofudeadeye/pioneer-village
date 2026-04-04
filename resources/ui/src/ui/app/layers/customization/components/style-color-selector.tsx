import { useCallback, useMemo, useState } from 'react';

import { conditionalClass } from '@uiLib/helpers';

import styles from './style-color-selector.module.scss';
import TintSwatches from './tint-swatches';

function getDrawableImageUrl(drawableHash: string | number): string {
  if (typeof drawableHash === 'string') {
    drawableHash = GetHashKey(drawableHash);
  }
  const unsignedHash = drawableHash >>> 0;
  return `https://p--v.b-cdn.net/drawables/${unsignedHash}.png`;
}

interface OptionThumbnailProps {
  component: UI.Customization.StyleColorComponentData;
  hasPalette: boolean;
}

function OptionThumbnail({ component, hasPalette }: OptionThumbnailProps): React.ReactNode {
  const [imgFailed, setImgFailed] = useState(false);
  const imageUrl = getDrawableImageUrl(component.drawable);
  const handleImgError = useCallback((): void => setImgFailed(true), []);

  if (!component.tintable) {
    if (!imgFailed) {
      return <img className={styles.optionImage} src={imageUrl} alt="" onError={handleImgError} />;
    }
    return <div className={styles.fallback} />;
  }

  if (hasPalette && 'palette' in component) {
    if (!imgFailed) {
      return (
        <TintSwatches
          palette={component.palette}
          tint0={component.tint0}
          tint1={component.tint1}
          tint2={component.tint2}
          swatchTexture={component.swatchTexture}
          imageUrl={imageUrl}
          onRenderError={handleImgError}
        />
      );
    }
    return (
      <TintSwatches
        palette={component.palette}
        tint0={component.tint0}
        tint1={component.tint1}
        tint2={component.tint2}
        swatchTexture={component.swatchTexture}
      />
    );
  }

  return <div className={styles.fallback} />;
}

interface StyleColorSelectorProps {
  label: string;
  components: Array<{
    name: string;
    components: UI.Customization.StyleColorComponentData[];
  }>;
  gender: 'male' | 'female';
  style: number;
  option: number;
  onChange: (style: number, option: number) => void;
}

interface FlattenedOption {
  styleIndex: number;
  optionIndex: number;
  component: UI.Customization.StyleColorComponentData;
}

export default function StyleColorSelector({
  label,
  components,
  gender,
  style,
  option,
  onChange,
}: StyleColorSelectorProps) {
  const flattenedOptions = useMemo((): FlattenedOption[] => {
    const options: FlattenedOption[] = [];

    // console.log(components);

    components.forEach((styleGroup, styleIndex) => {
      styleGroup.components.forEach((component, optionIndex) => {
        if (gender === 'male' && component.type === '1') return;
        if (gender === 'female' && component.type === '0') return;

        options.push({
          styleIndex,
          optionIndex,
          component,
        });
      });
    });

    return options;
  }, [components, gender]);

  const hasPalette = (
    component: UI.Customization.StyleColorComponentData,
  ): component is UI.Customization.StyleColorComponentData & {
    palette: string | number;
    tint0: number;
    tint1: number;
    tint2: number;
  } => {
    if (!('palette' in component) || typeof component.palette === 'undefined' || component.palette === '') {
      return false;
    }
    const paletteNum = typeof component.palette === 'number' ? component.palette : component.palette.GetHashKey();
    return paletteNum !== -1 && paletteNum !== 0;
  };

  const isSelected = (styleIndex: number, optionIndex: number): boolean => {
    return styleIndex === style && optionIndex === option;
  };

  const handleSelect = (styleIndex: number, optionIndex: number): void => {
    console.log('Selected style:', styleIndex, 'option:', optionIndex);
    onChange(styleIndex, optionIndex);
  };

  return (
    <div className={styles.container}>
      <div className={styles.label}>{label}</div>
      {flattenedOptions.length === 0 ? (
        <div className={styles.empty}>No options available</div>
      ) : (
        <div className={styles.optionGrid}>
          {flattenedOptions.map(({ styleIndex, optionIndex, component }, index) => (
            <div
              key={index}
              className={conditionalClass(styles.optionCell, {
                [styles.selected]: isSelected(styleIndex, optionIndex),
              })}
              onClick={() => handleSelect(styleIndex, optionIndex)}
            >
              <OptionThumbnail component={component} hasPalette={hasPalette(component)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
