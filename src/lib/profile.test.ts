import { describe, expect, it } from 'vitest'
import {
  isProfileComplete,
  nameFromEmail,
  normalizePhone,
  normalizeProfileName,
  resolveProfileName,
  validateProfileInput,
} from './profile'

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


describe('nameFromEmail and resolveProfileName', () => {
  it('takes what is before the @', () => {
    expect(nameFromEmail('ana.perez@example.com')).toBe('ana.perez')
    expect(nameFromEmail('  ana@example.com ')).toBe('ana')
  })

  it('gives empty when there is no usable email (edge cases)', () => {
    expect(nameFromEmail(null)).toBe('')
    expect(nameFromEmail(undefined)).toBe('')
    expect(nameFromEmail('')).toBe('')
    expect(nameFromEmail('@example.com')).toBe('')
  })

  it('the typed name wins; empty or blank falls back to the email (edge cases)', () => {
    expect(resolveProfileName(' Ana ', 'x@y.com')).toBe('Ana')
    expect(resolveProfileName('   ', 'ana@y.com')).toBe('ana')
    expect(resolveProfileName('', null)).toBe('')
  })
})
