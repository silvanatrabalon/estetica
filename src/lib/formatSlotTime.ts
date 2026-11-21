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
    // hourCycle (not hour12) so noon renders as 12:00, not 0:00, in the 'es' locale
    hourCycle: 'h12',
  }).format(new Date(isoUtc))
}

/**
 * Formats a UTC ISO timestamp as "dd/mm/yyyy, h:mm a. m." in the given IANA timezone.
 * Falls back to 'UTC' if the timezone is empty or invalid, and returns the raw
 * value when the date is invalid instead of throwing.
 */
export function formatSlotDateTime(isoUtc: string, orgTimezone: string): string {
  const date = new Date(isoUtc)
  if (Number.isNaN(date.getTime())) return isoUtc

  let timezone = 'UTC'
  if (orgTimezone) {
    try {
      Intl.DateTimeFormat('es', { timeZone: orgTimezone })
      timezone = orgTimezone
    } catch {
      // Invalid timezone — fall back to UTC
    }
  }

  return new Intl.DateTimeFormat('es', {
    timeZone: timezone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h12',
  }).format(date)
}
