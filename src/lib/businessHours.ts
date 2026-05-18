import type { BusinessHoursRecord } from '../services/businessSettings'

/**
 * Derives the earliest opens_at and latest closes_at across all non-closed
 * business hours rows. Used to set the time-axis grid range.
 * Falls back to provided defaults when no hours are configured.
 */
export function deriveGridTimes(
  weeklyHours: BusinessHoursRecord[],
  fallbackOpen = '08:00',
  fallbackClose = '20:00',
): { openTime: string; closeTime: string } {
  const openTimes = weeklyHours
    .filter((h) => !h.isClosed && h.opensAt)
    .map((h) => h.opensAt as string)
    .sort()

  const closeTimes = weeklyHours
    .filter((h) => !h.isClosed && h.closesAt)
    .map((h) => h.closesAt as string)
    .sort()

  return {
    openTime: openTimes[0] ?? fallbackOpen,
    closeTime: closeTimes.at(-1) ?? fallbackClose,
  }
}
