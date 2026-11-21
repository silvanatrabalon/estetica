import { describe, expect, it } from 'vitest'
import {
  SOCIAL_NETWORKS,
  buildSocialHref,
  isSocialNetworkKey,
  normalizeSocialValue,
  validateSocialValue,
} from './socialLinks'

describe('SOCIAL_NETWORKS', () => {
  it('offers the seven supported networks', () => {
    expect(SOCIAL_NETWORKS.map((n) => n.key)).toEqual([
      'instagram', 'whatsapp', 'facebook', 'tiktok', 'youtube', 'x', 'website',
    ])
  })

  it('isSocialNetworkKey only accepts known keys', () => {
    expect(isSocialNetworkKey('instagram')).toBe(true)
    expect(isSocialNetworkKey('myspace')).toBe(false)
    expect(isSocialNetworkKey(undefined)).toBe(false)
  })
})

describe('normalizeSocialValue', () => {
  it('prepends https:// to URLs without a scheme', () => {
    expect(normalizeSocialValue('instagram', 'instagram.com/sil')).toBe('https://instagram.com/sil')
  })

  it('keeps an existing scheme and trims whitespace', () => {
    expect(normalizeSocialValue('facebook', '  http://facebook.com/x  ')).toBe('http://facebook.com/x')
  })

  it('keeps only digits for WhatsApp', () => {
    expect(normalizeSocialValue('whatsapp', '+54 9 11 1234-5678')).toBe('5491112345678')
  })

  it('returns empty for blank values (edge case)', () => {
    expect(normalizeSocialValue('instagram', '   ')).toBe('')
    expect(normalizeSocialValue('whatsapp', '')).toBe('')
  })
})

describe('validateSocialValue', () => {
  it('accepts valid URLs, with or without scheme', () => {
    expect(validateSocialValue('instagram', 'https://instagram.com/sil')).toBeNull()
    expect(validateSocialValue('tiktok', 'tiktok.com/@sil')).toBeNull()
  })

  it('treats empty as valid, meaning not set (edge case)', () => {
    expect(validateSocialValue('instagram', '')).toBeNull()
    expect(validateSocialValue('whatsapp', '  ')).toBeNull()
  })

  it('rejects dangerous or malformed URLs (edge case)', () => {
    expect(validateSocialValue('website', 'javascript:alert(1)')).toMatch(/URL válida/)
    expect(validateSocialValue('website', 'ftp://x.com')).toMatch(/URL válida/)
    expect(validateSocialValue('website', 'no es una url')).toMatch(/URL válida/)
    expect(validateSocialValue('website', 'localhost')).toMatch(/URL válida/)
  })

  it('names the network in the URL error', () => {
    expect(validateSocialValue('youtube', 'x y')).toContain('YouTube')
  })

  it('validates WhatsApp digit length at the boundaries (edge case)', () => {
    expect(validateSocialValue('whatsapp', '1234567')).toMatch(/WhatsApp/)
    expect(validateSocialValue('whatsapp', '12345678')).toBeNull()
    expect(validateSocialValue('whatsapp', '123456789012345')).toBeNull()
    expect(validateSocialValue('whatsapp', '1234567890123456')).toMatch(/WhatsApp/)
    expect(validateSocialValue('whatsapp', 'abc')).toMatch(/WhatsApp/)
  })
})

describe('buildSocialHref', () => {
  it('builds a wa.me link from a phone number', () => {
    expect(buildSocialHref('whatsapp', '+54 9 11 1234-5678')).toBe('https://wa.me/5491112345678')
  })

  it('returns the normalized URL for other networks', () => {
    expect(buildSocialHref('instagram', 'instagram.com/sil')).toBe('https://instagram.com/sil')
  })

  it('returns null for empty or invalid values (edge case)', () => {
    expect(buildSocialHref('instagram', '')).toBeNull()
    expect(buildSocialHref('website', 'javascript:alert(1)')).toBeNull()
    expect(buildSocialHref('whatsapp', '123')).toBeNull()
  })
})
