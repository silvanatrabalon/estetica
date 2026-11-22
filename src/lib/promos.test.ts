import { describe, expect, it } from 'vitest'
import {
  applyPromo,
  formatPromoDay,
  promoStatus,
  promoValidityText,
  translatePromoError,
  validatePromoForm,
} from './promos'

const ok = {
  name: 'Semana de manos',
  discountType: 'percent' as const,
  discountValue: '20',
  startsOn: '2026-06-01',
  endsOn: '2026-06-30',
  serviceIds: ['s1'],
}

describe('applyPromo', () => {
  it('applies a percentage', () => {
    expect(applyPromo(900000, { type: 'percent', value: 20 })).toEqual({ discountCents: 180000, finalCents: 720000 })
  })
  it('a fixed amount never goes below zero (edge case)', () => {
    expect(applyPromo(5000, { type: 'fixed', value: 9000 })).toEqual({ discountCents: 5000, finalCents: 0 })
  })
  it('100% leaves the service free (edge case)', () => {
    expect(applyPromo(5000, { type: 'percent', value: 100 }).finalCents).toBe(0)
  })
})

describe('dates', () => {
  it('formats a day and leaves odd values as they are (edge case)', () => {
    expect(formatPromoDay('2026-12-31')).toBe('31 dic 2026')
    expect(formatPromoDay('mañana')).toBe('mañana')
  })
  it('writes the year once when both dates share it', () => {
    expect(promoValidityText('2026-06-01', '2026-06-30')).toBe('Del 1 jun al 30 jun 2026')
    expect(promoValidityText('2026-12-20', '2027-01-05')).toBe('Del 20 dic 2026 al 5 ene 2027')
  })
})

describe('promoStatus', () => {
  const p = { startsOn: '2026-06-01', endsOn: '2026-06-30', isActive: true }
  it('knows where the promo is', () => {
    expect(promoStatus(p, '2026-05-31')).toBe('upcoming')
    expect(promoStatus(p, '2026-06-01')).toBe('running')
    expect(promoStatus(p, '2026-06-30')).toBe('running')
    expect(promoStatus(p, '2026-07-01')).toBe('ended')
  })
  it('a switched-off promo is inactive even when in range (edge case)', () => {
    expect(promoStatus({ ...p, isActive: false }, '2026-06-10')).toBe('inactive')
  })
})

describe('translatePromoError', () => {
  it('translates known codes and falls back to a generic message (edge case)', () => {
    expect(translatePromoError('PROMO_NO_SERVICES')).toBe('Elegí al menos un servicio.')
    expect(translatePromoError('algo raro')).toMatch(/No pudimos guardar/)
  })
})

describe('validatePromoForm', () => {
  it('accepts a valid form', () => {
    expect(validatePromoForm(ok)).toEqual({})
  })
  it('requires name, value, dates and services (edge cases)', () => {
    const e = validatePromoForm({ ...ok, name: ' a ', discountValue: '', startsOn: '', endsOn: '', serviceIds: [] })
    expect(Object.keys(e).sort()).toEqual(['discountValue', 'endsOn', 'name', 'services', 'startsOn'])
  })
  it('rejects percentages over 100, decimals, zero and negatives (edge cases)', () => {
    expect(validatePromoForm({ ...ok, discountValue: '101' }).discountValue).toBeDefined()
    expect(validatePromoForm({ ...ok, discountValue: '10.5' }).discountValue).toBeDefined()
    expect(validatePromoForm({ ...ok, discountValue: '0' }).discountValue).toBeDefined()
    expect(validatePromoForm({ ...ok, discountValue: '-5' }).discountValue).toBeDefined()
  })
  it('allows decimals in fixed amounts (edge case)', () => {
    expect(validatePromoForm({ ...ok, discountType: 'fixed', discountValue: '1500.50' })).toEqual({})
  })
  it('rejects an end before the start but allows a single day (edge cases)', () => {
    expect(validatePromoForm({ ...ok, startsOn: '2026-07-01', endsOn: '2026-06-01' }).dates).toBeDefined()
    expect(validatePromoForm({ ...ok, startsOn: '2026-06-01', endsOn: '2026-06-01' })).toEqual({})
  })
  it('rejects a name over 60 characters (edge case)', () => {
    expect(validatePromoForm({ ...ok, name: 'x'.repeat(61) }).name).toBeDefined()
  })
})
