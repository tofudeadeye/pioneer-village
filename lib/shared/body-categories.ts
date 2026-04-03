export const BODY_CATEGORIES = [
  'heads',
  'bodies_upper',
  'bodies_lower',
  'eyes',
  'hair',
  'beards_complete',
  'beards_chin',
  'beards_chops',
  'beards_mustache',
] as const;

export type BodyCategory = (typeof BODY_CATEGORIES)[number];

export const isBodyCategory = (category: string): boolean =>
  BODY_CATEGORIES.includes(category.toLowerCase() as BodyCategory);
