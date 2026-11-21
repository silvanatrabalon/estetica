import { describe, expect, it } from 'vitest'
import {
  BOOKING_HEADER_MAX,
  BOOKING_SUBTITLE_MAX,
  DEFAULT_BOOKING_HEADER,
  DEFAULT_BOOKING_SUBTITLE,
  resolveBookingTexts,
  validateBrandTexts,
} from './brand'

describe('validateBrandTexts', () => {
  it('accepts empty, missing and in-range texts', () => {
    expect(validateBrandTexts({})).toBeNull()
    expect(validateBrandTexts({ bookingHeaderText: '', bookingSubtitleText: null })).toBeNull()
    expect(validateBrandTexts({ bookingHeaderText: 'Reservá tu turno' })).toBeNull()
  })

  it('accepts exactly the limit and rejects one more (edge case)', () => {
    expect(validateBrandTexts({ bookingHeaderText: 'a'.repeat(BOOKING_HEADER_MAX) })).toBeNull()
    expect(validateBrandTexts({ bookingHeaderText: 'a'.repeat(BOOKING_HEADER_MAX + 1) })).toMatch(/título/)
    expect(validateBrandTexts({ bookingSubtitleText: 'a'.repeat(BOOKING_SUBTITLE_MAX) })).toBeNull()
    expect(validateBrandTexts({ bookingSubtitleText: 'a'.repeat(BOOKING_SUBTITLE_MAX + 1) })).toMatch(/subtítulo/)
  })

  it('ignores surrounding whitespace when counting (edge case)', () => {
    expect(validateBrandTexts({ bookingHeaderText: ` ${'a'.repeat(BOOKING_HEADER_MAX)} ` })).toBeNull()
  })
})

describe('resolveBookingTexts', () => {
  it('uses the admin texts when present', () => {
    expect(resolveBookingTexts({ bookingHeaderText: ' Hola ', bookingSubtitleText: 'Elegí' })).toEqual({
      header: 'Hola',
      subtitle: 'Elegí',
    })
  })

  it('falls back to defaults for empty, blank or null values (edge case)', () => {
    const defaults = { header: DEFAULT_BOOKING_HEADER, subtitle: DEFAULT_BOOKING_SUBTITLE }
    expect(resolveBookingTexts({})).toEqual(defaults)
    expect(resolveBookingTexts({ bookingHeaderText: '   ', bookingSubtitleText: null })).toEqual(defaults)
  })
})
