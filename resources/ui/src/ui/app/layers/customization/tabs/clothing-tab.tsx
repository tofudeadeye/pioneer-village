import { useMemo } from 'react';

import CategoryBrowser from '../components/category-browser';
import { HAIR_CATEGORIES, pedComponentCategories } from '../constants';

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

export default function ClothingTab({
  gender,
  currentComponents,
  componentsData,
  tints,
  onComponentChange,
  onTintChange,
  convertComponent,
}: ClothingTabProps) {
  const clothingCategories = useMemo(() => {
    return pedComponentCategories.filter((category) => !HAIR_CATEGORIES.includes(category));
  }, []);

  return (
    <CategoryBrowser
      rootLabel="Clothing"
      categories={clothingCategories}
      gender={gender}
      currentComponents={currentComponents}
      componentsData={componentsData}
      tints={tints}
      onComponentChange={onComponentChange}
      onTintChange={onTintChange}
      convertComponent={convertComponent}
    />
  );
}
