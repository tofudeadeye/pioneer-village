import { useCallback, useMemo, useState } from 'react';

import { conditionalClass } from '@uiLib/helpers';

import styles from './category-browser.module.scss';
import StyleColorSelector from './style-color-selector';
import TintSelector from './tint-selector';
import TintSwatches from './tint-swatches';

function toTitleCase(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getDrawableImageUrl(drawableHash: string | number): string {
  if (typeof drawableHash === 'string') {
    drawableHash = GetHashKey(drawableHash);
  }
  const unsignedHash = drawableHash >>> 0;
  return `https://p--v.b-cdn.net/drawables/${unsignedHash}.png`;
}

type ComponentData = UI.Customization.ComponentJsonData | UI.Customization.ComponentJsonDataPalette;

function getFirstValidComponent(
  componentsData: CategoryBrowserProps['componentsData'],
  category: string,
  gender: 'male' | 'female',
): ComponentData | null {
  const categoryStyles = componentsData[category];
  if (!categoryStyles) return null;
  for (const categoryStyle of categoryStyles) {
    for (const comp of categoryStyle.components) {
      if (gender === 'male' && comp.type === '1') continue;
      if (gender === 'female' && comp.type === '0') continue;
      return comp;
    }
  }
  return null;
}

function isTintable(comp: ComponentData): comp is UI.Customization.ComponentJsonDataPalette {
  if (!('palette' in comp) || !comp.palette || comp.palette === '') return false;
  const paletteNum = typeof comp.palette === 'string' ? GetHashKey(comp.palette) : comp.palette;
  return paletteNum !== -1 && paletteNum !== 0;
}

interface ComponentThumbnailProps {
  comp: ComponentData;
  className: string;
  onError?: () => void;
}

function ComponentThumbnail({ comp, className, onError }: ComponentThumbnailProps): React.ReactNode {
  const [imgFailed, setImgFailed] = useState(false);
  const imageUrl = getDrawableImageUrl(comp.drawable);
  const handleImgError = useCallback((): void => {
    setImgFailed(true);
    onError?.();
  }, [onError]);

  if (isTintable(comp)) {
    if (!imgFailed) {
      return (
        <TintSwatches
          palette={comp.palette}
          tint0={comp.tint0}
          tint1={comp.tint1}
          tint2={comp.tint2}
          swatchTexture={comp.swatchTexture}
          imageUrl={imageUrl}
          displaySize={128}
          onRenderError={handleImgError}
        />
      );
    }
    return (
      <TintSwatches
        palette={comp.palette}
        tint0={comp.tint0}
        tint1={comp.tint1}
        tint2={comp.tint2}
        swatchTexture={comp.swatchTexture}
      />
    );
  }

  if (!imgFailed) {
    return <img className={className} src={imageUrl} alt="" onError={handleImgError} />;
  }

  return null;
}

type NavLevel = 'categories' | 'items' | 'styles';

interface CategoryBrowserProps {
  rootLabel: string;
  categories: string[];
  gender: 'male' | 'female';
  currentComponents: Record<string, { style: number; option: number }>;
  componentsData: Record<
    string,
    Array<{
      name: string;
      components: Array<UI.Customization.ComponentJsonData | UI.Customization.ComponentJsonDataPalette>;
    }>
  >;
  tints: Record<string, Customization.Palette>;
  useFallbackSwatch?: boolean;
  onComponentChange: (category: string, style: number, option: number) => void;
  onTintChange: (category: string, tint: Customization.Palette) => void;
  convertComponent: (
    comp: UI.Customization.ComponentJsonData | UI.Customization.ComponentJsonDataPalette,
  ) => UI.Customization.StyleColorComponentData;
}

export default function CategoryBrowser({
  rootLabel,
  categories,
  gender,
  currentComponents,
  componentsData,
  tints,
  useFallbackSwatch = true,
  onComponentChange,
  onTintChange,
  convertComponent,
}: CategoryBrowserProps) {
  const [navLevel, setNavLevel] = useState<NavLevel>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStyleIndex, setSelectedStyleIndex] = useState<number | null>(null);

  const availableCategories = useMemo(() => {
    return categories.filter((category) => {
      const categoryData = componentsData[category];
      return categoryData && categoryData.length > 0;
    });
  }, [categories, componentsData]);

  const getCategoryCount = (category: string): number => {
    return componentsData[category]?.length ?? 0;
  };

  const handleCategoryClick = (category: string): void => {
    setSelectedCategory(category);
    setSelectedStyleIndex(null);
    setNavLevel('items');
  };

  const handleStyleClick = (styleIndex: number): void => {
    setSelectedStyleIndex(styleIndex);
    setNavLevel('styles');
  };

  const handleBreadcrumbRoot = (): void => {
    setSelectedCategory(null);
    setSelectedStyleIndex(null);
    setNavLevel('categories');
  };

  const handleBreadcrumbCategory = (): void => {
    setSelectedStyleIndex(null);
    setNavLevel('items');
  };

  const getFirstValidOption = (category: string, styleIndex: number): number => {
    const styleData = componentsData[category]?.[styleIndex];
    if (!styleData) return 0;
    const index = styleData.components.findIndex((comp) => {
      if (gender === 'male' && comp.type === '1') return false;
      if (gender === 'female' && comp.type === '0') return false;
      return true;
    });
    return index === -1 ? 0 : index;
  };

  const selectedCategoryData = selectedCategory && componentsData[selectedCategory];
  const selectedStyleName =
    selectedStyleIndex !== null && selectedCategoryData
      ? (selectedCategoryData[selectedStyleIndex]?.name ?? 'Unknown')
      : null;

  const convertedComponents = useMemo((): Array<{
    name: string;
    components: UI.Customization.StyleColorComponentData[];
  }> => {
    if (!selectedCategory || !componentsData[selectedCategory] || selectedStyleIndex === null) return [];
    const selectedStyle = componentsData[selectedCategory][selectedStyleIndex];
    if (!selectedStyle) return [];
    return [
      {
        name: selectedStyle.name,
        components: selectedStyle.components.map((comp) => convertComponent(comp)),
      },
    ];
  }, [selectedCategory, selectedStyleIndex, componentsData, convertComponent]);

  const currentComp = useMemo((): ComponentData | undefined => {
    if (!selectedCategory || selectedStyleIndex === null) return undefined;
    const styleData = componentsData[selectedCategory]?.[selectedStyleIndex];
    if (!styleData) return undefined;
    const currentOption = currentComponents[selectedCategory]?.option ?? 0;
    return styleData.components[currentOption];
  }, [selectedCategory, selectedStyleIndex, componentsData, currentComponents]);

  const hasTintData =
    selectedCategory &&
    currentComp &&
    isTintable(currentComp) &&
    tints[selectedCategory] &&
    tints[selectedCategory].palette !== -1;

  return (
    <>
      <div className={styles.breadcrumb}>
        <button
          className={conditionalClass(styles.breadcrumbSegment, {
            [styles.active]: navLevel === 'categories',
          })}
          onClick={handleBreadcrumbRoot}
        >
          {rootLabel}
        </button>

        {selectedCategory && (
          <>
            <span className={styles.breadcrumbSeparator}>&rsaquo;</span>
            <button
              className={conditionalClass(styles.breadcrumbSegment, {
                [styles.active]: navLevel === 'items',
              })}
              onClick={handleBreadcrumbCategory}
            >
              {toTitleCase(selectedCategory)}
            </button>
          </>
        )}

        {selectedStyleName && (
          <>
            <span className={styles.breadcrumbSeparator}>&rsaquo;</span>
            <span
              className={conditionalClass(styles.breadcrumbSegment, {
                [styles.active]: true,
              })}
            >
              {selectedStyleName}
            </span>
          </>
        )}
      </div>

      {navLevel === 'categories' && (
        <div className={styles.cardsGrid}>
          {availableCategories.map((category) => {
            const firstComp = getFirstValidComponent(componentsData, category, gender);
            return (
              <div key={category} className={styles.card} onClick={() => handleCategoryClick(category)}>
                {firstComp && <ComponentThumbnail comp={firstComp} className={styles.cardThumb} />}
                <span className={styles.cardName}>{toTitleCase(category)}</span>
                <span className={styles.cardCount}>{getCategoryCount(category)}</span>
              </div>
            );
          })}
        </div>
      )}

      {navLevel === 'items' && selectedCategoryData && selectedCategory && (
        <div className={styles.itemsGrid}>
          {selectedCategoryData.map((item, index) => {
            const firstComp = item.components.find((comp) => {
              if (gender === 'male' && comp.type === '1') return false;
              if (gender === 'female' && comp.type === '0') return false;
              return true;
            });
            return (
              <div
                key={index}
                className={conditionalClass(styles.itemCard, {
                  [styles.selected]: currentComponents[selectedCategory]?.style === index,
                })}
                onClick={() => handleStyleClick(index)}
              >
                {firstComp ? (
                  <ComponentThumbnail comp={firstComp} className={styles.itemImage} />
                ) : (
                  <div className={styles.diamond} />
                )}
                <span className={styles.itemName}>{item.name}</span>
              </div>
            );
          })}
        </div>
      )}

      {navLevel === 'styles' && selectedCategory && selectedStyleIndex !== null && (
        <>
          <StyleColorSelector
            label={`${toTitleCase(selectedCategory)} Options`}
            components={convertedComponents}
            gender={gender}
            style={currentComponents[selectedCategory]?.style === selectedStyleIndex ? 0 : -1}
            option={currentComponents[selectedCategory]?.option ?? 0}
            onChange={(_style, option) => {
              onComponentChange(selectedCategory, selectedStyleIndex, option);

              const comp = componentsData[selectedCategory]?.[selectedStyleIndex]?.components[option];
              if (comp && 'palette' in comp && comp.palette) {
                const palette = Array.isArray(comp.palette) ? comp.palette[0] : comp.palette;
                const tint0 = Array.isArray(comp.tint0) ? comp.tint0[0] : comp.tint0;
                const tint1 = Array.isArray(comp.tint1) ? comp.tint1[0] : comp.tint1;
                const tint2 = Array.isArray(comp.tint2) ? comp.tint2[0] : comp.tint2;
                if (palette && palette !== '') {
                  onTintChange(selectedCategory, {
                    palette: typeof palette === 'string' ? palette.GetHashKey() : palette,
                    tint0: tint0 as number,
                    tint1: tint1 as number,
                    tint2: tint2 as number,
                  });
                }
              }
            }}
          />

          {hasTintData && (
            <TintSelector
              label={`${toTitleCase(selectedCategory)} Tint`}
              identifier={selectedCategory}
              palette={tints[selectedCategory]?.palette ?? -1}
              tint0={tints[selectedCategory]?.tint0 ?? 0}
              tint1={tints[selectedCategory]?.tint1 ?? 0}
              tint2={tints[selectedCategory]?.tint2 ?? 0}
              swatchTexture={currentComp?.swatchTexture}
              useFallbackSwatch={useFallbackSwatch}
              onChange={(ident, tint) => {
                if (selectedCategory && selectedStyleIndex !== null) {
                  const currentStyle = currentComponents[selectedCategory]?.style;
                  if (currentStyle !== selectedStyleIndex) {
                    onComponentChange(
                      selectedCategory,
                      selectedStyleIndex,
                      getFirstValidOption(selectedCategory, selectedStyleIndex),
                    );
                  }
                }
                onTintChange(ident, tint);
              }}
            />
          )}
        </>
      )}
    </>
  );
}
