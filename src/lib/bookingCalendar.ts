/** Pure date helpers for the booking calendar. Date keys are "YYYY-MM-DD" (calendar days, no time zone). */

export interface MonthRef {
  year: number
  /** 0-11 */
  month: number
}

const pad = (n: number) => String(n).padStart(2, '0')

export function toKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

export function monthOfKey(key: string): MonthRef {
  const [y, m] = key.split('-').map(Number)
  return { year: y, month: m - 1 }
}

export function addMonths(ref: MonthRef, delta: number): MonthRef {
  const total = ref.year * 12 + ref.month + delta
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 }
}

export function compareMonths(a: MonthRef, b: MonthRef): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month)
}

export function daysInMonth(ref: MonthRef): number {
  return new Date(Date.UTC(ref.year, ref.month + 1, 0)).getUTCDate()
}

/** Weeks of the month starting on Monday. Cells outside the month are null. */
export function monthGrid(ref: MonthRef): (string | null)[][] {
  const first = new Date(Date.UTC(ref.year, ref.month, 1)).getUTCDay() // 0 = Sunday
  const offset = (first + 6) % 7 // Monday-first
  const total = daysInMonth(ref)

  const cells: (string | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: total }, (_, i) => toKey(ref.year, ref.month, i + 1)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/** The part of the month inside [minKey, maxKey], or null when it does not overlap. */
export function clampMonthRange(
  ref: MonthRef,
  minKey: string,
  maxKey: string,
): { from: string; to: string } | null {
  const first = toKey(ref.year, ref.month, 1)
  const last = toKey(ref.year, ref.month, daysInMonth(ref))
  const from = first < minKey ? minKey : first
  const to = last > maxKey ? maxKey : last
  return from > to ? null : { from, to }
}

export type SlotLevel = 'none' | 'few' | 'many'

/** How busy a day is: none (no free slots), few (1-4), many (5+). */
export function slotLevel(count: number | undefined): SlotLevel {
  if (!count || count <= 0) return 'none'
  return count < 5 ? 'few' : 'many'
}

export function monthTitle(ref: MonthRef): string {
  const text = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(ref.year, ref.month, 1)),
  )
  return text.charAt(0).toUpperCase() + text.slice(1)
}
