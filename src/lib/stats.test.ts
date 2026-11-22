import { describe, expect, it } from 'vitest'
import { barPercent, formatMoney, getStatsRange, monthLongLabel, monthShortLabel, statsRangeError } from './stats'

describe('getStatsRange', () => {
  const now = new Date(2026, 10, 21) // 21 Nov 2026

  it('all has no bounds', () => {
    expect(getStatsRange('all', now)).toEqual({ from: null, to: null })
  })

  it('month covers the whole current month', () => {
    expect(getStatsRange('month', now)).toEqual({ from: '2026-11-01', to: '2026-11-30' })
  })

  it('quarter is the current month and the two before', () => {
    expect(getStatsRange('quarter', now)).toEqual({ from: '2026-09-01', to: '2026-11-30' })
  })

  it('quarter crosses the year boundary (edge case)', () => {
    expect(getStatsRange('quarter', new Date(2027, 0, 10))).toEqual({ from: '2026-11-01', to: '2027-01-31' })
  })

  it('year covers January to December', () => {
    expect(getStatsRange('year', now)).toEqual({ from: '2026-01-01', to: '2026-12-31' })
  })

  it('handles a leap-year February (edge case)', () => {
    expect(getStatsRange('month', new Date(2028, 1, 10))).toEqual({ from: '2028-02-01', to: '2028-02-29' })
  })
})

describe('month labels', () => {
  it('abbreviates in Spanish', () => {
    expect(monthShortLabel('2026-11')).toBe('nov')
    expect(monthShortLabel('2026-01')).toBe('ene')
    expect(monthLongLabel('2026-12')).toBe('dic 2026')
  })

  it('returns invalid input unchanged (edge case)', () => {
    expect(monthShortLabel('xx')).toBe('xx')
    expect(monthLongLabel('2026-13')).toBe('2026-13')
  })
})

describe('barPercent', () => {
  it('scales to the maximum', () => {
    expect(barPercent(50, 100)).toBe(50)
    expect(barPercent(100, 100)).toBe(100)
  })

  it('zero is zero, tiny values stay visible, and a zero max is safe (edge cases)', () => {
    expect(barPercent(0, 100)).toBe(0)
    expect(barPercent(1, 1000)).toBe(2)
    expect(barPercent(5, 0)).toBe(0)
    expect(barPercent(-3, 10)).toBe(0)
  })
})

describe('formatMoney', () => {
  it('formats cents as pesos without decimals', () => {
    expect(formatMoney(150000)).toMatch(/1\.500/)
    expect(formatMoney(0)).toMatch(/0/)
  })
})

describe('statsRangeError', () => {
  it('accepts a valid, a same-day, and an open range (edge cases)', () => {
    expect(statsRangeError('2026-01-01', '2026-02-01')).toBe('')
    expect(statsRangeError('2026-01-01', '2026-01-01')).toBe('')
    expect(statsRangeError('', '2026-02-01')).toBe('')
    expect(statsRangeError('2026-01-01', '')).toBe('')
    expect(statsRangeError('', '')).toBe('')
  })
  it('rejects a start after the end', () => {
    expect(statsRangeError('2026-03-01', '2026-02-01')).toMatch(/Desde/)
  })
})
