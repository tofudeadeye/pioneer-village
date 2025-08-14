import { MouseEventHandler, useCallback, useEffect, useRef, useState } from 'react';

import { boolval } from '@lib/functions';

import PlaceholderSvg from '@styled/components/PlaceholderSvg';
import ProgressBar from '@styled/components/ProgressBar';

import { cloneElement, uiSize } from '@uiLib/helpers';

import { useEscapeKey } from '../../hooks/use-game-events';
import inventoryStore from '../../stores/inventory-store';
import styles from './styles.module.scss';

const progressStyle = { position: 'absolute' as const, left: 0, right: 0, overflow: 'hidden' as const };
const progressStyleTop = { ...progressStyle, top: 0, borderTopLeftRadius: uiSize(4), borderTopRightRadius: uiSize(4) };
const progressStyleBottom = {
  ...progressStyle,
  bottom: 0,
  borderBottomLeftRadius: uiSize(4),
  borderBottomRightRadius: uiSize(4),
};
const progressStyleWeight = { overflow: 'hidden' as const, width: '100%', borderRadius: uiSize(4) };

const itsThumbScale = 1;

const Inventories: React.FC<UI.BaseProps> = () => {
  // Use store state
  const [state, setState] = useState(inventoryStore.getState());

  // Local failed images tracking like the original
  const failedImages = useRef(new Set<string>());

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = inventoryStore.subscribe(setState);
    return unsubscribe;
  }, []);

  // Get items from store
  const items = inventoryStore.getItems();

  const cancelDrag = useCallback<() => void>(() => {
    const dragItem = document.getElementById('drag-item');
    if (!dragItem) {
      return;
    }
    document.body.removeChild(dragItem);
    const draggedElements = document.getElementsByClassName(styles.draggedSource);
    for (const element of draggedElements) {
      element.classList.remove(styles.draggedSource);
    }
  }, []);

  const onEscape = useCallback<() => void>(() => {
    cancelDrag();
    inventoryStore.closeInventory();
  }, [cancelDrag]);

  useEscapeKey(state.show, onEscape);

  const onmousedown = useCallback<MouseEventHandler<HTMLElement>>((e) => {
    const target = e.currentTarget;
    if (!boolval(target.dataset.hasItem)) {
      return;
    }
    const dragItem = cloneElement(target, true);
    target.classList.add(styles.draggedSource);
    dragItem.classList.add(styles.draggedItem);
    dragItem.id = 'drag-item';
    dragItem.style.position = 'fixed';
    dragItem.style.zIndex = '1000';
    dragItem.style.pointerEvents = 'none';
    const rect = target.getBoundingClientRect();
    dragItem.style.width = `${rect.width}px`;
    dragItem.style.height = `${rect.height}px`;
    dragItem.style.left = `${e.clientX}px`;
    dragItem.style.top = `${e.clientY}px`;
    dragItem.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(dragItem);
  }, []);

  const onmousemove = useCallback<(e: MouseEvent) => void>((e) => {
    const dragItem = document.getElementById('drag-item');
    if (!dragItem) {
      return;
    }
    dragItem.style.left = `${e.clientX}px`;
    dragItem.style.top = `${e.clientY}px`;
  }, []);

  const onmouseup = useCallback<(e: MouseEvent) => void>(
    (e) => {
      const dragItem = document.getElementById('drag-item');
      if (!dragItem) {
        return;
      }
      const targetEl = document.elementFromPoint(e.clientX, e.clientY);
      if (!(targetEl instanceof HTMLElement)) {
        return;
      }
      if (!targetEl) {
        return;
      }

      if (dragItem.dataset.inventoryIdentifier && targetEl?.dataset?.inventoryIdentifier && targetEl?.dataset?.slot) {
        const oldSlot = Number(dragItem.dataset.slot);
        const newSlot = Number(targetEl.dataset.slot);

        const sourceInventory = state.inventories.get(dragItem.dataset.inventoryIdentifier);
        const targetInventory = state.inventories.get(targetEl.dataset.inventoryIdentifier);

        // Check if Source Item Still Exists
        if (sourceInventory?.items[oldSlot]?.identifier) {
          const itemData = items[sourceInventory.items[oldSlot].identifier];

          // Clear failed images for the slots being affected
          failedImages.current.delete(`${dragItem.dataset.inventoryIdentifier}::${oldSlot}`);
          failedImages.current.delete(`${targetEl.dataset.inventoryIdentifier}::${newSlot}`);

          // Check if Target is same and stack or move
          if (
            sourceInventory.items[oldSlot].identifier === targetInventory?.items[newSlot]?.identifier &&
            itemData.stackSize > 1
          ) {
            inventoryStore.stackItem(
              dragItem.dataset.inventoryIdentifier,
              oldSlot,
              targetEl.dataset.inventoryIdentifier,
              newSlot,
            );
          } else {
            inventoryStore.moveItem(
              dragItem.dataset.inventoryIdentifier,
              oldSlot,
              targetEl.dataset.inventoryIdentifier,
              newSlot,
            );
          }
        }
      } else if (dragItem.dataset.inventoryIdentifier) {
        inventoryStore.dropItem(dragItem.dataset.inventoryIdentifier, Number(dragItem.dataset.slot));
      } else {
        return;
      }

      cancelDrag();
    },
    [state.inventories, items, cancelDrag],
  );

  const onmouseenter = useCallback<React.MouseEventHandler<HTMLElement>>(
    (e) => {
      const dragItem = document.getElementById('drag-item');
      if (dragItem) {
        return;
      }
      const target = e.currentTarget;
      if (!boolval(target.dataset.hasItem)) {
        return;
      }
      const slot = Number(target.dataset.slot);
      const inventoryIdentifier = target.dataset.inventoryIdentifier;
      if (!inventoryIdentifier) {
        return;
      }
      const inventory = state.inventories.get(inventoryIdentifier);
      if (!inventory) {
        return;
      }
      const item = inventory.items[slot];
      if (!item) {
        return;
      }
      const rect = target.getBoundingClientRect();
      inventoryStore.setTooltip(item, rect.y < window.innerHeight / 2, rect.x, rect.y);
    },
    [state.inventories],
  );

  const onmouseleave = useCallback<() => void>(() => {
    inventoryStore.setTooltip(null);
  }, []);

  // Component mount/unmount
  useEffect(() => {
    document.addEventListener('mouseup', onmouseup);
    document.addEventListener('mousemove', onmousemove);

    // Initialize inventory like the original constructor
    inventoryStore.startup();

    return () => {
      document.removeEventListener('mouseup', onmouseup);
      document.removeEventListener('mousemove', onmousemove);
    };
  }, [onmouseup, onmousemove]);

  const renderTint = useCallback<(palette: string, tint0: number, tint1: number, tint2: number) => React.ReactNode>(
    (palette, tint0, tint1, tint2) => {
      const tints = [tint0, tint0, tint0, tint0, tint1, tint1, tint2];

      return (
        <div className={styles.itsThumbs}>
          {tints.map((tint, i) => (
            <div
              className={styles.itsThumb}
              key={i}
              style={{
                backgroundImage: `url(https://p--v.b-cdn.net/customization/palettes/${palette}_thumbs.png)`,
                backgroundPosition: `-${uiSize((tint % 8) * 8 * itsThumbScale)} -${uiSize(
                  Math.floor(tint / 8) * 8 * itsThumbScale,
                )}`,
              }}
            />
          ))}
        </div>
      );
    },
    [],
  );

  const renderItem = useCallback<
    (
      itemData: UI.Inventory.ItemData,
      i: number,
      identifier: string,
      inventory: UI.Inventory.LoadData,
    ) => React.ReactNode
  >(
    (itemData, i, identifier, inventory) => {
      const item = items[itemData.identifier];

      let durabilityProgress = null;
      if (item?.maxDurability) {
        const durability = itemData.durabilities[0] || 0;
        durabilityProgress = durability / item.maxDurability;
      }

      const firstMetadata: Inventory.AnyItemMetadata = itemData.metadatas[0];

      return (
        <>
          {!failedImages.current.has(`${identifier}::${i}`) && (
            <img
              src={`https://p--v.b-cdn.net/inventory/${firstMetadata?.image || item?.image}.png`}
              onError={() => {
                failedImages.current.add(`${identifier}::${i}`);
              }}
            />
          )}

          {failedImages.current.has(`${identifier}::${i}`) && <PlaceholderSvg text={item?.name} />}
          <span className={styles.weight}>{item?.weight * itemData.quantity}</span>
          <span className={styles.quantity}>x{itemData.quantity}</span>
          {durabilityProgress !== null && (
            <div style={progressStyleTop}>
              <ProgressBar
                progress={durabilityProgress}
                source="left"
                color={durabilityProgress > 0.6 ? 'green' : durabilityProgress > 0.2 ? 'orange' : 'red'}
                backgroundColor="transparent"
                height={uiSize(2)}
                width="100%"
              />
            </div>
          )}
          {firstMetadata &&
            'palette' in firstMetadata &&
            firstMetadata.palette !== 'NONE' &&
            renderTint(
              firstMetadata.palette,
              firstMetadata.tint0 - 1,
              firstMetadata.tint1 - 1,
              firstMetadata.tint2 - 1,
            )}
        </>
      );
    },
    [renderTint, items],
  );

  const renderSlot = useCallback<(i: number, identifier: string, inventory: UI.Inventory.LoadData) => React.ReactNode>(
    (i, identifier, inventory) => {
      let isBroken = false;
      if (i in inventory.items) {
        const item = items[inventory.items[i]?.identifier];
        if (item?.maxDurability) {
          const durability = inventory.items[i]?.durabilities[0] || 0;
          if (durability <= 0) {
            isBroken = true;
          }
        }
      }
      return (
        <div
          className={styles.inventorySlot}
          key={i}
          onMouseEnter={onmouseenter}
          onMouseLeave={onmouseleave}
          onMouseDown={onmousedown}
          data-inventory-identifier={identifier}
          data-slot={i}
          data-has-item={!!inventory.items[i]}
          data-broken={isBroken}
        >
          {inventory.items[i] && renderItem(inventory.items[i], i, identifier, inventory)}
        </div>
      );
    },
    [onmouseenter, onmouseleave, onmousedown, renderItem, items],
  );

  const renderInventory = useCallback<(identifier: string, inventory: UI.Inventory.LoadData) => React.ReactNode>(
    (identifier, inventory) => {
      const weight = state.inventoriesWeight.get(identifier) || 0;
      const InventoryDetails = state.targetInventory === identifier ? styles.inventoryFooter : styles.inventoryHeader;
      const InventoryStats = state.targetInventory === identifier ? styles.inventoryHeader : styles.inventoryFooter;
      return (
        <>
          <div className={InventoryDetails}>
            <div style={progressStyleWeight}>
              <ProgressBar
                progress={weight}
                source="left"
                color={weight > 1 ? 'red' : 'gray75'}
                height={uiSize(3)}
                width="100%"
              />
            </div>
          </div>
          <div className={InventoryStats}>
            <code>{identifier}</code>
          </div>
          <div className={styles.inventoryWrapper}>
            {new Array(inventory.slots).fill(0).map((_, i) => renderSlot(i, identifier, inventory))}
          </div>
        </>
      );
    },
    [state.inventoriesWeight, state.targetInventory, renderSlot],
  );

  const renderTooltip = useCallback<() => React.ReactNode>(() => {
    const itemData = state.tooltipItem;
    if (!itemData) {
      return null;
    }
    const item = items[itemData.identifier];
    if (!item) {
      return null;
    }
    let name = item.name;
    if (itemData.metadatas?.length) {
      for (const metadata of itemData.metadatas) {
        if (metadata.name) {
          name += ` (${metadata.name})`;
          break;
        }
      }
    }
    return (
      <div
        className={`${styles.inventoryTooltip} ${state.tooltipBelow ? styles.below : styles.above}`}
        style={{ top: state.tooltipY, left: state.tooltipX }}
      >
        <h1>{name}</h1>
        {item.description && <p>{item.description}</p>}
        <ul>
          <li>These</li>
          <li>Are</li>
          <li>Tags</li>
        </ul>
      </div>
    );
  }, [state.tooltipItem, state.tooltipBelow, state.tooltipX, state.tooltipY, items]);

  const rowsColumns = useCallback<(inventory: UI.Inventory.LoadData) => string | undefined>((inventory) => {
    if (!inventory?.slots) {
      return;
    }
    if (inventory.slots < 8) {
      return `rows1 columns${inventory.slots}`;
    }
    if (inventory.slots <= 3 * 8) {
      return `rows${Math.ceil(inventory.slots / 8)}`;
    }
  }, []);

  const { clothingInventory, mainInventory, targetInventory } = state;
  const inventories = Object.fromEntries(state.inventories.entries());

  return (
    state.show && (
      <>
        <div className={styles.globalStyle} />
        {state.tooltipItem && renderTooltip()}
        {state.targetInventory && (
          <div className={`${styles.targetInventoryContainer} ${rowsColumns(inventories[targetInventory]) || ''}`}>
            {inventories[targetInventory] && renderInventory(targetInventory, inventories[targetInventory])}
          </div>
        )}
        <div className={styles.mainInventoryContainer}>
          {inventories[mainInventory] && renderInventory(mainInventory, inventories[mainInventory])}
        </div>
        <div className={styles.clothingInventoryContainer}>
          {inventories[clothingInventory] && renderInventory(clothingInventory, inventories[clothingInventory])}
        </div>
      </>
    )
  );
};

export default Inventories;
