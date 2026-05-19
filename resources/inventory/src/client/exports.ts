import { exports } from '@lib/client';
import { emitUI, focusUI } from '@lib/client';

const openInventory: Inventory.openInventory = (identifier) => {
  emitUI('inventory.state', { show: true, targetInventory: identifier });
  focusUI(true, true);
};

exports<'inventory'>('openInventory', openInventory);
