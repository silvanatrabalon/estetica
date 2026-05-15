import { describe, expect, it } from 'vitest'
import { formatSlotTime } from './formatSlotTime'

describe('formatSlotTime', () => {
  it('formats a UTC timestamp in the given timezone', () => {
    // 2025-06-10T14:00:00Z is 09:00 in America/Bogota (UTC-5)
    const result = formatSlotTime('2025-06-10T14:00:00Z', 'America/Bogota')
    expect(result).toMatch(/9/)
    expect(result).toMatch(/00/)
  })

  it('formats a UTC timestamp in a positive-offset timezone', () => {
    // 2025-06-10T10:00:00Z is 12:00 in Europe/Paris (UTC+2 in summer)
    const result = formatSlotTime('2025-06-10T10:00:00Z', 'Europe/Paris')
    expect(result).toMatch(/12/)
    expect(result).toMatch(/00/)
  })

  it('falls back to UTC when timezone is an empty string', () => {
    // 2025-06-10T09:00:00Z → 09:00 UTC
    const result = formatSlotTime('2025-06-10T09:00:00Z', '')
    expect(result).toMatch(/9/)
    expect(result).toMatch(/00/)
  })

  it('falls back to UTC when timezone is invalid', () => {
    const result = formatSlotTime('2025-06-10T09:00:00Z', 'Not/ATimezone')
    expect(result).toMatch(/9/)
    expect(result).toMatch(/00/)
  })

  it('returns a non-empty string for valid inputs', () => {
    const result = formatSlotTime('2025-06-10T15:30:00Z', 'America/Argentina/Buenos_Aires')
    expect(result.length).toBeGreaterThan(0)
  })
})
