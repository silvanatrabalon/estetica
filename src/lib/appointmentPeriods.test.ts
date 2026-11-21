import { describe, expect, it } from 'vitest'
import { getPeriodRange } from './appointmentPeriods'

const local = (iso?: string) => (iso ? new Date(iso) : undefined)

describe('getPeriodRange', () => {
  it('all has no bounds', () => {
    expect(getPeriodRange('all')).toEqual({})
  })

  it('today covers the whole local day', () => {
    const r = getPeriodRange('today', new Date(2026, 10, 21, 15, 30))
    expect(local(r.dateFrom)).toEqual(new Date(2026, 10, 21, 0, 0, 0, 0))
    expect(local(r.dateTo)).toEqual(new Date(2026, 10, 21, 23, 59, 59, 999))
  })

  it('week runs Monday to Sunday (Saturday input)', () => {
    const r = getPeriodRange('week', new Date(2026, 10, 21)) // Sat 21 Nov 2026
    expect(local(r.dateFrom)).toEqual(new Date(2026, 10, 16, 0, 0, 0, 0))
    expect(local(r.dateTo)).toEqual(new Date(2026, 10, 22, 23, 59, 59, 999))
  })

  it('week on a Sunday still starts the previous Monday (edge)', () => {
    const r = getPeriodRange('week', new Date(2026, 10, 22))
    expect(local(r.dateFrom)).toEqual(new Date(2026, 10, 16, 0, 0, 0, 0))
  })

  it('week on a Monday starts that same day (edge)', () => {
    const r = getPeriodRange('week', new Date(2026, 10, 16, 9))
    expect(local(r.dateFrom)).toEqual(new Date(2026, 10, 16, 0, 0, 0, 0))
  })

  it('week crossing a month/year boundary', () => {
    const r = getPeriodRange('week', new Date(2026, 0, 1)) // Thu 1 Jan 2026
    expect(local(r.dateFrom)).toEqual(new Date(2025, 11, 29, 0, 0, 0, 0))
    expect(local(r.dateTo)).toEqual(new Date(2026, 0, 4, 23, 59, 59, 999))
  })

  it('month covers first to last day, including February in a leap year', () => {
    const r = getPeriodRange('month', new Date(2028, 1, 10))
    expect(local(r.dateFrom)).toEqual(new Date(2028, 1, 1, 0, 0, 0, 0))
    expect(local(r.dateTo)).toEqual(new Date(2028, 1, 29, 23, 59, 59, 999))
  })
})
