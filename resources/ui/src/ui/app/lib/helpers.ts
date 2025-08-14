export const uiSize = (size: number) => `${(size / 1080) * 100}vh`;

export const colorH2A = (hex: string): [r: number, g: number, b: number] => {
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }
  return [parseInt(hex, 16) >> 16, (parseInt(hex, 16) >> 8) & 0xff, parseInt(hex, 16) & 0xff];
};

/**
 * Takes in a string or array of default class names
 * and an object of conditional class names
 * then returns the full string of all class names that have a truthy value
 */
export function conditionalClass(
  className: string | undefined | null | (string | undefined | null)[],
  conditionalClassNames: Record<string, boolean | undefined | null> = {},
): string {
  const classes = [];
  if (className) {
    if (Array.isArray(className)) {
      classes.push(...className);
    } else {
      classes.push(className);
    }
  }
  Object.entries(conditionalClassNames).forEach(([key, value]) => {
    if (key && value) classes.push(key);
  });
  return classes.join(' ');
}

export function cloneElement<T extends HTMLElement>(element: T, subtree = false): T {
  return element.cloneNode(subtree) as T;
}
