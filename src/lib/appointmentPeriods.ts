export type AppointmentPeriod = 'today' | 'week' | 'month' | 'all'

export const PERIOD_OPTIONS: { value: AppointmentPeriod; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'all', label: 'Todos' },
]

/**
 * Inclusive ISO range for a period, in the browser's local time.
 * Weeks run Monday to Sunday. "all" has no bounds.
 */
export function getPeriodRange(
  period: AppointmentPeriod,
  now: Date = new Date(),
): { dateFrom?: string; dateTo?: string } {
  if (period === 'all') return {}

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
