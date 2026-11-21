import { describe, expect, it } from 'vitest'
import {
  describeClosureType,
  formatClosureDate,
  formatClosureTime,
  noticeLabel,
  noticeOptions,
} from './businessSettingsFormat'

const NOW = new Date('2026-11-21T12:00:00Z')

describe('formatClosureDate', () => {
  it('writes the weekday, day and month in Spanish', () => {
    expect(formatClosureDate('2026-11-24', NOW)).toBe('Martes 24 de noviembre')
    expect(formatClosureDate('2026-12-25', NOW)).toBe('Viernes 25 de diciembre')
  })

  it('adds the year only when it is not the current year', () => {
    expect(formatClosureDate('2027-01-01', NOW)).toBe('Viernes 1 de enero de 2027')
    expect(formatClosureDate('2025-05-19', NOW)).toBe('Lunes 19 de mayo de 2025')
  })

  it('does not shift the day with the browser time zone (edge case)', () => {
    // Midnight UTC would show the previous day in Buenos Aires if built from a Date in local time
    expect(formatClosureDate('2026-01-01', new Date('2026-06-01T00:00:00Z'))).toBe('Jueves 1 de enero')
  })

  it('handles leap day and rejects impossible dates (edge case)', () => {
    expect(formatClosureDate('2028-02-29', NOW)).toBe('Martes 29 de febrero de 2028')
    expect(formatClosureDate('2026-02-30', NOW)).toBe('2026-02-30')
  })

  it('returns the raw value for garbage input (edge case)', () => {
    expect(formatClosureDate('', NOW)).toBe('')
    expect(formatClosureDate('mañana', NOW)).toBe('mañana')
  })
})

describe('formatClosureTime / describeClosureType', () => {
  it('drops seconds', () => {
    expect(formatClosureTime('19:00:00')).toBe('19:00')
    expect(formatClosureTime('08:30')).toBe('08:30')
  })

  it('shows a placeholder for missing times (edge case)', () => {
    expect(formatClosureTime(null)).toBe('--:--')
    expect(formatClosureTime(undefined)).toBe('--:--')
    expect(formatClosureTime('')).toBe('--:--')
  })

  it('describes full-day and half-day closures', () => {
    expect(describeClosureType('full_day', null, null)).toBe('Todo el día')
    expect(describeClosureType('half_day', '19:00:00', '21:00:00')).toBe('Media jornada: de 19:00 a 21:00')
    expect(describeClosureType('half_day', null, null)).toBe('Media jornada: de --:-- a --:--')
  })
})

describe('noticeLabel', () => {
  it('uses plain words for common values', () => {
    expect(noticeLabel(0)).toBe('Sin anticipación')
    expect(noticeLabel(30)).toBe('30 minutos')
    expect(noticeLabel(60)).toBe('1 hora')
    expect(noticeLabel(120)).toBe('2 horas')
    expect(noticeLabel(1440)).toBe('1 día')
    expect(noticeLabel(2880)).toBe('2 días')
    expect(noticeLabel(10080)).toBe('1 semana')
  })

  it('handles values that are not presets (edge case)', () => {
    expect(noticeLabel(90)).toBe('90 minutos')
    expect(noticeLabel(20160)).toBe('2 semanas')
    expect(noticeLabel(-5)).toBe('Sin anticipación')
  })
})

describe('noticeOptions', () => {
  it('lists the presets in ascending order', () => {
    const values = noticeOptions(60).map((o) => o.value)
    expect(values).toEqual([...values].sort((a, b) => a - b))
    expect(values).toContain(1440)
  })

  it('keeps a stored custom value selectable in its place (edge case)', () => {
    const options = noticeOptions(90)
    expect(options.find((o) => o.value === 90)?.label).toBe('90 minutos')
    const values = options.map((o) => o.value)
    expect(values).toEqual([...values].sort((a, b) => a - b))
  })

  it('does not duplicate a preset value (edge case)', () => {
    expect(noticeOptions(120).filter((o) => o.value === 120)).toHaveLength(1)
  })
})
