import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  COUPON_IMAGE_HEIGHT,
  COUPON_IMAGE_WIDTH,
  COUPON_THEMES,
  amountText,
  buildCouponSvg,
  couponFileName,
  downloadBlob,
  getCouponTheme,
  loadImageAsDataUrl,
  type CouponImageInput,
} from './couponImage'

const base: CouponImageInput = {
  theme: 'base',
  code: 'VERANO20',
  discountType: 'percent',
  discountValue: 20,
  scope: 'Todos los servicios',
  validity: 'Válido del 1 jun 2026 al 31 dic 2026',
  businessName: 'Estética So Beauty',
}

function parse(svg: string): Document {
  return new DOMParser().parseFromString(svg, 'image/svg+xml')
}

describe('buildCouponSvg', () => {
  it('offers the base theme and the seasonal ones', () => {
    expect(COUPON_THEMES.map((t) => t.id)).toEqual([
      'base',
      'navidad',
      'anio-nuevo',
      'black-friday',
      'cyber-monday',
      'dia-madre',
      'dia-mujer',
    ])
  })

  it.each(COUPON_THEMES.map((t) => t.id))('theme %s gives a valid SVG of the right size with the coupon text', (theme) => {
    const svg = buildCouponSvg({ ...base, theme })
    const doc = parse(svg)
    expect(doc.querySelector('parsererror')).toBeNull()
    const root = doc.documentElement
    expect(root.getAttribute('width')).toBe(String(COUPON_IMAGE_WIDTH))
    expect(root.getAttribute('height')).toBe(String(COUPON_IMAGE_HEIGHT))
    expect(svg).toContain('VERANO20')
    expect(svg).toContain('20%')
    expect(svg).toContain('Todos los servicios')
    expect(svg).toContain('Estética So Beauty')
  })

  it('shows the theme name above the amount', () => {
    expect(buildCouponSvg({ ...base, theme: 'black-friday' })).toContain('BLACK FRIDAY')
    expect(buildCouponSvg({ ...base, theme: 'navidad' })).toContain('NAVIDAD')
  })

  it('a fixed amount is written in pesos, not cents', () => {
    const svg = buildCouponSvg({ ...base, discountType: 'fixed', discountValue: 250000 })
    expect(svg).toContain('$ 2.500')
    expect(svg).not.toContain('250000')
  })

  it('escapes special characters so the SVG stays valid (edge case)', () => {
    const svg = buildCouponSvg({ ...base, code: 'A&B<C>', businessName: 'Bela & "Co" <3', scope: "Categoría Uñas & 'Pies'" })
    expect(parse(svg).querySelector('parsererror')).toBeNull()
    expect(svg).toContain('A&amp;B&lt;C&gt;')
    expect(svg).not.toContain('<C>')
  })

  it('clips very long texts instead of overflowing (edge case)', () => {
    const svg = buildCouponSvg({ ...base, businessName: 'N'.repeat(80), scope: 'S'.repeat(120), validity: 'V'.repeat(120) })
    expect(svg).not.toContain('N'.repeat(40))
    expect(svg).toContain('…')
  })

  it('keeps a long code and a big amount inside the ticket by shrinking the text (edge case)', () => {
    const size = (svg: string, text: string) => Number(new RegExp(`font-size="(\\d+)"[^>]*>${text}</text>`).exec(svg)?.[1])
    const small = buildCouponSvg({ ...base, code: 'AB', discountValue: 5 })
    const long = buildCouponSvg({ ...base, code: 'X'.repeat(30), discountType: 'fixed', discountValue: 123456700 })
    expect(size(long, 'X'.repeat(30))).toBeLessThan(size(small, 'AB'))
    expect(size(long, '\\$ 1\\.234\\.567')).toBeLessThan(size(small, '5%'))
  })

  it('is the same image for the same coupon (deterministic)', () => {
    expect(buildCouponSvg(base)).toBe(buildCouponSvg(base))
  })

  it('an unknown theme falls back to the base one (edge case)', () => {
    expect(getCouponTheme('nope').id).toBe('base')
  })
})

describe('story format', () => {
  it('is a 9:16 vertical image for every theme', () => {
    expect(COUPON_IMAGE_WIDTH).toBe(1080)
    expect(COUPON_IMAGE_HEIGHT).toBe(1920)
    for (const t of COUPON_THEMES) {
      const root = parse(buildCouponSvg({ ...base, theme: t.id })).documentElement
      expect(root.getAttribute('viewBox')).toBe('0 0 1080 1920')
    }
  })

  it('keeps the logo and the texts out of the top and bottom strips Instagram covers (edge case)', () => {
    const svg = buildCouponSvg({ ...base, logoDataUrl: 'data:image/png;base64,AAAA' })
    const ys = [...svg.matchAll(/<(?:text|image)[^>]* y="([\d.]+)"/g)].map((m) => Number(m[1]))
    expect(ys.length).toBeGreaterThan(5)
    for (const y of ys) {
      expect(y).toBeGreaterThanOrEqual(250)
      expect(y).toBeLessThanOrEqual(1920 - 250)
    }
  })
})

describe('logo', () => {
  const logo = 'data:image/png;base64,AAAA'

  it('puts the logo in a circle above the ticket when there is one', () => {
    const svg = buildCouponSvg({ ...base, logoDataUrl: logo })
    expect(parse(svg).querySelector('parsererror')).toBeNull()
    expect(svg).toContain(`href="${logo}"`)
    expect(svg).toContain('clip-path="url(#logoClip)"')
  })

  it('has no logo markup without one (edge case)', () => {
    for (const logoDataUrl of [undefined, null, '']) {
      expect(buildCouponSvg({ ...base, logoDataUrl })).not.toContain('<image')
    }
  })

  it('escapes the logo URL so it cannot break the SVG (edge case)', () => {
    const svg = buildCouponSvg({ ...base, logoDataUrl: 'data:image/png;base64,A"B<C' })
    expect(parse(svg).querySelector('parsererror')).toBeNull()
  })
})

describe('loadImageAsDataUrl', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('turns a fetched image into a data URL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(new Blob(['x'], { type: 'image/png' })) }))
    expect(await loadImageAsDataUrl('https://x.test/logo.png')).toMatch(/^data:image\/png;base64,/)
  })

  it('returns data URLs as they are, and null for an empty URL (edge case)', async () => {
    expect(await loadImageAsDataUrl('data:image/svg+xml;utf8,<svg/>')).toBe('data:image/svg+xml;utf8,<svg/>')
    expect(await loadImageAsDataUrl('')).toBeNull()
  })

  it('returns null when the request fails, is blocked or is not an image (edge cases)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('cors')))
    expect(await loadImageAsDataUrl('https://x.test/a.png')).toBeNull()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    expect(await loadImageAsDataUrl('https://x.test/a.png')).toBeNull()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(new Blob(['<html>'], { type: 'text/html' })) }))
    expect(await loadImageAsDataUrl('https://x.test/a.png')).toBeNull()
  })
})

describe('amountText and couponFileName', () => {
  it('formats percent and fixed amounts', () => {
    expect(amountText('percent', 15)).toBe('15%')
    expect(amountText('fixed', 50000)).toBe('$ 500')
  })

  it('builds a safe file name with the code and the theme', () => {
    expect(couponFileName('VERANO20', 'navidad')).toBe('cupon-verano20-navidad')
    expect(couponFileName('A_B-1', 'base')).toBe('cupon-a_b-1-base')
  })

  it('never leaves an empty name (edge case)', () => {
    expect(couponFileName('***', 'base')).toBe('cupon-cupon-base')
  })
})

describe('downloadBlob', () => {
  afterEach(() => vi.restoreAllMocks())

  it('clicks a temporary link with the file name and cleans up', () => {
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    downloadBlob(new Blob(['x']), 'cupon.png')
    expect(click).toHaveBeenCalledTimes(1)
    expect(document.querySelector('a[download]')).toBeNull()
  })
})
