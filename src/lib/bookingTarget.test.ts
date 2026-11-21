import { describe, expect, it } from 'vitest'
import { canUseCoupon, targetToBookingParams, validateBookingTarget } from './bookingTarget'

const guest = (over: Partial<{ name: string; phone: string; email: string }> = {}) =>
  ({ kind: 'guest', name: 'Rosa Gómez', phone: '', email: '', ...over }) as const

describe('validateBookingTarget', () => {
  it('"me" is always valid', () => {
    expect(validateBookingTarget({ kind: 'me' })).toBeNull()
  })

  it('a client needs to be chosen', () => {
    expect(validateBookingTarget({ kind: 'client', userId: '' })).toMatch(/Elegí al cliente/)
    expect(validateBookingTarget({ kind: 'client', userId: 'u1' })).toBeNull()
  })

  it('a person without account needs a name of at least 2 letters (edge case)', () => {
    expect(validateBookingTarget(guest({ name: '' }))).toMatch(/nombre/)
    expect(validateBookingTarget(guest({ name: ' A ' }))).toMatch(/mínimo 2/)
    expect(validateBookingTarget(guest({ name: 'Al' }))).toBeNull()
  })

  it('phone and email are optional but checked when present (edge cases)', () => {
    expect(validateBookingTarget(guest({ phone: '', email: '' }))).toBeNull()
    expect(validateBookingTarget(guest({ email: 'rosa@mail.com' }))).toBeNull()
    expect(validateBookingTarget(guest({ email: 'rosa' }))).toMatch(/email/)
    expect(validateBookingTarget(guest({ phone: '1'.repeat(31) }))).toMatch(/teléfono/)
    expect(validateBookingTarget(guest({ name: 'x'.repeat(81) }))).toMatch(/80/)
  })
})

describe('targetToBookingParams', () => {
  it('"me" sends nothing extra', () => {
    expect(targetToBookingParams({ kind: 'me' })).toEqual({})
  })

  it('a client sends its account id', () => {
    expect(targetToBookingParams({ kind: 'client', userId: 'u1' })).toEqual({ customerUserId: 'u1' })
  })

  it('a guest sends trimmed data', () => {
    expect(targetToBookingParams(guest({ name: '  Rosa ', phone: ' 11 ', email: ' r@m.com ' }))).toEqual({
      guest: { name: 'Rosa', phone: '11', email: 'r@m.com' },
    })
  })
})

describe('canUseCoupon', () => {
  it('only when booking for oneself', () => {
    expect(canUseCoupon({ kind: 'me' })).toBe(true)
    expect(canUseCoupon({ kind: 'client', userId: 'u1' })).toBe(false)
    expect(canUseCoupon(guest())).toBe(false)
  })
})
