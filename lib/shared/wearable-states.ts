type WearableStateBaseOption = {
  state: string | number;
  label: string;
};

// https://github.com/femga/rdr3_discoveries/tree/master/tasks/TASK_ITEM_INTERACTION
type WearableStateInteractionOption = WearableStateBaseOption & {
  interaction: string;
  interactionDelay: number;
};

type WearableStateAnimOption = WearableStateBaseOption & {
  anim: Anim.Task;
};

type WearableStateOption = WearableStateBaseOption | WearableStateInteractionOption | WearableStateAnimOption;

interface WearableStateCategory {
  states: WearableStateOption[];
}

const WearableStateCategories: Record<string, WearableStateCategory> = {
  NECKWEAR: {
    states: [
      { state: 'BASE', label: 'Pull Down', interaction: 'BANDANA_OFF_LEFT_HAND', interactionDelay: 600 },
      { state: 'MASK_UP', label: 'Pull Up', interaction: 'BANDANA_ON_LEFT_HAND_RIFLE', interactionDelay: 750 },
    ],
  },
  SHIRTS_FULL: {
    states: [
      {
        state: 'BASE',
        label: 'Roll Down Sleeves',
        anim: {
          dict: 'mech_loco_m@generic@fidgets@cold',
          anim: 'rub_arms_01',
          duration: 750,
        },
      },
      {
        state: 'OPEN_COLLAR_ROLLED_SLEEVE',
        label: 'Roll Up Sleeves',
        anim: {
          dict: 'mech_loco_m@generic@fidgets@cold',
          anim: 'rub_arms_01',
          duration: 750,
        },
      },
    ],
  },
};

const getWearableStateConfig = (category: string | number, state: string | number): WearableStateOption | void => {
  let config = WearableStateCategories[category];
  if (typeof category === 'number') {
    for (const key in Object.keys(WearableStateCategories)) {
      if (category === GetHashKey(category)) {
        config = WearableStateCategories[key];
        break;
      }
    }
  }

  if (!config) return;

  for (const s of config.states) {
    if (s.state === state) return s;
  }
};

/**
 * Get available wearable state transitions for an item.
 * Returns states the item can switch TO (excludes current state).
 */
const getWearableStateOptions = (category: string | number, state?: string | number): WearableStateOption[] => {
  const config = WearableStateCategories[category];
  if (!config) return [];

  if (!state) state = 'BASE';

  return config.states.filter((s) => s.state !== state);
};

export default WearableStateCategories;
export { getWearableStateConfig, getWearableStateOptions };
export type { WearableStateCategory, WearableStateOption };
