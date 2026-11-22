import { describe, expect, it } from 'vitest'
import {
  bookingReference,
  buildEmail,
  buildRecipients,
  escapeHtml,
  formatDateTime,
  isEventType,
  isValidEmail,
  safeEqual,
  type NotificationData,
} from './logic'

const data: NotificationData = {
  appointmentId: '3f2a9c1e-1111-2222-3333-444455556666',
  startsAt: '2026-06-10T14:00:00Z',
  endsAt: '2026-06-10T15:00:00Z',
  serviceName: 'Corte de cabello',
  staffDisplayName: 'María López',
  customerName: 'Juan Pérez',
  orgName: 'Estetica So Beauty',
  orgTimezone: 'America/Argentina/Buenos_Aires',
  siteUrl: 'https://example.com',
}

describe('isEventType', () => {
  it('accepts the three known events', () => {
    expect(isEventType('booking_confirmed')).toBe(true)
    expect(isEventType('cancelled')).toBe(true)
    expect(isEventType('rescheduled')).toBe(true)
  })

  it.each([['unknown'], [''], [undefined], [null], [42], [{}]])('rejects %p', (value) => {
    expect(isEventType(value)).toBe(false)
  })
})

describe('isValidEmail', () => {
  it('accepts normal addresses and trims whitespace', () => {
    expect(isValidEmail('a@b.com')).toBe(true)
    expect(isValidEmail('  a@b.com  ')).toBe(true)
  })

  it.each([[''], ['   '], ['no-at-sign'], ['a@b'], ['a b@c.com'], [null], [undefined]])(
    'rejects %p',
    (value) => {
      expect(isValidEmail(value as string | null | undefined)).toBe(false)
    },
  )
})

describe('buildRecipients', () => {
  it('sends to three distinct addresses', () => {
    const result = buildRecipients({
      customerEmail: 'c@x.com',
      staffEmail: 's@x.com',
      adminEmails: ['o@x.com'],
    })
    expect(result.map((r) => r.email)).toEqual(['c@x.com', 's@x.com', 'o@x.com'])
    expect(result.map((r) => r.audience)).toEqual(['customer', 'business', 'business'])
  })

  it('deduplicates when all three addresses are identical (one send, customer version)', () => {
    const result = buildRecipients({
      customerEmail: 'same@x.com',
      staffEmail: 'same@x.com',
      adminEmails: ['same@x.com'],
    })
    expect(result).toEqual([{ email: 'same@x.com', audience: 'customer' }])
  })

  it('deduplicates case-insensitively', () => {
    const result = buildRecipients({
      customerEmail: 'Ana@X.com',
      staffEmail: 'ana@x.COM',
      adminEmails: ['other@x.com'],
    })
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ email: 'Ana@X.com', audience: 'customer' })
  })

  it('keeps two sends when two addresses match and one is distinct', () => {
    const result = buildRecipients({
      customerEmail: 'c@x.com',
      staffEmail: 'o@x.com',
      adminEmails: ['o@x.com'],
    })
    expect(result.map((r) => r.email)).toEqual(['c@x.com', 'o@x.com'])
  })

  it('skips null, empty and invalid addresses', () => {
    const result = buildRecipients({
      customerEmail: 'c@x.com',
      staffEmail: null,
      adminEmails: ['not-an-email'],
    })
    expect(result).toEqual([{ email: 'c@x.com', audience: 'customer' }])
  })

  it('returns an empty list when nobody can be notified', () => {
    expect(buildRecipients({})).toEqual([])
    expect(buildRecipients({ customerEmail: '', staffEmail: '  ', adminEmails: [] })).toEqual([])
  })

  it('notifies every administrator, not only the professional of the appointment', () => {
    const result = buildRecipients({
      customerEmail: 'c@x.com',
      staffEmail: 's@x.com',
      adminEmails: ['a1@x.com', 'a2@x.com'],
    })
    expect(result.map((r) => r.email)).toEqual(['c@x.com', 's@x.com', 'a1@x.com', 'a2@x.com'])
    expect(result.slice(1).every((r) => r.audience === 'business')).toBe(true)
  })

  it('an administrator who is also the professional gets one email, not two (edge case)', () => {
    const result = buildRecipients({ customerEmail: 'c@x.com', staffEmail: 'Admin@X.com', adminEmails: ['admin@x.com'] })
    expect(result.map((r) => r.email)).toEqual(['c@x.com', 'Admin@X.com'])
  })

  it('an administrator who booked for themself gets the customer version once (edge case)', () => {
    const result = buildRecipients({ customerEmail: 'admin@x.com', staffEmail: 's@x.com', adminEmails: ['admin@x.com'] })
    expect(result).toEqual([
      { email: 'admin@x.com', audience: 'customer' },
      { email: 's@x.com', audience: 'business' },
    ])
  })

  it('skips administrators without a usable email, and none at all is fine (edge cases)', () => {
    expect(buildRecipients({ customerEmail: 'c@x.com', adminEmails: [null, undefined, '', 'bad'] })).toEqual([
      { email: 'c@x.com', audience: 'customer' },
    ])
    expect(buildRecipients({ adminEmails: [] })).toEqual([])
  })

  it('notifies the administrators even when the customer and the professional have no email', () => {
    expect(buildRecipients({ adminEmails: ['a@x.com'] })).toEqual([{ email: 'a@x.com', audience: 'business' }])
  })

  it('still notifies the business when the customer has no email', () => {
    const result = buildRecipients({ customerEmail: null, adminEmails: ['o@x.com'] })
    expect(result).toEqual([{ email: 'o@x.com', audience: 'business' }])
  })
})

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'y'`)).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;',
    )
  })

  it('leaves plain text untouched', () => {
    expect(escapeHtml('Corte de cabello')).toBe('Corte de cabello')
  })
})

describe('formatDateTime', () => {
  it('converts UTC to the organization timezone (Buenos Aires, UTC-3)', () => {
    const result = formatDateTime('2026-06-10T14:00:00Z', 'America/Argentina/Buenos_Aires')
    expect(result).toMatch(/11:00/)
    expect(result).toMatch(/junio/i)
    expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase())
  })

  it('shows midnight as 00:00, not 24:00 (edge case)', () => {
    const result = formatDateTime('2026-06-10T03:00:00Z', 'America/Argentina/Buenos_Aires')
    expect(result).toMatch(/00:00/)
  })

  it('falls back to UTC when the timezone is empty or invalid', () => {
    expect(formatDateTime('2026-06-10T14:00:00Z', '')).toMatch(/14:00/)
    expect(formatDateTime('2026-06-10T14:00:00Z', 'Not/AZone')).toMatch(/14:00/)
  })

  it('returns the raw value for an invalid date instead of throwing', () => {
    expect(formatDateTime('not-a-date', 'UTC')).toBe('not-a-date')
  })
})

describe('bookingReference', () => {
  it('is the first 8 hex chars of the id, uppercased', () => {
    expect(bookingReference('3f2a9c1e-1111-2222-3333-444455556666')).toBe('3F2A9C1E')
  })
})

describe('buildEmail', () => {
  it('builds a Spanish confirmation for the customer with a CTA link', () => {
    const { subject, html } = buildEmail('booking_confirmed', data, 'customer')
    expect(subject).toBe('Turno confirmado · Corte de cabello')
    expect(html).toContain('Juan Pérez')
    expect(html).toContain('Corte de cabello')
    expect(html).toContain('María López')
    expect(html).toContain('3F2A9C1E')
    expect(html).toContain('11:00')
    expect(html).toContain('https://example.com/booking/confirmation/3f2a9c1e-1111-2222-3333-444455556666')
  })

  it('builds a cancellation without a CTA', () => {
    const { subject, html } = buildEmail('cancelled', data, 'customer')
    expect(subject).toBe('Turno cancelado · Corte de cabello')
    expect(html).not.toContain('Ver mi turno')
  })

  it('builds a reschedule email with the new time and a CTA', () => {
    const { subject, html } = buildEmail('rescheduled', data, 'customer')
    expect(subject).toBe('Turno reprogramado · Corte de cabello')
    expect(html).toContain('11:00')
    expect(html).toContain('Ver mi turno')
  })

  it('uses a business-facing subject and no CTA for the business audience', () => {
    const { subject, html } = buildEmail('booking_confirmed', data, 'business')
    expect(subject).toBe('Nuevo turno · Corte de cabello')
    expect(html).toContain('Juan Pérez')
    expect(html).not.toContain('Ver mi turno')
  })

  it('escapes HTML coming from user-controlled fields (edge case)', () => {
    const { html } = buildEmail(
      'booking_confirmed',
      { ...data, customerName: '<img src=x onerror=alert(1)>', serviceName: '<b>Spa</b>' },
      'customer',
    )
    expect(html).not.toContain('<img src=x')
    expect(html).not.toContain('<b>Spa</b>')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('falls back to a generic greeting when the customer name is empty', () => {
    const { html } = buildEmail('booking_confirmed', { ...data, customerName: '   ' }, 'customer')
    expect(html).toContain('Hola cliente')
  })

  it('does not produce a double slash when siteUrl ends with /', () => {
    const { html } = buildEmail('booking_confirmed', { ...data, siteUrl: 'https://example.com/' }, 'customer')
    expect(html).toContain('https://example.com/booking/confirmation/')
    expect(html).not.toContain('com//booking')
  })
})

describe('safeEqual', () => {
  it('matches equal strings', () => {
    expect(safeEqual('abc123', 'abc123')).toBe(true)
  })

  it('rejects different strings, different lengths and empty vs non-empty', () => {
    expect(safeEqual('abc123', 'abc124')).toBe(false)
    expect(safeEqual('abc', 'abcd')).toBe(false)
    expect(safeEqual('', 'x')).toBe(false)
  })
})
