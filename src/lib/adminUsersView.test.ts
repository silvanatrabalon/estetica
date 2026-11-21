import { describe, expect, it } from 'vitest'
import { ALL_ROLES, formatRelativeDate, roleLabel } from './adminUsersView'

describe('roleLabel', () => {
  it('translates every role', () => {
    expect(roleLabel('admin')).toBe('Administrador')
    expect(roleLabel('staff')).toBe('Staff')
    expect(roleLabel('customer')).toBe('Cliente')
  })

  it('lists the three roles in display order', () => {
    expect(ALL_ROLES).toEqual(['customer', 'staff', 'admin'])
  })
})

describe('formatRelativeDate', () => {
  it('formats a valid date as dd/mm/yyyy', () => {
    expect(formatRelativeDate('2026-03-05T12:00:00.000Z')).toBe('05/03/2026')
  })

  it('returns "Sin registro" for null, empty or invalid values (edge case)', () => {
    expect(formatRelativeDate(null)).toBe('Sin registro')
    expect(formatRelativeDate('')).toBe('Sin registro')
    expect(formatRelativeDate('not-a-date')).toBe('Sin registro')
  })
})
