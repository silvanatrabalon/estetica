import { toLocalDateKey } from './formatSlotTime'

export interface StaffStats {
  today: number
  /** Pending or confirmed appointments from now on. */
  upcoming: number
  month: number
  cancelledMonth: number
}

interface StatsRow {
  startsAt: string
  status: string
}

/**
 * Counts a professional's own appointments for today and this month in the business time zone,
 * plus the ones still to come (pending or confirmed, from now on, any day). Cancelled ones are not
 * counted, except in `cancelledMonth`.
 */
export function computeStaffStats(rows: StatsRow[], timezone: string, now: Date = new Date()): StaffStats {
  const todayKey = toLocalDateKey(now.toISOString(), timezone)
  const monthPrefix = todayKey.slice(0, 7)

  const stats: StaffStats = { today: 0, upcoming: 0, month: 0, cancelledMonth: 0 }

  for (const row of rows) {
    const key = toLocalDateKey(row.startsAt, timezone)
    const inMonth = key.startsWith(monthPrefix)

    if (row.status === 'cancelled') {
      if (inMonth) stats.cancelledMonth += 1
      continue
    }

    if (key === todayKey) stats.today += 1
    if (new Date(row.startsAt).getTime() >= now.getTime() && (row.status === 'pending' || row.status === 'confirmed')) {
      stats.upcoming += 1
    }
    if (inMonth) stats.month += 1
  }

  return stats
}
