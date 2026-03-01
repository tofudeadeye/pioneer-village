import { useMemo, useState } from 'react';

import { conditionalClass } from '@uiLib/helpers';

import Pad2D from '../components/pad-2d';
import Section from '../components/section';
import Slider from '../components/slider';
import StringSlider from '../components/string-slider';
import StyleColorSelector from '../components/style-color-selector';
import TintSelector from '../components/tint-selector';
import { faceFeatures, HAIR_CATEGORIES, teethTypes } from '../constants';
import clothingStyles from './clothing-tab.module.scss';

interface HeadTabProps {
  gender: 'male' | 'female';
  head: number;
  teeth: number;
  currentFaceFeatures: Record<string, number>;
  currentComponents: Record<string, { style: number; option: number }>;
  componentsData: Record<
    string,
    Array<{
      name: string;
      components: Array<UI.Customization.ComponentJsonData | UI.Customization.ComponentJsonDataPalette>;
    }>
  >;
  tints: Record<string, Customization.Palette>;
  onHeadChange: (value: number) => void;
  onTeethChange: (value: number) => void;
  onFaceFeatureChange: (featureId: number, value: number) => void;
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

export default function HeadTab({
  gender,
  head,
  teeth,
  currentFaceFeatures,
  currentComponents,
  componentsData,
  tints,
  onHeadChange,
  onTeethChange,
  onFaceFeatureChange,
  onComponentChange,
  onTintChange,
  convertComponent,
}: HeadTabProps) {
  const [navLevel, setNavLevel] = useState<NavLevel>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStyleIndex, setSelectedStyleIndex] = useState<number | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);

  const availableHairCategories = useMemo(() => {
    return HAIR_CATEGORIES.filter((category) => {
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
      <Section label="Head">
        <Slider label="Head" min={0} max={19} value={head} onChange={onHeadChange} resetTo={0} debounce={250} />
      </Section>

      <Section label="Teeth">
        <StringSlider label="Teeth" values={teethTypes} value={teeth} onChange={onTeethChange} />
      </Section>

      <Section label="Hair & Facial Hair">
        <div className={clothingStyles.breadcrumb}>
          <button
            className={conditionalClass(clothingStyles.breadcrumbSegment, {
              [clothingStyles.active]: navLevel === 'categories',
            })}
            onClick={handleBreadcrumbRoot}
          >
            Hair
          </button>

          {selectedCategory && (
            <>
              <span className={clothingStyles.breadcrumbSeparator}>&rsaquo;</span>
              <button
                className={conditionalClass(clothingStyles.breadcrumbSegment, {
                  [clothingStyles.active]: navLevel === 'items',
                })}
                onClick={handleBreadcrumbCategory}
              >
                {toTitleCase(selectedCategory)}
              </button>
            </>
          )}

          {selectedStyleName && (
            <>
              <span className={clothingStyles.breadcrumbSeparator}>&rsaquo;</span>
              <span
                className={conditionalClass(clothingStyles.breadcrumbSegment, {
                  [clothingStyles.active]: true,
                })}
              >
                {selectedStyleName}
              </span>
            </>
          )}
        </div>

        {navLevel === 'categories' && (
          <div className={clothingStyles.cardsGrid}>
            {availableHairCategories.map((category) => (
              <div key={category} className={clothingStyles.card} onClick={() => handleCategoryClick(category)}>
                <span className={clothingStyles.cardName}>{toTitleCase(category)}</span>
                <span className={clothingStyles.cardCount}>{getCategoryCount(category)}</span>
              </div>
            ))}
          </div>
        )}

        {navLevel === 'items' && selectedCategoryData && (
          <div className={clothingStyles.itemsGrid}>
            {selectedCategoryData.map((item, index) => (
              <div
                key={index}
                className={conditionalClass(clothingStyles.itemCard, {
                  [clothingStyles.selected]: selectedCategory ? currentComponents[selectedCategory]?.style === index : false,
                })}
                onClick={() => handleStyleClick(index)}
              >
                <div className={clothingStyles.diamond} />
                <span className={clothingStyles.itemName}>{item.name}</span>
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
      </Section>

      <Section label="Face Features">
        {faceFeatures.map((feature) =>
          Array.isArray(feature) ? (
            <Pad2D
              key={feature[0].id}
              labelX={feature[0].label}
              labelY={feature[1].label}
              xMin={feature[0].min}
              xMax={feature[0].max}
              yMin={feature[1].min}
              yMax={feature[1].max}
              step={0.1}
              xValue={currentFaceFeatures[feature[0].id] ?? 0}
              yValue={currentFaceFeatures[feature[1].id] ?? 0}
              onChange={(xValue, yValue) => {
                onFaceFeatureChange(feature[0].id, xValue);
                onFaceFeatureChange(feature[1].id, yValue);
              }}
            />
          ) : (
            <Slider
              key={feature.id}
              label={feature.label}
              min={feature.min}
              max={feature.max}
              step={0.1}
              value={currentFaceFeatures[feature.id] ?? 0}
              resetTo={0}
              onChange={(value) => onFaceFeatureChange(feature.id, value)}
              debounce={0}
            />
          ),
        )}
      </Section>
    </>
  );
}
