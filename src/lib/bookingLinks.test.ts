import { describe, expect, it } from 'vitest'
import { bookingHref } from './bookingLinks'

describe('bookingHref', () => {
  it('goes straight to the booking when signed in', () => {
    expect(bookingHref(true, { servicio: 'abc' })).toBe('/booking?servicio=abc')
    expect(bookingHref(true)).toBe('/booking')
  })

  it('sends a visitor to sign in and back to the same booking', () => {
    const href = bookingHref(false, { cupon: 'VERANO10', categoria: 'Uñas' })
    expect(href.startsWith('/signin?redirect=')).toBe(true)
    const redirect = new URLSearchParams(href.split('?')[1]).get('redirect')
    expect(redirect).toBe('/booking?cupon=VERANO10&categoria=U%C3%B1as')
  })

  it('skips empty values (edge case)', () => {
    expect(bookingHref(true, { cupon: 'X', categoria: null, promo: undefined, servicio: '' })).toBe('/booking?cupon=X')
  })

  it('escapes odd characters in the code (edge case)', () => {
    expect(bookingHref(true, { cupon: 'A&B=C' })).toBe('/booking?cupon=A%26B%3DC')
  })
})
