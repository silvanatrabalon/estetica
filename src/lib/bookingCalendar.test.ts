import { describe, expect, it } from 'vitest'
import {
  addMonths,
  clampMonthRange,
  compareMonths,
  daysInMonth,
  monthGrid,
  monthOfKey,
  slotLevel,
  toKey,
} from './bookingCalendar'

describe('monthGrid', () => {
  it('starts weeks on Monday (November 2026 starts on a Sunday)', () => {
    const weeks = monthGrid({ year: 2026, month: 10 })
    expect(weeks[0]).toEqual([null, null, null, null, null, null, '2026-11-01'])
    expect(weeks.every((w) => w.length === 7)).toBe(true)
    expect(weeks.flat().filter(Boolean)).toHaveLength(30)
  })

  it('a month starting on Monday has no leading blanks (June 2026)', () => {
    expect(monthGrid({ year: 2026, month: 5 })[0][0]).toBe('2026-06-01')
  })

  it('handles leap-year February (edge case)', () => {
    expect(monthGrid({ year: 2028, month: 1 }).flat().filter(Boolean)).toHaveLength(29)
    expect(daysInMonth({ year: 2027, month: 1 })).toBe(28)
  })
})

describe('month math', () => {
  it('addMonths crosses year boundaries both ways (edge case)', () => {
    expect(addMonths({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 })
    expect(addMonths({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 })
  })

  it('compareMonths orders by year then month', () => {
    expect(compareMonths({ year: 2026, month: 5 }, { year: 2026, month: 10 })).toBeLessThan(0)
    expect(compareMonths({ year: 2027, month: 0 }, { year: 2026, month: 11 })).toBeGreaterThan(0)
    expect(compareMonths({ year: 2026, month: 3 }, { year: 2026, month: 3 })).toBe(0)
  })

  it('monthOfKey and toKey round-trip', () => {
    expect(monthOfKey('2026-11-21')).toEqual({ year: 2026, month: 10 })
    expect(toKey(2026, 10, 5)).toBe('2026-11-05')
  })
})

describe('clampMonthRange', () => {
  it('limits the month to the booking window', () => {
    expect(clampMonthRange({ year: 2026, month: 10 }, '2026-11-21', '2027-01-20')).toEqual({
      from: '2026-11-21',
      to: '2026-11-30',
    })
    expect(clampMonthRange({ year: 2027, month: 0 }, '2026-11-21', '2027-01-20')).toEqual({
      from: '2027-01-01',
      to: '2027-01-20',
    })
  })

  it('returns null when the month is entirely outside the window (edge case)', () => {
    expect(clampMonthRange({ year: 2026, month: 9 }, '2026-11-21', '2027-01-20')).toBeNull()
    expect(clampMonthRange({ year: 2027, month: 2 }, '2026-11-21', '2027-01-20')).toBeNull()
  })
})

describe('slotLevel', () => {
  it('classifies days by free slots', () => {
    expect(slotLevel(undefined)).toBe('none')
    expect(slotLevel(0)).toBe('none')
    expect(slotLevel(1)).toBe('few')
    expect(slotLevel(4)).toBe('few')
    expect(slotLevel(5)).toBe('many')
    expect(slotLevel(24)).toBe('many')
  })
})
