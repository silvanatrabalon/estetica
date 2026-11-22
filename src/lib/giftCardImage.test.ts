import { describe, expect, it } from 'vitest'
import {
  GIFT_CARD_HEIGHT,
  GIFT_CARD_THEMES,
  GIFT_CARD_WIDTH,
  buildGiftCardSvg,
  getGiftCardTheme,
  giftCardFileName,
  giftText,
  giftValidityText,
  wrapText,
  type GiftCardInput,
} from './giftCardImage'

const base: GiftCardInput = {
  theme: 'rosa',
  recipient: 'Ana Pérez',
  sender: 'Silvana',
  gift: { kind: 'service', name: 'Limpieza facial profunda' },
  message: 'Feliz cumpleaños',
  validity: 'Válida hasta el 31 dic 2026',
  businessName: 'Estética So Beauty',
}

const parse = (svg: string) => new DOMParser().parseFromString(svg, 'image/svg+xml')

describe('buildGiftCardSvg', () => {
  it('is a landscape 1600x1000 image, not a story', () => {
    const root = parse(buildGiftCardSvg(base)).documentElement
    expect(GIFT_CARD_WIDTH).toBeGreaterThan(GIFT_CARD_HEIGHT)
    expect(root.getAttribute('viewBox')).toBe(`0 0 ${GIFT_CARD_WIDTH} ${GIFT_CARD_HEIGHT}`)
  })

  it.each(GIFT_CARD_THEMES.map((t) => t.id))('theme %s is valid and has all the information', (theme) => {
    const svg = buildGiftCardSvg({ ...base, theme })
    expect(parse(svg).querySelector('parsererror')).toBeNull()
    for (const text of ['GIFT CARD', 'Ana Pérez', 'Silvana', 'Limpieza facial profunda', 'Feliz cumpleaños', 'Válida hasta el 31 dic 2026', 'ESTÉTICA SO BEAUTY']) {
      expect(svg).toContain(text)
    }
  })

  it('offers three styles', () => {
    expect(GIFT_CARD_THEMES.map((t) => t.id)).toEqual(['rosa', 'dorado', 'lila'])
    expect(getGiftCardTheme('nope').id).toBe('rosa')
  })

  it('an amount is written in pesos (edge case)', () => {
    const svg = buildGiftCardSvg({ ...base, gift: { kind: 'amount', cents: 1500000 } })
    expect(svg).toContain('$ 15.000')
    expect(svg).not.toContain('1500000')
  })

  it('without sender, message, validity or logo those parts are left out (edge case)', () => {
    const svg = buildGiftCardSvg({ ...base, sender: '  ', message: '', validity: '', logoDataUrl: null })
    expect(svg).not.toContain('De parte de')
    expect(svg).not.toContain('Feliz')
    expect(svg).not.toContain('Válida')
    expect(svg).not.toContain('<image')
    expect(parse(svg).querySelector('parsererror')).toBeNull()
  })

  it('puts the logo when there is one', () => {
    const svg = buildGiftCardSvg({ ...base, logoDataUrl: 'data:image/png;base64,AAAA' })
    expect(svg).toContain('href="data:image/png;base64,AAAA"')
  })

  it('escapes special characters so the SVG stays valid (edge case)', () => {
    const svg = buildGiftCardSvg({ ...base, recipient: 'A & B <3', sender: 'O"Brien', message: "Te quiero & 'más'", businessName: 'Bela & Co' })
    expect(parse(svg).querySelector('parsererror')).toBeNull()
    expect(svg).toContain('A &amp; B &lt;3')
  })

  it('clips very long names and wraps a long service on two lines (edge case)', () => {
    const svg = buildGiftCardSvg({
      ...base,
      recipient: 'N'.repeat(80),
      gift: { kind: 'service', name: 'Masaje descontracturante con piedras calientes y aromaterapia completa' },
    })
    expect(svg).not.toContain('N'.repeat(40))
    expect(svg).toContain('…')
    expect(parse(svg).querySelector('parsererror')).toBeNull()
  })

  it('never lets the blocks overlap: the last message line stays above the footer (edge case)', () => {
    const svg = buildGiftCardSvg({
      ...base,
      gift: { kind: 'service', name: 'Masaje descontracturante con piedras calientes y aromaterapia completa' },
      message: 'Una dedicatoria bastante larga para ocupar varias líneas del mensaje y comprobar que no pisa nada de abajo',
    })
    const ys = [...svg.matchAll(/<text[^>]* y="([\d.]+)"/g)].map((m) => Number(m[1]))
    expect(Math.max(...ys)).toBeLessThanOrEqual(GIFT_CARD_HEIGHT - 60)
    const noFooter = buildGiftCardSvg({ ...base, validity: '' })
    expect(noFooter).not.toContain('Válida')
  })
})

describe('helpers', () => {
  it('giftText gives the service name or the amount', () => {
    expect(giftText({ kind: 'service', name: 'Masaje' })).toBe('Masaje')
    expect(giftText({ kind: 'amount', cents: 50000 })).toBe('$ 500')
  })

  it('wrapText splits by words, limits the lines and clips the rest', () => {
    expect(wrapText('uno dos tres cuatro', 9, 3)).toEqual(['uno dos', 'tres', 'cuatro'])
    expect(wrapText('a b c d e f g h i j', 3, 2)).toHaveLength(2)
    expect(wrapText('', 10, 2)).toEqual([])
    expect(wrapText('   ', 10, 2)).toEqual([])
  })

  it('wrapText keeps a single very long word on its line, clipped (edge case)', () => {
    const lines = wrapText('x'.repeat(100), 20, 2)
    expect(lines).toHaveLength(1)
    expect(lines[0].length).toBeLessThanOrEqual(20)
  })

  it('giftValidityText formats a day and ignores bad input (edge case)', () => {
    expect(giftValidityText('2026-12-31')).toBe('Válida hasta el 31 dic 2026')
    expect(giftValidityText('2026-01-05')).toBe('Válida hasta el 5 ene 2026')
    expect(giftValidityText('')).toBe('')
    expect(giftValidityText('hoy')).toBe('')
    expect(giftValidityText('2026-13-01')).toBe('')
  })

  it('giftCardFileName removes accents and symbols, and never is empty (edge case)', () => {
    expect(giftCardFileName('Ana María Pérez')).toBe('gift-card-ana-maria-perez')
    expect(giftCardFileName('***')).toBe('gift-card-regalo')
  })
})
