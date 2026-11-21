import { describe, expect, it } from 'vitest'
import { LOGO_MAX_BYTES, buildLogoPath, validateLogoFile } from './logoUpload'

describe('validateLogoFile', () => {
  it('accepts supported image types', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp', 'image/gif']) {
      expect(validateLogoFile({ type, size: 1000 })).toBeNull()
    }
  })

  it('rejects non-image and unsupported types (edge case)', () => {
    expect(validateLogoFile({ type: 'application/pdf', size: 1000 })).toMatch(/imagen/)
    expect(validateLogoFile({ type: 'image/svg+xml', size: 1000 })).toMatch(/imagen/)
    expect(validateLogoFile({ type: '', size: 1000 })).toMatch(/imagen/)
  })

  it('accepts exactly the size limit and rejects one byte more (edge case)', () => {
    expect(validateLogoFile({ type: 'image/png', size: LOGO_MAX_BYTES })).toBeNull()
    expect(validateLogoFile({ type: 'image/png', size: LOGO_MAX_BYTES + 1 })).toMatch(/2 MB/)
  })

  it('rejects empty files (edge case)', () => {
    expect(validateLogoFile({ type: 'image/png', size: 0 })).toMatch(/vacío/)
  })
})

describe('buildLogoPath', () => {
  it('builds a timestamped path with a lowercase extension', () => {
    expect(buildLogoPath('Mi Logo.PNG', 123)).toBe('logo/logo-123.png')
  })

  it('falls back to png when there is no extension (edge case)', () => {
    expect(buildLogoPath('logo', 5)).toBe('logo/logo-5.png')
    expect(buildLogoPath('logo.', 5)).toBe('logo/logo-5.png')
  })

  it('strips unsafe characters from the extension (edge case)', () => {
    expect(buildLogoPath('a.p/ng', 7)).toBe('logo/logo-7.png')
  })
})
