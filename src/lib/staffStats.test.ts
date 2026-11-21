import { describe, expect, it } from 'vitest'
import { computeStaffStats } from './staffStats'

const TZ = 'America/Argentina/Buenos_Aires' // UTC-3
// Saturday 21 Nov 2026, 12:00 in Buenos Aires
const NOW = new Date('2026-11-21T15:00:00Z')

const row = (startsAt: string, status = 'confirmed') => ({ startsAt, status })

describe('computeStaffStats', () => {
  it('is all zeros without appointments', () => {
    expect(computeStaffStats([], TZ, NOW)).toEqual({ today: 0, week: 0, month: 0, cancelledMonth: 0 })
  })

  it('counts today, week and month', () => {
    const rows = [
      row('2026-11-21T13:00:00Z'), // today
      row('2026-11-17T13:00:00Z'), // Tuesday, same week
      row('2026-11-02T13:00:00Z'), // earlier this month
      row('2026-10-30T13:00:00Z'), // last month
    ]
    expect(computeStaffStats(rows, TZ, NOW)).toEqual({ today: 1, week: 2, month: 3, cancelledMonth: 0 })
  })

  it('does not count cancelled appointments, except in cancelledMonth', () => {
    const rows = [row('2026-11-21T13:00:00Z', 'cancelled'), row('2026-10-02T13:00:00Z', 'cancelled')]
    expect(computeStaffStats(rows, TZ, NOW)).toEqual({ today: 0, week: 0, month: 0, cancelledMonth: 1 })
  })

  it('uses the business time zone for the day boundary (edge case)', () => {
    // 22 Nov 01:00 UTC is still 21 Nov 22:00 in Buenos Aires: it is "today"
    expect(computeStaffStats([row('2026-11-22T01:00:00Z')], TZ, NOW).today).toBe(1)
    // 21 Nov 02:00 UTC is 20 Nov 23:00 in Buenos Aires: not today
    expect(computeStaffStats([row('2026-11-21T02:00:00Z')], TZ, NOW).today).toBe(0)
  })

  it('the week starts on Monday and ends on Sunday (edge case)', () => {
    const monday = row('2026-11-16T13:00:00Z')
    const sunday = row('2026-11-22T13:00:00Z')
    const prevSunday = row('2026-11-15T13:00:00Z')
    const nextMonday = row('2026-11-23T13:00:00Z')
    expect(computeStaffStats([monday, sunday], TZ, NOW).week).toBe(2)
    expect(computeStaffStats([prevSunday, nextMonday], TZ, NOW).week).toBe(0)
  })

  it('the week can cross a month boundary (edge case)', () => {
    const thursday = new Date('2026-12-31T15:00:00Z') // Thu 31 Dec
    const rows = [row('2027-01-02T13:00:00Z'), row('2026-12-28T13:00:00Z')]
    const stats = computeStaffStats(rows, TZ, thursday)
    expect(stats.week).toBe(2)
    expect(stats.month).toBe(1)
  })

  it('on a Sunday the week still starts the previous Monday (edge case)', () => {
    const sunday = new Date('2026-11-22T15:00:00Z')
    expect(computeStaffStats([row('2026-11-16T13:00:00Z')], TZ, sunday).week).toBe(1)
  })
})
