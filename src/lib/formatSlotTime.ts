/**
 * Returns "YYYY-MM-DD" for the given UTC ISO timestamp in the specified IANA timezone.
 * Falls back to the raw UTC date if the timezone is invalid.
 */
export function toLocalDateKey(isoUtc: string, orgTimezone: string): string {
  let timezone = 'UTC'
  if (orgTimezone) {
    try {
      Intl.DateTimeFormat('es', { timeZone: orgTimezone })
      timezone = orgTimezone
    } catch {
      // Invalid timezone — fall back to UTC
    }
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(isoUtc))

  const year = parts.find((p) => p.type === 'year')?.value ?? ''
  const month = parts.find((p) => p.type === 'month')?.value ?? ''
  const day = parts.find((p) => p.type === 'day')?.value ?? ''
  return `${year}-${month}-${day}`
}

/**
 * Formats a UTC ISO timestamp as a human-readable local time string
 * in the given IANA timezone (e.g. "America/Bogota").
 *
 * Falls back to 'UTC' if the timezone string is empty or invalid.
 */
export function formatSlotTime(isoUtc: string, orgTimezone: string): string {
  let timezone = 'UTC'

  if (orgTimezone) {
    try {
      // Validate the timezone string by constructing a formatter
      Intl.DateTimeFormat('es', { timeZone: orgTimezone })
      timezone = orgTimezone
    } catch {
      // Invalid timezone — fall back to UTC
    }
  }

  return new Intl.DateTimeFormat('es', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(isoUtc))
}
