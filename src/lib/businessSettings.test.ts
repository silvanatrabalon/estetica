import { describe, expect, it } from 'vitest'
import {
  computeBusinessReadiness,
  isValidIanaTimezone,
  normalizeBusinessColor,
  normalizeBusinessName,
  normalizeBusinessText,
  validateBusinessClosure,
  validateBusinessHours,
  validateBusinessIdentity,
} from './businessSettings'

describe('business settings helpers', () => {
  it('normalizes business text fields', () => {
    expect(normalizeBusinessName('  Estetica Silvana  ')).toBe('Estetica Silvana')
    expect(normalizeBusinessColor('  #123ABC  ')).toBe('#123ABC')
    expect(normalizeBusinessColor('   ')).toBeNull()
    expect(normalizeBusinessText('  Tu momento de cuidado  ')).toBe('Tu momento de cuidado')
    expect(normalizeBusinessText('   ')).toBeNull()
  })

  it('validates IANA timezones and business identity', () => {
    expect(isValidIanaTimezone('America/Argentina/Buenos_Aires')).toBe(true)
    expect(isValidIanaTimezone('Mars/Olympus_Mons')).toBe(false)
    expect(
      validateBusinessIdentity({
        name: 'Salon Centro',
        timezone: 'America/Argentina/Buenos_Aires',
        primaryColor: '#123ABC',
      }).valid,
    ).toBe(true)
    expect(
      validateBusinessIdentity({
        name: 'A',
        timezone: 'Mars/Olympus_Mons',
        primaryColor: 'blue',
      }).valid,
    ).toBe(false)
  })

  it('validates weekly business hours for open and closed days', () => {
    expect(
      validateBusinessHours({
        dayOfWeek: 1,
        isClosed: false,
        opensAt: '09:00',
        closesAt: '18:00',
      }).valid,
    ).toBe(true)

    expect(
      validateBusinessHours({
        dayOfWeek: 2,
        isClosed: true,
        opensAt: null,
        closesAt: null,
      }).valid,
    ).toBe(true)

    expect(
      validateBusinessHours({
        dayOfWeek: 3,
        isClosed: false,
        opensAt: '18:00',
        closesAt: '09:00',
      }).valid,
    ).toBe(false)
  })

  it('validates full-day and half-day closures', () => {
    expect(
      validateBusinessClosure({
        closureDate: '2026-05-20',
        closureType: 'full_day',
        startsAt: null,
        endsAt: null,
        reason: 'Feriado',
      }).valid,
    ).toBe(true)

    expect(
      validateBusinessClosure({
        closureDate: '2026-05-21',
        closureType: 'half_day',
        startsAt: '13:00',
        endsAt: '17:00',
        reason: 'Capacitacion',
      }).valid,
    ).toBe(true)

    expect(
      validateBusinessClosure({
        closureDate: '2026-05-21',
        closureType: 'half_day',
        startsAt: '17:00',
        endsAt: '13:00',
        reason: 'Capacitacion',
      }).valid,
    ).toBe(false)
  })

  it('computes readiness from name, timezone, and at least one open day', () => {
    const readyState = computeBusinessReadiness({
      name: 'Salon Centro',
      timezone: 'America/Argentina/Buenos_Aires',
      weeklyHours: [
        { dayOfWeek: 0, isClosed: true, opensAt: null, closesAt: null },
        { dayOfWeek: 1, isClosed: false, opensAt: '09:00', closesAt: '18:00' },
      ],
    })

    expect(readyState).toEqual({
      isReady: true,
      missing: [],
    })

    const incompleteState = computeBusinessReadiness({
      name: ' ',
      timezone: 'UTC',
      weeklyHours: [{ dayOfWeek: 0, isClosed: true, opensAt: null, closesAt: null }],
    })

    expect(incompleteState).toEqual({
      isReady: false,
      missing: ['name', 'weeklyHours'],
    })
  })
  })