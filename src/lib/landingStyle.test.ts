import { describe, expect, it } from 'vitest'
import { readableTextOn, splitAccentTitle, todayHoursText } from './landingStyle'

describe('splitAccentTitle', () => {
  it('uses the words between asterisks as the accent', () => {
    expect(splitAccentTitle('Donde la *belleza* se vuelve arte')).toEqual([
      { text: 'Donde la ', accent: false },
      { text: 'belleza', accent: true },
      { text: ' se vuelve arte', accent: false },
    ])
  })

  it('accepts several accents and one at the start or end', () => {
    expect(splitAccentTitle('*Belleza* y *calma*').map((p) => [p.text, p.accent])).toEqual([
      ['Belleza', true],
      [' y ', false],
      ['calma', true],
    ])
  })

  it('without asterisks the last word is the accent', () => {
    expect(splitAccentTitle('Bienvenida a nuestro espacio')).toEqual([
      { text: 'Bienvenida a nuestro ', accent: false },
      { text: 'espacio', accent: true },
    ])
  })

  it('a one-word title is all accent, and an empty one gives nothing (edge cases)', () => {
    expect(splitAccentTitle('Hola')).toEqual([{ text: 'Hola', accent: true }])
    expect(splitAccentTitle('   ')).toEqual([])
  })

  it('does not break with a lone asterisk (edge case)', () => {
    const parts = splitAccentTitle('Oferta * especial')
    expect(parts.map((p) => p.text).join('')).toContain('especial')
    expect(parts.some((p) => p.accent)).toBe(true)
  })

  it('collapses extra spaces before choosing the last word (edge case)', () => {
    expect(splitAccentTitle('  Belleza   total  ').at(-1)).toEqual({ text: 'total', accent: true })
  })
})

describe('readableTextOn', () => {
  it('white on dark and dark on light colors', () => {
    expect(readableTextOn('#5b3f73')).toBe('#ffffff')
    expect(readableTextOn('#c9a24d')).toBe('#ffffff')
    expect(readableTextOn('#fbcfe8')).toBe('#2b2420')
    expect(readableTextOn('#ffffff')).toBe('#2b2420')
  })

  it('accepts no # and falls back to white for invalid input (edge cases)', () => {
    expect(readableTextOn('fbcfe8')).toBe('#2b2420')
    expect(readableTextOn('rojo')).toBe('#ffffff')
    expect(readableTextOn('')).toBe('#ffffff')
    expect(readableTextOn('#fff')).toBe('#ffffff')
  })
})

describe('todayHoursText', () => {
  const monday = new Date(2026, 10, 23, 12, 0) // Monday
  const hours = [
    { day_of_week: 1, is_closed: false, opens_at: '09:00:00', closes_at: '19:00:00' },
    { day_of_week: 0, is_closed: true, opens_at: null, closes_at: null },
  ]

  it('says the hours of today', () => {
    expect(todayHoursText(hours, { now: monday })).toBe('Hoy de 09:00 a 19:00')
  })

  it('says closed on a closed day or when a closure covers the whole day (edge cases)', () => {
    expect(todayHoursText(hours, { now: new Date(2026, 10, 22) })).toBe('Hoy cerrado')
    expect(todayHoursText(hours, { now: monday, closedAllDay: true })).toBe('Hoy cerrado')
  })

  it('gives nothing when the day has no row, and closed when it has no times (edge cases)', () => {
    expect(todayHoursText(hours, { now: new Date(2026, 10, 25) })).toBeNull()
    expect(todayHoursText([{ day_of_week: 1, is_closed: false, opens_at: null, closes_at: null }], { now: monday })).toBe('Hoy cerrado')
    expect(todayHoursText([], { now: monday })).toBeNull()
  })
})
