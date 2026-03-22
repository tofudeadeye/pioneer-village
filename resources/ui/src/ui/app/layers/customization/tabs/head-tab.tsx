import { useMemo } from 'react';

import CategoryBrowser from '../components/category-browser';
import Pad2D from '../components/pad-2d';
import Section from '../components/section';
import Slider from '../components/slider';
import StringSlider from '../components/string-slider';
import StyleColorSelector from '../components/style-color-selector';
import TintSelector from '../components/tint-selector';
import { faceFeatures, teethTypes } from '../constants';

const HAIR_CATEGORIES: string[] = [
  'hair_accessories',
  'hair',
  'beards_complete',
  'beards_chin',
  'beards_chops',
  'beards_mustache',
];

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
  // Eyes — single category, no breadcrumb needed
  const eyesData = componentsData['eyes'];
  const hasEyes = eyesData && eyesData.length > 0;

  const eyesConvertedComponents = useMemo((): Array<{
    name: string;
    components: UI.Customization.StyleColorComponentData[];
  }> => {
    if (!eyesData) return [];
    return eyesData.map((style) => ({
      name: style.name,
      components: style.components.map((comp) => convertComponent(comp)),
    }));
  }, [eyesData, convertComponent]);

  const currentEyesSwatch = 'uisw_eyes_000';

  return (
    <>
      <Section label="Head">
        <Slider label="Head" min={0} max={19} value={head} onChange={onHeadChange} resetTo={0} debounce={250} />
      </Section>

      <Section label="Teeth">
        <StringSlider label="Teeth" values={teethTypes} value={teeth} onChange={onTeethChange} />
      </Section>

      {hasEyes && (
        <Section label="Eyes">
          <StyleColorSelector
            label="Eye Color"
            components={eyesConvertedComponents}
            gender={gender}
            style={currentComponents['eyes']?.style ?? 0}
            option={currentComponents['eyes']?.option ?? 0}
            onChange={(style, option) => {
              onComponentChange('eyes', style, option);

              const comp = eyesData?.[style]?.components[option];
              if (comp && 'palette' in comp && comp.palette) {
                const palette = Array.isArray(comp.palette) ? comp.palette[0] : comp.palette;
                const tint0 = Array.isArray(comp.tint0) ? comp.tint0[0] : comp.tint0;
                const tint1 = Array.isArray(comp.tint1) ? comp.tint1[0] : comp.tint1;
                const tint2 = Array.isArray(comp.tint2) ? comp.tint2[0] : comp.tint2;
                if (palette && palette !== '') {
                  onTintChange('eyes', {
                    palette: typeof palette === 'string' ? palette.GetHashKey() : palette,
                    tint0: tint0 as number,
                    tint1: tint1 as number,
                    tint2: tint2 as number,
                  });
                }
              }
            }}
          />

          <TintSelector
            label="Eye Tint"
            identifier="eyes"
            palette={tints['eyes']?.palette ?? -1}
            tint0={tints['eyes']?.tint0 ?? 0}
            tint1={tints['eyes']?.tint1 ?? 0}
            tint2={tints['eyes']?.tint2 ?? 0}
            swatchTexture={currentEyesSwatch}
            useFallbackSwatch={false}
            onChange={(_identifier, tint) => {
              onTintChange('eyes', tint);
            }}
          />
        </Section>
      )}

      <Section label="Hair & Facial Hair">
        <CategoryBrowser
          rootLabel="Hair"
          categories={HAIR_CATEGORIES}
          gender={gender}
          currentComponents={currentComponents}
          componentsData={componentsData}
          tints={tints}
          useFallbackSwatch={false}
          onComponentChange={onComponentChange}
          onTintChange={onTintChange}
          convertComponent={convertComponent}
        />
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
