import { useMemo } from 'react';

import { conditionalClass } from '@uiLib/helpers';

import styles from './style-color-selector.module.scss';
import TintSwatches from './tint-swatches';

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
  onCustomClick?: () => void;
  isCustomSelected?: boolean;
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
  onCustomClick,
  isCustomSelected = false,
}: StyleColorSelectorProps) {
  const flattenedOptions = useMemo((): FlattenedOption[] => {
    const options: FlattenedOption[] = [];

    console.log(components);

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
              {hasPalette(component) ? (
                <TintSwatches
                  palette={component.palette}
                  tint0={component.tint0}
                  tint1={component.tint1}
                  tint2={component.tint2}
                  swatchTexture={component.swatchTexture}
                />
              ) : (
                <div className={styles.fallback} />
              )}
            </div>
          ))}
          {onCustomClick && (
            <div
              className={conditionalClass([styles.optionCell, styles.customCell], {
                [styles.selected]: isCustomSelected,
              })}
              onClick={onCustomClick}
            >
              <div className={styles.customIcon}>?</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
