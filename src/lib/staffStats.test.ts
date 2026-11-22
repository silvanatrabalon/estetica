import { describe, expect, it } from 'vitest'
import { computeStaffStats } from './staffStats'

const TZ = 'America/Argentina/Buenos_Aires' // UTC-3
// Saturday 21 Nov 2026, 12:00 in Buenos Aires
const NOW = new Date('2026-11-21T15:00:00Z')

const row = (startsAt: string, status = 'confirmed') => ({ startsAt, status })

describe('computeStaffStats', () => {
  it('is all zeros without appointments', () => {
    expect(computeStaffStats([], TZ, NOW)).toEqual({ today: 0, upcoming: 0, month: 0, cancelledMonth: 0 })
  })

  it('counts today, the month and the ones still to come', () => {
    const rows = [
      row('2026-11-21T13:00:00Z'), // today, 10:00 in Buenos Aires: before NOW (12:00), already done
      row('2026-11-21T20:00:00Z'), // today, later than NOW: upcoming
      row('2026-11-25T13:00:00Z'), // next week: upcoming
      row('2026-11-02T13:00:00Z'), // earlier this month
      row('2026-10-30T13:00:00Z'), // last month
    ]
    expect(computeStaffStats(rows, TZ, NOW)).toEqual({ today: 2, upcoming: 2, month: 4, cancelledMonth: 0 })
  })

  it('upcoming counts pending and confirmed only, from now on (edge case)', () => {
    const rows = [
      row('2026-12-02T13:00:00Z', 'pending'),
      row('2026-12-03T13:00:00Z', 'confirmed'),
      row('2026-12-04T13:00:00Z', 'completed'),
      row('2026-12-05T13:00:00Z', 'cancelled'),
      row('2026-11-20T13:00:00Z', 'confirmed'), // in the past
    ]
    expect(computeStaffStats(rows, TZ, NOW).upcoming).toBe(2)
  })

  it('an appointment starting exactly now still counts as upcoming (edge case)', () => {
    expect(computeStaffStats([row(NOW.toISOString())], TZ, NOW).upcoming).toBe(1)
  })

  it('does not count cancelled appointments, except in cancelledMonth', () => {
    const rows = [row('2026-11-21T13:00:00Z', 'cancelled'), row('2026-10-02T13:00:00Z', 'cancelled')]
    expect(computeStaffStats(rows, TZ, NOW)).toEqual({ today: 0, upcoming: 0, month: 0, cancelledMonth: 1 })
  })

  it('uses the business time zone for the day boundary (edge case)', () => {
    // 22 Nov 01:00 UTC is still 21 Nov 22:00 in Buenos Aires: it is "today"
    expect(computeStaffStats([row('2026-11-22T01:00:00Z')], TZ, NOW).today).toBe(1)
    // 21 Nov 02:00 UTC is 20 Nov 23:00 in Buenos Aires: not today
    expect(computeStaffStats([row('2026-11-21T02:00:00Z')], TZ, NOW).today).toBe(0)
  })

  it('the month follows the business calendar across a year boundary (edge case)', () => {
    const jan = new Date('2027-01-10T15:00:00Z')
    const stats = computeStaffStats([row('2026-12-28T13:00:00Z'), row('2027-01-02T13:00:00Z')], TZ, jan)
    expect(stats.month).toBe(1)
  })
})
