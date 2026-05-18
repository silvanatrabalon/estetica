/**
 * Pure positioning utilities for time-axis calendar views.
 * All functions are side-effect-free and work only with plain values.
 */

export const PX_PER_MIN = 2
export const MIN_BLOCK_HEIGHT_PX = 22

/**
 * Parses an "HH:MM" time string and returns total minutes from midnight.
 *
 * @example getGridOpenMinutes("09:00") → 540
 */
export function getGridOpenMinutes(opensAt: string): number {
  const parts = opensAt.split(':')
  const hours = Number(parts[0] ?? '0')
  const minutes = Number(parts[1] ?? '0')
  return hours * 60 + minutes
}

/**
 * Returns the minute-of-day (0–1439) for a given UTC ISO timestamp
 * interpreted in the specified IANA timezone.
 */
export function getLocalMinutes(isoUtc: string, orgTimezone: string): number {
  const tz = orgTimezone || 'UTC'
  const date = new Date(isoUtc)
  // Use 'en-CA' locale with 24-hour 2-digit formatting to get "HH:MM"
  const timeStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
  const [h, m] = timeStr.split(':').map(Number)
  // Normalize hour 24 → 0 (midnight edge case)
  return ((h ?? 0) % 24) * 60 + (m ?? 0)
}

/**
 * Calculates the top offset in pixels for an appointment block within a
 * time-axis grid.
 *
 * @param startsAt       UTC ISO timestamp of the appointment start
 * @param gridOpenMinutes Minutes from midnight when the grid opens (e.g. 540 for 09:00)
 * @param orgTimezone    IANA timezone string (e.g. "America/Argentina/Buenos_Aires")
 * @param pxPerMin       Pixels per minute (default: PX_PER_MIN)
 * @returns              Top offset in pixels, clamped to ≥ 0
 */
export function getTopPx(
  startsAt: string,
  gridOpenMinutes: number,
  orgTimezone: string,
  pxPerMin: number = PX_PER_MIN,
): number {
  const localMinutes = getLocalMinutes(startsAt, orgTimezone)
  return Math.max(0, (localMinutes - gridOpenMinutes) * pxPerMin)
}

/**
 * Calculates the height in pixels for an appointment block, enforcing a
 * minimum height for legibility.
 *
 * @param durationMinutes  Duration of the appointment in minutes
 * @param pxPerMin         Pixels per minute (default: PX_PER_MIN)
 * @param minHeightPx      Minimum rendered height in pixels (default: MIN_BLOCK_HEIGHT_PX)
 */
export function getHeightPx(
  durationMinutes: number,
  pxPerMin: number = PX_PER_MIN,
  minHeightPx: number = MIN_BLOCK_HEIGHT_PX,
): number {
  return Math.max(durationMinutes * pxPerMin, minHeightPx)
}

/**
 * Returns the total grid height in pixels for a time range.
 *
 * @param openTime   "HH:MM" string for grid start
 * @param closeTime  "HH:MM" string for grid end
 * @param pxPerMin   Pixels per minute (default: PX_PER_MIN)
 */
export function getGridHeightPx(
  openTime: string,
  closeTime: string,
  pxPerMin: number = PX_PER_MIN,
): number {
  const openMinutes = getGridOpenMinutes(openTime)
  const closeMinutes = getGridOpenMinutes(closeTime)
  return Math.max(closeMinutes - openMinutes, 0) * pxPerMin
}
