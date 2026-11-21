import { toLocalDateKey } from './formatSlotTime'

export interface StaffStats {
  today: number
  week: number
  month: number
  cancelledMonth: number
}

interface StatsRow {
  startsAt: string
  status: string
}

/** "YYYY-MM-DD" shifted by a number of days (pure calendar math, no time zone involved). */
function shiftDateKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return date.toISOString().slice(0, 10)
}

/** Monday-based week containing the given day. */
function weekKeys(todayKey: string): Set<string> {
  const [y, m, d] = todayKey.split('-').map(Number)
  const sinceMonday = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7
  const monday = shiftDateKey(todayKey, -sinceMonday)
  return new Set(Array.from({ length: 7 }, (_, i) => shiftDateKey(monday, i)))
}

/**
 * Counts a professional's own appointments for today, this week (Monday to Sunday) and this
 * month in the business time zone. Cancelled ones are not counted, except in `cancelledMonth`.
 */
export function computeStaffStats(rows: StatsRow[], timezone: string, now: Date = new Date()): StaffStats {
  const todayKey = toLocalDateKey(now.toISOString(), timezone)
  const monthPrefix = todayKey.slice(0, 7)
  const week = weekKeys(todayKey)

  const stats: StaffStats = { today: 0, week: 0, month: 0, cancelledMonth: 0 }

  for (const row of rows) {
    const key = toLocalDateKey(row.startsAt, timezone)
    const inMonth = key.startsWith(monthPrefix)

    if (row.status === 'cancelled') {
      if (inMonth) stats.cancelledMonth += 1
      continue
    }

    if (key === todayKey) stats.today += 1
    if (week.has(key)) stats.week += 1
    if (inMonth) stats.month += 1
  }

  return stats
}
