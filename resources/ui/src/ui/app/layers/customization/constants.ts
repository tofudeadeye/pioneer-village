type FaceFeature1D = {
  id: number;
  label: string;
  min: number;
  max: number;
};

type FaceFeature2D = [FaceFeature1D, FaceFeature1D];

export type FaceFeatureEntry = FaceFeature1D | FaceFeature2D;

export const faceFeatures: FaceFeatureEntry[] = [
  {
    id: 34006,
    label: 'Head Width',
    min: -2,
    max: 3,
  },
  {
    id: 41396,
    label: 'Face Width',
    min: -2,
    max: 2,
  },
  [
    {
      id: 12281,
      label: 'Eyebrow Width',
      min: -1.5,
      max: 1.5,
    },
    {
      id: 13059,
      label: 'Eyebrow Height',
      min: -1.5,
      max: 1.5,
    },
  ],
  {
    id: 19153,
    label: 'Eyebrow Depth',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 49231,
    label: 'Ears Depth',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 46798,
    label: 'Ears Angle',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 10308,
    label: 'Ears Height',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 60720,
    label: 'Earlobes',
    min: -1.5,
    max: 1.5,
  },
  [
    {
      id: 43983,
      label: 'Cheekbones Width',
      min: -4,
      max: 3.5,
    },
    {
      id: 27147,
      label: 'Cheekbones Height',
      min: 2.5,
      max: -2.5,
    },
  ],
  {
    id: 13709,
    label: 'Cheekbones Depth',
    min: -2.5,
    max: 2.5,
  },
  [
    {
      id: 50098,
      label: 'Chin Width',
      min: -1.5,
      max: 1.5,
    },
    {
      id: 15375,
      label: 'Chin Height',
      min: 1.5,
      max: -1.5,
    },
  ],
  {
    id: 58147,
    label: 'Chin Depth',
    min: -1.5,
    max: 1.5,
  },
  [
    {
      id: 7019,
      label: 'Eyelid Width',
      min: -1.5,
      max: 1.5,
    },
    {
      id: 35627,
      label: 'Eyelid Height',
      min: 1.5,
      max: -1.5,
    },
  ],
  {
    id: 60996,
    label: 'Eyes Depth',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 53862,
    label: 'Eyes Angle',
    min: -1.5,
    max: 1.5,
  },
  [
    {
      id: 42318,
      label: 'Eyes Distance',
      min: -1.5,
      max: 1.5,
    },
    {
      id: 56827,
      label: 'Eyes Height',
      min: 1.5,
      max: -1.5,
    },
  ],
  [
    {
      id: 28287,
      label: 'Nose Width',
      min: -1.5,
      max: 1.5,
    },
    {
      id: 1013,
      label: 'Nose Height',
      min: -1.5,
      max: 1.5,
    },
  ],
  {
    id: 13425,
    label: 'Nose Depth',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 13489,
    label: 'Nose Angle',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 61782,
    label: 'Nose Curvature',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 22046,
    label: 'Nostrils Distance',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 61541,
    label: 'Mouth Width',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 43625,
    label: 'Mouth Depth',
    min: -1.5,
    max: 1.5,
  },
  [
    {
      id: 31427,
      label: 'Mouth X Position',
      min: -1,
      max: 1,
    },
    {
      id: 16653,
      label: 'Mouth Y Position',
      min: 1,
      max: -1,
    },
  ],
  [
    {
      id: 37313,
      label: 'Upper Lip Width',
      min: -1.5,
      max: 1.5,
    },
    {
      id: 6656,
      label: 'Upper Lip Height',
      min: 1.5,
      max: -1.5,
    },
  ],
  {
    id: 50037,
    label: 'Upper Lip Depth',
    min: -1.5,
    max: 1.5,
  },
  [
    {
      id: 45232,
      label: 'Lower Lip Width',
      min: -1.5,
      max: 1.5,
    },
    {
      id: 47949,
      label: 'Lower Lip Height',
      min: -1.5,
      max: 1.5,
    },
  ],
  {
    id: 23830,
    label: 'Lower Lip Depth',
    min: -1.5,
    max: 1.5,
  },
  [
    {
      id: 60334,
      label: 'Jaw Width',
      min: -2,
      max: 2.5,
    },
    {
      id: 36106,
      label: 'Jaw Height',
      min: 1.5,
      max: -2.5,
    },
  ],
  {
    id: 7670,
    label: 'Jaw Depth',
    min: -2.5,
    max: 2.5,
  },
  {
    id: 55182,
    label: 'Jaw Y Position',
    min: -1,
    max: 1,
  },
  [
    {
      id: 57350,
      label: 'Mouth Corner Left Width',
      min: 0,
      max: 1.5,
    },
    {
      id: 46661,
      label: 'Mouth Corner Left Height',
      min: 1.5,
      max: 0,
    },
  ],
  {
    id: 40950,
    label: 'Mouth Corner Left Depth',
    min: 0,
    max: 1.5,
  },
  {
    id: 22344,
    label: 'Mouth Corner Left Upper Lip Distance',
    min: 0,
    max: 1.5,
  },
  {
    id: 60292,
    label: 'Mouth Corner Right Upper Lip Distance',
    min: 0,
    max: 1.5,
  },
  [
    {
      id: 55718,
      label: 'Mouth Corner Right Width',
      min: 1.5,
      max: 0,
    },
    {
      id: 49299,
      label: 'Mouth Corner Right Height',
      min: 1.5,
      max: 0,
    },
  ],
  {
    id: 9423,
    label: 'Mouth Corner Right Depth',
    min: 0,
    max: 1.5,
  },
  {
    id: 22421,
    label: 'Right Eyelid Open/Close',
    min: -1,
    max: 1,
  },
  {
    id: 52902,
    label: 'Left Eyelid Open/Close',
    min: -1,
    max: 1,
  },
  {
    id: 36277,
    label: 'Neck Width',
    min: -1.5,
    max: 1.5,
  },
  {
    id: 60890,
    label: 'Neck Depth',
    min: -1,
    max: 1,
  },
];

export const bodyTypes: string[] = ['Skinny', 'Normal', 'Slim', 'Broad', 'Stocky'];

export const teethTypes: string[] = [
  'Good Teeth',
  'Slightly Crooked',
  'Yellowish',
  'Dark Yellowish',
  'Black Missing Tooth',
  'Blackened',
  'Metal Tooth',
];

export const pedComponentCategories: string[] = [
  'hats',
  'eyewear',
  'neckties',
  'neckwear',

  'shirts_full',
  'vests',
  'coats',
  'coats_closed',
  'cloaks',
  'ponchos',
  'aprons',
  'dresses',
  'skirts',

  'gloves',
  'gauntlets',

  'belts',
  'belt_buckles',
  'gunbelts',
  'gunbelt_accs',
  // 'holsters_left',
  // 'holsters_right',
  // 'holsters_crossdraw',
  // 'holsters_knife',

  'pants',
  'chaps',

  'boots',
  'boot_accessories',
  'spats',

  'suspenders',

  // 'satchels',

  'jewelry_bracelets',
  'jewelry_rings_left',
  'jewelry_rings_right',

  'talisman_belt',
  'talisman_holster',
  'talisman_satchel',
  'talisman_wrist',

  'hair_accessories',
  'hair',
  'beards_complete',
  'beards_chin',
  'beards_chops',
  'beards_mustache',

  'masks',
  'masks_large',

  'accessories',
];

export const componentFiles: string[] = [
  '2886757168',
  'accessories',
  'ammo_pistols',
  'ammo_rifles',
  'aprons',
  'armor',
  'badges',
  'beards_chin',
  'beards_chops',
  'beards_complete',
  'beards_mustache',
  'belt_buckles',
  'belts',
  'bodies_lower',
  'bodies_upper',
  'boot_accessories',
  'boots',
  'chaps',
  'cloaks',
  'coats',
  'coats_closed',
  'dresses',
  'eyes',
  'eyewear',
  'gauntlets',
  'gloves',
  'gunbelt_accs',
  'gunbelts',
  'hair',
  'hair_accessories',
  'hats',
  'heads',
  'holsters_crossdraw',
  'holsters_knife',
  'holsters_left',
  'holsters_right',
  'horse_accessories',
  'horse_bedrolls',
  'horse_blankets',
  'horse_bridles',
  'horse_manes',
  'horse_mustache',
  'horse_saddlebags',
  'horse_saddles',
  'horse_shoes',
  'horse_tails',
  'jewelry_bracelets',
  'jewelry_rings_left',
  'jewelry_rings_right',
  'loadouts',
  'masks',
  'masks_large',
  'neckties',
  'neckwear',
  'pants',
  'ponchos',
  'saddle_horns',
  'saddle_lanterns',
  'saddle_stirrups',
  'satchels',
  'shirts_full',
  'skirts',
  'spats',
  'suspenders',
  'talisman_belt',
  'talisman_holster',
  'talisman_satchel',
  'talisman_wrist',
  'teeth',
  'vests',
];

export const CLOTHING_GROUPS: Record<string, { label: string; categories: string[] }> = {
  headwear: {
    label: 'Headwear',
    categories: ['hats', 'eyewear', 'masks', 'masks_large'],
  },
  neckwear: {
    label: 'Neckwear',
    categories: ['neckties', 'neckwear'],
  },
  tops: {
    label: 'Tops',
    categories: ['shirts_full', 'vests', 'coats', 'coats_closed', 'cloaks', 'ponchos', 'aprons', 'dresses'],
  },
  hands: {
    label: 'Hands',
    categories: ['gloves', 'gauntlets'],
  },
  belts: {
    label: 'Belts & Holsters',
    categories: [
      'belts',
      'belt_buckles',
      'gunbelts',
      'gunbelt_accs',
      'holsters_left',
      'holsters_right',
      'holsters_crossdraw',
      'holsters_knife',
    ],
  },
  bottoms: {
    label: 'Bottoms',
    categories: ['pants', 'chaps', 'skirts'],
  },
  footwear: {
    label: 'Footwear',
    categories: ['boots', 'boot_accessories', 'spats'],
  },
  accessories: {
    label: 'Accessories',
    categories: ['suspenders', 'satchels', 'accessories', 'badges', 'armor', 'loadouts'],
  },
  jewelry: {
    label: 'Jewelry',
    categories: ['jewelry_bracelets', 'jewelry_rings_left', 'jewelry_rings_right'],
  },
  talismans: {
    label: 'Talismans',
    categories: ['talisman_belt', 'talisman_holster', 'talisman_satchel', 'talisman_wrist'],
  },
  hair: {
    label: 'Hair',
    categories: ['hair_accessories', 'hair', 'beards_complete', 'beards_chin', 'beards_chops', 'beards_mustache'],
  },
};

// Categories that cannot be equipped simultaneously
export const EXCLUSIVE_GROUPS: string[][] = [
  ['neckties', 'neckwear', 'ponchos'],
  ['coats', 'coats_closed'],
  ['masks', 'masks_large'],
];

export const HAIR_CATEGORIES: string[] = [
  'eyes',
  'hair_accessories',
  'hair',
  'beards_complete',
  'beards_chin',
  'beards_chops',
  'beards_mustache',
];

export const SKIN_TONES: [number, string][] = [
  [0, '#f5dbb5'],
  [2, '#e8c495'],
  [3, '#c9a06c'],
  [4, '#a07040'],
  [1, '#6e4b2a'],
  [5, '#3d2b1a'],
];

export const PRESET_COLORS: { name: string; hex: string }[] = [
  { name: 'Brown', hex: '#5c3a1e' },
  { name: 'Dark Brown', hex: '#3a2212' },
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'White', hex: '#e8e0d4' },
  { name: 'Navy', hex: '#1e2a3a' },
  { name: 'Gray', hex: '#6b6b6b' },
  { name: 'Tan', hex: '#b89a6a' },
  { name: 'Red', hex: '#7a2020' },
  { name: 'Forest', hex: '#2a4a2a' },
  { name: 'Burgundy', hex: '#5a1a2a' },
  { name: 'Slate', hex: '#4a5568' },
];
