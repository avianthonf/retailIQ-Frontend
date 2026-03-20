/**
 * src/utils/cn.ts
 * Utility for conditional class names
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
