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
