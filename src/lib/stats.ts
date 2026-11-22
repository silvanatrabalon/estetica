export type StatsPeriod = 'month' | 'quarter' | 'year' | 'all'

export const STATS_PERIODS: { value: StatsPeriod; label: string }[] = [
  { value: 'month', label: 'Este mes' },
  { value: 'quarter', label: '3 meses' },
  { value: 'year', label: 'Este año' },
  { value: 'all', label: 'Todo' },
]

const pad = (n: number) => String(n).padStart(2, '0')
const key = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

/**
 * Date range (YYYY-MM-DD, inclusive) for a stats period, in the browser's local calendar.
 * "quarter" is the current month plus the two before it. "all" has no bounds.
 */
export function getStatsRange(period: StatsPeriod, now: Date = new Date()): { from: string | null; to: string | null } {
  if (period === 'all') return { from: null, to: null }

  const y = now.getFullYear()
  const m = now.getMonth()
  const lastDay = new Date(y, m + 1, 0).getDate()
  const to = key(y, m, lastDay)

  if (period === 'month') return { from: key(y, m, 1), to }
  if (period === 'year') return { from: key(y, 0, 1), to: key(y, 11, 31) }

  const start = new Date(y, m - 2, 1)
  return { from: key(start.getFullYear(), start.getMonth(), 1), to }
}

/** Error in Spanish when the range is not valid (empty string = fine). A missing end means "no limit". */
export function statsRangeError(from: string, to: string): string {
  if (from && to && from > to) return 'La fecha “Desde” no puede ser posterior a “Hasta”.'
  return ''
}

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** "2026-11" -> "nov". Invalid input is returned unchanged. */
export function monthShortLabel(month: string): string {
  const m = Number(month.slice(5, 7))
  return m >= 1 && m <= 12 ? MONTHS_SHORT[m - 1] : month
}

/** "2026-11" -> "nov 2026". */
export function monthLongLabel(month: string): string {
  const label = monthShortLabel(month)
  return label === month ? month : `${label} ${month.slice(0, 4)}`
}

/** Bar width/height as a percentage of the largest value. Zero values give 0, others at least 2% so they stay visible. */
export function barPercent(value: number, max: number): number {
  if (!(max > 0) || !(value > 0)) return 0
  return Math.max(2, Math.round((value / max) * 100))
}

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 })

/** Money from cents, no decimals: 150000 -> "$ 1.500". */
export function formatMoney(cents: number): string {
  return pesos.format(cents / 100)
}
