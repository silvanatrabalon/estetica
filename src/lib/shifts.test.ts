import { describe, expect, it } from 'vitest'
import { collapseShifts, describeShifts, toDayShifts, validateShifts } from './shifts'

const w = (start: string, end: string) => ({ start, end })

describe('toDayShifts', () => {
  it('trims seconds and keeps nulls', () => {
    expect(toDayShifts('09:00:00', '13:00:00', null, null)).toEqual({ am: w('09:00', '13:00'), pm: null })
    expect(toDayShifts(null, null, '15:00:00', '19:00:00')).toEqual({ am: null, pm: w('15:00', '19:00') })
  })

  it('ignores a half-filled window', () => {
    expect(toDayShifts('09:00', null, null, null)).toEqual({ am: null, pm: null })
  })
})

describe('validateShifts', () => {
  it('requires at least one shift', () => {
    expect(validateShifts({ am: null, pm: null })).toMatch(/al menos un turno/)
  })

  it('accepts only morning, only afternoon, or both', () => {
    expect(validateShifts({ am: w('09:00', '13:00'), pm: null })).toBeNull()
    expect(validateShifts({ am: null, pm: w('15:00', '19:00') })).toBeNull()
    expect(validateShifts({ am: w('09:00', '13:00'), pm: w('15:00', '19:00') })).toBeNull()
  })

  it('rejects start >= end in either shift', () => {
    expect(validateShifts({ am: w('13:00', '13:00'), pm: null })).toMatch(/matutino/)
    expect(validateShifts({ am: null, pm: w('19:00', '15:00') })).toMatch(/vespertino/)
  })

  it('rejects overlapping shifts but allows touching ones (edge case)', () => {
    expect(validateShifts({ am: w('09:00', '14:00'), pm: w('13:00', '19:00') })).toMatch(/después/)
    expect(validateShifts({ am: w('09:00', '13:00'), pm: w('13:00', '19:00') })).toBeNull()
  })

  it('rejects empty times', () => {
    expect(validateShifts({ am: w('', '13:00'), pm: null })).toMatch(/Ingresá/)
  })
})

describe('collapseShifts', () => {
  it('merges both shifts into first start - last end', () => {
    expect(collapseShifts({ am: w('09:00', '13:00'), pm: w('15:00', '19:00') })).toEqual({
      am: w('09:00', '19:00'),
      pm: null,
    })
  })

  it('moves an afternoon-only day into the single window (edge case)', () => {
    expect(collapseShifts({ am: null, pm: w('15:00', '19:00') })).toEqual({ am: w('15:00', '19:00'), pm: null })
  })

  it('leaves an empty day empty', () => {
    expect(collapseShifts({ am: null, pm: null })).toEqual({ am: null, pm: null })
  })
})

describe('describeShifts', () => {
  it('joins shifts with "y"', () => {
    expect(describeShifts({ am: w('09:00', '13:00'), pm: w('15:00', '19:00') })).toBe('09:00–13:00 y 15:00–19:00')
    expect(describeShifts({ am: null, pm: w('15:00', '19:00') })).toBe('15:00–19:00')
  })
})
