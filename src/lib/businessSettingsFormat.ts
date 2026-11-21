const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

/**
 * "2026-05-19" -> "Martes 19 de mayo". The year is added only when it is not the current one.
 * Built from the date parts, so the browser time zone can never shift the day.
 * Returns the raw value when it is not a valid YYYY-MM-DD date.
 */
export function formatClosureDate(isoDate: string, now: Date = new Date()): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate)
  if (!match) return isoDate

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return isoDate
  }

  const weekday = WEEKDAYS[date.getUTCDay()]
  const text = `${weekday[0].toUpperCase()}${weekday.slice(1)} ${day} de ${MONTHS[month - 1]}`
  return year === now.getFullYear() ? text : `${text} de ${year}`
}

/** "19:00:00" -> "19:00". Missing values become "--:--". */
export function formatClosureTime(time: string | null | undefined): string {
  if (!time) return '--:--'
  return time.slice(0, 5)
}

export function describeClosureType(
  closureType: 'full_day' | 'half_day' | string,
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
): string {
  if (closureType === 'full_day') return 'Todo el día'
  return `Media jornada: de ${formatClosureTime(startsAt)} a ${formatClosureTime(endsAt)}`
}

/** Minutes -> plain words ("Sin anticipación", "30 minutos", "1 hora", "2 días", "1 semana"). */
export function noticeLabel(minutes: number): string {
  if (minutes <= 0) return 'Sin anticipación'
  if (minutes % 10080 === 0) {
    const weeks = minutes / 10080
    return weeks === 1 ? '1 semana' : `${weeks} semanas`
  }
  if (minutes % 1440 === 0) {
    const days = minutes / 1440
    return days === 1 ? '1 día' : `${days} días`
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60
    return hours === 1 ? '1 hora' : `${hours} horas`
  }
  return `${minutes} minutos`
}

export const NOTICE_PRESETS_MINUTES = [0, 30, 60, 120, 180, 360, 720, 1440, 2880, 4320, 10080]

/** Options for the notice select; keeps a stored custom value (e.g. 90) selectable. */
export function noticeOptions(current: number): Array<{ value: number; label: string }> {
  const values = NOTICE_PRESETS_MINUTES.includes(current)
    ? NOTICE_PRESETS_MINUTES
    : [...NOTICE_PRESETS_MINUTES, current].sort((a, b) => a - b)
  return values.map((value) => ({ value, label: noticeLabel(value) }))
}
