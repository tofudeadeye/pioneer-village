import { useMemo, useState } from 'react';

import { conditionalClass } from '@uiLib/helpers';

import StyleColorSelector from '../components/style-color-selector';
import TintSelector from '../components/tint-selector';
import { HAIR_CATEGORIES, pedComponentCategories } from '../constants';
import styles from './clothing-tab.module.scss';

interface ClothingTabProps {
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
  onComponentChange: (category: string, style: number, option: number) => void;
  onTintChange: (category: string, tint: Customization.Palette) => void;
  convertComponent: (
    comp: UI.Customization.ComponentJsonData | UI.Customization.ComponentJsonDataPalette,
  ) => UI.Customization.StyleColorComponentData;
}

type NavLevel = 'categories' | 'items' | 'styles';

function toTitleCase(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ClothingTab({
  gender,
  currentComponents,
  componentsData,
  tints,
  onComponentChange,
  onTintChange,
  convertComponent,
}: ClothingTabProps) {
  const [navLevel, setNavLevel] = useState<NavLevel>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStyleIndex, setSelectedStyleIndex] = useState<number | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);

  const availableCategories = useMemo(() => {
    return pedComponentCategories.filter((category) => {
      if (HAIR_CATEGORIES.includes(category)) return false;
      const categoryData = componentsData[category];
      return categoryData && categoryData.length > 0;
    });
  }, [componentsData]);

  const getCategoryCount = (category: string): number => {
    return componentsData[category]?.length ?? 0;
  };

  const handleCategoryClick = (category: string): void => {
    setSelectedCategory(category);
    setSelectedStyleIndex(null);
    setIsCustomMode(false);
    setNavLevel('items');
  };

  const handleStyleClick = (styleIndex: number): void => {
    setSelectedStyleIndex(styleIndex);
    setIsCustomMode(false);
    setNavLevel('styles');
  };

  const handleBreadcrumbRoot = (): void => {
    setSelectedCategory(null);
    setSelectedStyleIndex(null);
    setIsCustomMode(false);
    setNavLevel('categories');
  };

  const handleBreadcrumbCategory = (): void => {
    setSelectedStyleIndex(null);
    setIsCustomMode(false);
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

  const handleCustomClick = (): void => {
    if (selectedCategory && selectedStyleIndex !== null) {
      const currentStyle = currentComponents[selectedCategory]?.style;
      if (currentStyle !== selectedStyleIndex) {
        onComponentChange(selectedCategory, selectedStyleIndex, getFirstValidOption(selectedCategory, selectedStyleIndex));
      }
    }
    setIsCustomMode(true);
  };

  const selectedCategoryData = selectedCategory && componentsData[selectedCategory];
  const selectedStyleName =
    selectedStyleIndex !== null && selectedCategoryData
      ? selectedCategoryData[selectedStyleIndex]?.name ?? 'Unknown'
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

  const hasTintData =
    selectedCategory && (isCustomMode || (tints[selectedCategory] && tints[selectedCategory].palette !== -1));

  return (
    <>
      <div className={styles.breadcrumb}>
        <button
          className={conditionalClass(styles.breadcrumbSegment, {
            [styles.active]: navLevel === 'categories',
          })}
          onClick={handleBreadcrumbRoot}
        >
          Clothing
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
          {availableCategories.map((category) => (
            <div key={category} className={styles.card} onClick={() => handleCategoryClick(category)}>
              <span className={styles.cardName}>{toTitleCase(category)}</span>
              <span className={styles.cardCount}>{getCategoryCount(category)}</span>
            </div>
          ))}
        </div>
      )}

      {navLevel === 'items' && selectedCategoryData && (
        <div className={styles.itemsGrid}>
          {selectedCategoryData.map((item, index) => (
            <div
              key={index}
              className={conditionalClass(styles.itemCard, {
                [styles.selected]: selectedCategory ? currentComponents[selectedCategory]?.style === index : false,
              })}
              onClick={() => handleStyleClick(index)}
            >
              <div className={styles.diamond} />
              <span className={styles.itemName}>{item.name}</span>
            </div>
          ))}
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
              setIsCustomMode(false);
            }}
            onCustomClick={handleCustomClick}
            isCustomSelected={isCustomMode}
          />

          {hasTintData && (
            <TintSelector
              label={`${toTitleCase(selectedCategory)} Tint`}
              identifier={selectedCategory}
              palette={tints[selectedCategory]?.palette ?? -1}
              tint0={tints[selectedCategory]?.tint0 ?? 0}
              tint1={tints[selectedCategory]?.tint1 ?? 0}
              tint2={tints[selectedCategory]?.tint2 ?? 0}
              onChange={(identifier, tint) => {
                if (selectedCategory && selectedStyleIndex !== null) {
                  const currentStyle = currentComponents[selectedCategory]?.style;
                  if (currentStyle !== selectedStyleIndex) {
                    onComponentChange(selectedCategory, selectedStyleIndex, getFirstValidOption(selectedCategory, selectedStyleIndex));
                  }
                }
                onTintChange(identifier, tint);
              }}
            />
          )}
        </>
      )}
    </>
  );
}
