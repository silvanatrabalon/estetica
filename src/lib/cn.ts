/**
 * Utility function to conditionally join classNames
 * Similar to clsx/classnames but lightweight
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
