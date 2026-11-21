import { describe, expect, it } from 'vitest'
import {
  describeDiscount,
  isWithinDates,
  normalizeCouponCode,
  shortDiscount,
  toStoredValue,
  translateCouponError,
  validateCouponCode,
  validateDiscountValue,
} from './coupons'

describe('describeDiscount / shortDiscount', () => {
  it('formats percentages and fixed amounts', () => {
    expect(describeDiscount({ type: 'percent', value: 15 })).toBe('15% de descuento')
    expect(shortDiscount({ type: 'percent', value: 15 })).toBe('15% OFF')
    expect(describeDiscount({ type: 'fixed', value: 50000 })).toMatch(/500.*de descuento/)
    expect(shortDiscount({ type: 'fixed', value: 50000 })).toMatch(/500.*OFF/)
  })
})

describe('normalizeCouponCode / validateCouponCode', () => {
  it('trims and uppercases', () => {
    expect(normalizeCouponCode('  verano10 ')).toBe('VERANO10')
  })

  it('accepts letters, digits, - and _', () => {
    expect(validateCouponCode('verano-10_x')).toBeNull()
  })

  it('rejects short, long and invalid characters (edge cases)', () => {
    expect(validateCouponCode('ab')).toMatch(/al menos 3/)
    expect(validateCouponCode('x'.repeat(31))).toMatch(/30/)
    expect(validateCouponCode('hola mundo')).toMatch(/solo letras/)
    expect(validateCouponCode('   ')).toMatch(/al menos 3/)
    expect(validateCouponCode('ñandú')).toMatch(/solo letras/)
  })
})

describe('validateDiscountValue', () => {
  it('requires a positive number', () => {
    expect(validateDiscountValue('fixed', '')).toMatch(/mayor a cero/)
    expect(validateDiscountValue('fixed', '0')).toMatch(/mayor a cero/)
    expect(validateDiscountValue('fixed', '-5')).toMatch(/mayor a cero/)
    expect(validateDiscountValue('fixed', 'abc')).toMatch(/mayor a cero/)
  })

  it('percent must be an integer up to 100 (edge cases)', () => {
    expect(validateDiscountValue('percent', '100')).toBeNull()
    expect(validateDiscountValue('percent', '101')).toMatch(/100/)
    expect(validateDiscountValue('percent', '12.5')).toMatch(/entero/)
  })

  it('fixed accepts decimals', () => {
    expect(validateDiscountValue('fixed', '250.50')).toBeNull()
  })
})

describe('toStoredValue', () => {
  it('stores percent as is and pesos as cents', () => {
    expect(toStoredValue('percent', '10')).toBe(10)
    expect(toStoredValue('fixed', '500')).toBe(50000)
    expect(toStoredValue('fixed', '250.5')).toBe(25050)
  })
})

describe('isWithinDates', () => {
  it('is open-ended when there are no dates', () => {
    expect(isWithinDates(null, null, '2026-11-21')).toBe(true)
  })

  it('includes both boundary days (edge case)', () => {
    expect(isWithinDates('2026-11-21', '2026-11-30', '2026-11-21')).toBe(true)
    expect(isWithinDates('2026-11-21', '2026-11-30', '2026-11-30')).toBe(true)
    expect(isWithinDates('2026-11-21', '2026-11-30', '2026-11-20')).toBe(false)
    expect(isWithinDates('2026-11-21', '2026-11-30', '2026-12-01')).toBe(false)
  })
})

describe('translateCouponError', () => {
  it('translates known codes and falls back for unknown ones', () => {
    expect(translateCouponError('COUPON_ALREADY_USED')).toBe('Ya usaste este cupón.')
    expect(translateCouponError('P0001: COUPON_EXPIRED')).toBe('Ese cupón ya venció.')
    expect(translateCouponError('weird')).toMatch(/No pudimos validar/)
  })
})
