export type AppointmentPeriod = 'today' | 'week' | 'month' | 'upcoming' | 'past' | 'all'

export const PERIOD_OPTIONS: { value: AppointmentPeriod; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'upcoming', label: 'Próximos' },
  { value: 'past', label: 'Historial' },
  { value: 'all', label: 'Todos' },
]

/**
 * Inclusive ISO range for a period, in the browser's local time.
 * Weeks run Monday to Sunday. "all" has no bounds, "upcoming" has no end and "past" has no start.
 */
export function getPeriodRange(
  period: AppointmentPeriod,
  now: Date = new Date(),
): { dateFrom?: string; dateTo?: string } {
  if (period === 'all') return {}
  // "Próximos" starts now and has no end; "Historial" ends now and has no start
  if (period === 'upcoming') return { dateFrom: now.toISOString() }
  if (period === 'past') return { dateTo: now.toISOString() }

  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  let end: Date

  if (period === 'today') {
    end = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 59, 999)
  } else if (period === 'week') {
    const sinceMonday = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - sinceMonday)
    end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999)
  } else {
    start.setDate(1)
    end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999)
  }

  return { dateFrom: start.toISOString(), dateTo: end.toISOString() }
}

/** "Próximos" lists the soonest first; every other period lists the most recent first. */
export function isAscendingPeriod(period: AppointmentPeriod): boolean {
  return period === 'upcoming'
}
