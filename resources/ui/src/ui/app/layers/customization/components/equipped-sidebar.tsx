import { isBodyCategory } from '@lib/shared/body-categories';
import { getWearableStateOptions } from '@lib/shared/wearable-states';

import styles from './equipped-sidebar.module.scss';
import TintSwatches from './tint-swatches';

function getDrawableImageUrl(drawableHash: string | number): string {
  if (typeof drawableHash === 'string') {
    drawableHash = GetHashKey(drawableHash);
  }
  const unsignedHash = drawableHash >>> 0;
  return `https://p--v.b-cdn.net/drawables/${unsignedHash}.png`;
}

function toTitleCase(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface EquippedItem {
  category: string;
  component: UI.Customization.ComponentJsonData | UI.Customization.ComponentJsonDataPalette;
  tint?: { palette: string | number; tint0: number; tint1: number; tint2: number };
  wearableState?: string | number;
}

interface EquippedSidebarProps {
  currentComponents: Record<string, { style: number; option: number; wearableState?: string | number }>;
  componentsData: Record<string, UI.Customization.ComponentJson[]>;
  tints: Record<string, { palette: string | number; tint0: number; tint1: number; tint2: number }>;
  gender: 'male' | 'female';
  onRemove: (category: string) => void;
  onWearableStateChange: (category: string, state: string | number) => void;
}

export default function EquippedSidebar({
  currentComponents,
  componentsData,
  tints,
  gender,
  onRemove,
  onWearableStateChange,
}: EquippedSidebarProps) {
  const skipType = gender === 'male' ? '1' : '0';

  const equippedItems: EquippedItem[] = [];

  for (const [category, data] of Object.entries(currentComponents)) {
    if (data.style === -1) continue;
    if (isBodyCategory(category)) continue;

    const categoryData = componentsData[category];
    if (!categoryData) continue;

    const styleData = categoryData[data.style];
    if (!styleData) continue;

    const component = styleData.components[data.option];
    if (!component) continue;
    if (component.type === skipType) continue;

    const tint = tints[category];
    const hasTint = tint && tint.palette !== -1 && tint.palette !== 0;

    equippedItems.push({
      category,
      component,
      tint: hasTint ? tint : undefined,
      wearableState: data.wearableState,
    });
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>Equipped</div>
      <div className={styles.itemList}>
        {equippedItems.length === 0 && <div className={styles.emptyState}>No clothing equipped</div>}
        {equippedItems.map((item) => {
          const stateOptions = getWearableStateOptions(item.category.toUpperCase(), item.wearableState);

          return (
            <div key={item.category} className={styles.item}>
              <div className={styles.thumbnail}>
                {item.tint && item.component.swatchTexture ? (
                  <TintSwatches
                    palette={item.tint.palette}
                    tint0={item.tint.tint0}
                    tint1={item.tint.tint1}
                    tint2={item.tint.tint2}
                    swatchTexture={item.component.swatchTexture}
                    imageUrl={getDrawableImageUrl(item.component.drawable)}
                    displaySize={96}
                  />
                ) : (
                  <img src={getDrawableImageUrl(item.component.drawable)} alt={item.category} />
                )}
              </div>
              <div className={styles.info}>
                <span className={styles.categoryName}>{toTitleCase(item.category)}</span>
                {stateOptions.length > 0 && (
                  <div className={styles.stateToggle}>
                    {stateOptions.map((opt) => (
                      <button
                        key={opt.state}
                        className={styles.stateButton}
                        onClick={() => onWearableStateChange(item.category, opt.state)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className={styles.removeButton} onClick={() => onRemove(item.category)}>
                &times;
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
