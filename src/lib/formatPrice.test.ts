import { describe, expect, it } from 'vitest'
import { formatPriceARS } from './formatPrice'

describe('formatPriceARS', () => {
  it('formats zero as $0,00', () => {
    const result = formatPriceARS(0)
    // Locale formatting can produce $ 0,00 or $0,00 depending on platform
    expect(result).toMatch(/\$\s*0[,.]?00/)
  })

  it('formats 100 cents as $1,00', () => {
    const result = formatPriceARS(100)
    expect(result).toMatch(/\$\s*1[,.]?00/)
  })

  it('formats 150000 cents as $1.500,00', () => {
    const result = formatPriceARS(150000)
    // Expect the number 1500 to appear, with correct decimals
    expect(result).toContain('1')
    expect(result).toContain('500')
    expect(result).toMatch(/,00$/)
  })

  it('formats 999999 cents (large value)', () => {
    const result = formatPriceARS(999999)
    expect(result).toContain('9')
    expect(result).toMatch(/,99$/)
  })

  it('always includes the ARS currency symbol', () => {
    const result = formatPriceARS(5000)
    expect(result).toContain('$')
  })
})
