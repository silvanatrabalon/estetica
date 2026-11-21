import { describe, expect, it } from 'vitest'
import { canShowProfilePhoto, getGoogleAvatarUrl } from './avatar'

const userWith = (user_metadata: Record<string, unknown>) => ({ user_metadata })

describe('getGoogleAvatarUrl', () => {
  it('reads avatar_url', () => {
    expect(getGoogleAvatarUrl(userWith({ avatar_url: 'https://lh3.googleusercontent.com/a/x' }))).toBe(
      'https://lh3.googleusercontent.com/a/x',
    )
  })

  it('falls back to picture', () => {
    expect(getGoogleAvatarUrl(userWith({ picture: 'https://lh3.googleusercontent.com/p' }))).toBe(
      'https://lh3.googleusercontent.com/p',
    )
  })

  it('returns null when missing, empty or not a string (edge case)', () => {
    expect(getGoogleAvatarUrl(userWith({}))).toBeNull()
    expect(getGoogleAvatarUrl(userWith({ avatar_url: '   ' }))).toBeNull()
    expect(getGoogleAvatarUrl(userWith({ avatar_url: 42 }))).toBeNull()
    expect(getGoogleAvatarUrl(null)).toBeNull()
    expect(getGoogleAvatarUrl(undefined)).toBeNull()
  })

  it('rejects non-https and malformed URLs (edge case)', () => {
    expect(getGoogleAvatarUrl(userWith({ avatar_url: 'http://example.com/a.png' }))).toBeNull()
    expect(getGoogleAvatarUrl(userWith({ avatar_url: 'javascript:alert(1)' }))).toBeNull()
    expect(getGoogleAvatarUrl(userWith({ avatar_url: 'not a url' }))).toBeNull()
  })
})

describe('canShowProfilePhoto', () => {
  it('is true for staff and admin', () => {
    expect(canShowProfilePhoto(['staff'])).toBe(true)
    expect(canShowProfilePhoto(['admin'])).toBe(true)
    expect(canShowProfilePhoto(['customer', 'admin'])).toBe(true)
  })

  it('is false for customers and users without roles (edge case)', () => {
    expect(canShowProfilePhoto(['customer'])).toBe(false)
    expect(canShowProfilePhoto([])).toBe(false)
  })
})
