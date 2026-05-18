import { describe, it, expect } from 'vitest'
import {
  getGridOpenMinutes,
  getTopPx,
  getHeightPx,
  getGridHeightPx,
  getLocalMinutes,
  PX_PER_MIN,
  MIN_BLOCK_HEIGHT_PX,
} from './timeAxis'

describe('getGridOpenMinutes', () => {
  it('parses "09:00" → 540', () => {
    expect(getGridOpenMinutes('09:00')).toBe(540)
  })

  it('parses "08:30" → 510', () => {
    expect(getGridOpenMinutes('08:30')).toBe(510)
  })

  it('parses "00:00" → 0', () => {
    expect(getGridOpenMinutes('00:00')).toBe(0)
  })

  it('parses "20:00" → 1200', () => {
    expect(getGridOpenMinutes('20:00')).toBe(1200)
  })
})

describe('getLocalMinutes', () => {
  it('returns minutes from midnight in UTC', () => {
    // 09:30 UTC
    expect(getLocalMinutes('2026-05-11T09:30:00Z', 'UTC')).toBe(9 * 60 + 30)
  })

  it('handles midnight (00:00 UTC)', () => {
    expect(getLocalMinutes('2026-05-11T00:00:00Z', 'UTC')).toBe(0)
  })
})

describe('getTopPx', () => {
  it('appointment at exactly open time → top = 0', () => {
    // Grid opens at 09:00 (540 min); appointment at 09:00 UTC
    expect(getTopPx('2026-05-11T09:00:00Z', 540, 'UTC')).toBe(0)
  })

  it('appointment 30 min after open → top = 30 * PX_PER_MIN', () => {
    expect(getTopPx('2026-05-11T09:30:00Z', 540, 'UTC')).toBe(30 * PX_PER_MIN)
  })

  it('appointment 1 hour after open → top = 60 * PX_PER_MIN', () => {
    expect(getTopPx('2026-05-11T10:00:00Z', 540, 'UTC')).toBe(60 * PX_PER_MIN)
  })

  it('appointment before open time → clamped to 0', () => {
    // Grid opens at 09:00 (540), appointment at 08:00 (480)
    expect(getTopPx('2026-05-11T08:00:00Z', 540, 'UTC')).toBe(0)
  })

  it('respects custom pxPerMin', () => {
    // 30 min offset at 2px/min = 60
    expect(getTopPx('2026-05-11T09:30:00Z', 540, 'UTC', 2)).toBe(60)
  })
})

describe('getHeightPx', () => {
  it('90-minute appointment → height = 90 * PX_PER_MIN', () => {
    expect(getHeightPx(90)).toBe(90 * PX_PER_MIN)
  })

  it('60-minute appointment → height = 60 * PX_PER_MIN', () => {
    expect(getHeightPx(60)).toBe(60 * PX_PER_MIN)
  })

  it('short appointment shorter than MIN_BLOCK_HEIGHT_PX → clamped', () => {
    // 5 min * 1 px/min = 5px, clamped to MIN_BLOCK_HEIGHT_PX
    expect(getHeightPx(5)).toBe(MIN_BLOCK_HEIGHT_PX)
  })

  it('0-duration appointment → clamped to MIN_BLOCK_HEIGHT_PX', () => {
    expect(getHeightPx(0)).toBe(MIN_BLOCK_HEIGHT_PX)
  })

  it('respects custom minHeightPx', () => {
    expect(getHeightPx(5, PX_PER_MIN, 10)).toBe(10)
  })

  it('respects custom pxPerMin', () => {
    expect(getHeightPx(30, 2, MIN_BLOCK_HEIGHT_PX)).toBe(60)
  })
})

describe('getGridHeightPx', () => {
  it('09:00 → 20:00 = 1320px', () => {
    expect(getGridHeightPx('09:00', '20:00')).toBe(1320)
  })

  it('08:00 → 18:00 = 1200px', () => {
    expect(getGridHeightPx('08:00', '18:00')).toBe(1200)
  })

  it('same open and close → 0', () => {
    expect(getGridHeightPx('09:00', '09:00')).toBe(0)
  })
})
