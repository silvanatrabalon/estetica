import { describe, expect, it } from 'vitest'
import { isProfileComplete, normalizePhone, normalizeProfileName, validateProfileInput } from './profile'

describe('profile helpers', () => {
  it('treats profile as complete only when name is present', () => {
    expect(isProfileComplete({ name: 'Ana' })).toBe(true)
    expect(isProfileComplete({ name: '   ' })).toBe(false)
    expect(isProfileComplete(null)).toBe(false)
  })

  it('normalizes profile fields correctly', () => {
    expect(normalizeProfileName('  Ana  ')).toBe('Ana')
    expect(normalizePhone('  +54 11 5555 0000  ')).toBe('+54 11 5555 0000')
    expect(normalizePhone('   ')).toBeNull()
  })

  it('validates required name and optional phone', () => {
    expect(validateProfileInput({ name: '  ', phone: '' }).valid).toBe(false)
    expect(validateProfileInput({ name: 'Ana', phone: '' }).valid).toBe(true)
  })
})
