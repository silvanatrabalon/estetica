import { describe, expect, it } from 'vitest'
import { clockTime, pickFeaturedAppointments, todayAgendaItems, untilLabel, type AgendaItem } from './todayAgenda'

const TZ = 'America/Argentina/Buenos_Aires' // UTC-3
const NOW = new Date('2026-11-21T13:18:00Z') // 10:18 in Buenos Aires

function item(id: string, startUtc: string, endUtc: string, status = 'confirmed'): AgendaItem {
  return { id, startsAt: startUtc, endsAt: endUtc, status, customerName: 'Ana', serviceName: 'Belleza de pies', staffDisplayName: 'Sil' }
}

const rows = [
  item('late', '2026-11-21T19:30:00Z', '2026-11-21T20:30:00Z', 'pending'), // 16:30
  item('early', '2026-11-21T12:00:00Z', '2026-11-21T13:00:00Z', 'completed'), // 09:00
  item('now', '2026-11-21T13:30:00Z', '2026-11-21T14:30:00Z'), // 10:30
  item('cancelled', '2026-11-21T15:00:00Z', '2026-11-21T16:00:00Z', 'cancelled'),
  item('tomorrow', '2026-11-22T13:00:00Z', '2026-11-22T14:00:00Z'),
  item('yesterday', '2026-11-20T13:00:00Z', '2026-11-20T14:00:00Z'),
]

describe('todayAgendaItems', () => {
  it('keeps only today, drops cancelled, sorts by time', () => {
    expect(todayAgendaItems(rows, TZ, NOW).map((r) => r.id)).toEqual(['early', 'now', 'late'])
  })

  it('uses the business time zone for the day boundary (edge case)', () => {
    // 02:00 UTC on the 22nd is still the 21st in Buenos Aires
    const nearMidnight = [item('n', '2026-11-22T02:00:00Z', '2026-11-22T03:00:00Z')]
    expect(todayAgendaItems(nearMidnight, TZ, NOW).map((r) => r.id)).toEqual(['n'])
    expect(todayAgendaItems(nearMidnight, 'UTC', NOW)).toEqual([])
  })

  it('returns an empty list for no rows (edge case)', () => {
    expect(todayAgendaItems([], TZ, NOW)).toEqual([])
  })
})

describe('pickFeaturedAppointments', () => {
  const today = todayAgendaItems(rows, TZ, NOW)

  it('skips finished appointments and picks the first one still ahead', () => {
    expect(pickFeaturedAppointments(today, NOW).map((i) => i.id)[0]).toBe('now')
  })

  it('picks the appointment in progress (edge case)', () => {
    expect(pickFeaturedAppointments(today, new Date('2026-11-21T13:45:00Z')).map((i) => i.id)[0]).toBe('now')
  })

  it('moves on to the next one once the current one ends (edge case)', () => {
    expect(pickFeaturedAppointments(today, new Date('2026-11-21T14:31:00Z')).map((i) => i.id)[0]).toBe('late')
  })

  it('returns null when the day is over or empty (edge case)', () => {
    expect(pickFeaturedAppointments(today, new Date('2026-11-21T21:00:00Z'))).toEqual([])
    expect(pickFeaturedAppointments([], NOW)).toEqual([])
  })

  it('does not treat a completed appointment as upcoming (edge case)', () => {
    const done = [item('d', '2026-11-21T13:30:00Z', '2026-11-21T14:30:00Z', 'completed')]
    expect(pickFeaturedAppointments(done, NOW)).toEqual([])
  })
})

describe('untilLabel', () => {
  it('reads minutes, then hours', () => {
    expect(untilLabel('2026-11-21T13:30:00Z', NOW)).toBe('en 12 min')
    expect(untilLabel('2026-11-21T14:18:00Z', NOW)).toBe('en 1 h')
    expect(untilLabel('2026-11-21T14:38:00Z', NOW)).toBe('en 1 h 20 min')
  })

  it('says "Ahora" when it already started or starts this minute (edge case)', () => {
    expect(untilLabel('2026-11-21T13:18:00Z', NOW)).toBe('Ahora')
    expect(untilLabel('2026-11-21T13:00:00Z', NOW)).toBe('Ahora')
  })

  it('does not break on invalid dates (edge case)', () => {
    expect(untilLabel('nope', NOW)).toBe('Ahora')
  })
})

describe('clockTime', () => {
  it('shows 24-hour time in the business zone', () => {
    expect(clockTime('2026-11-21T13:30:00Z', TZ)).toBe('10:30')
    expect(clockTime('2026-11-21T19:30:00Z', TZ)).toBe('16:30')
  })

  it('shows midnight as 00:00, not 24:00 (edge case)', () => {
    expect(clockTime('2026-11-21T03:00:00Z', TZ)).toBe('00:00')
  })

  it('falls back to UTC for an invalid zone and flags invalid dates (edge case)', () => {
    expect(clockTime('2026-11-21T13:30:00Z', 'Not/AZone')).toBe('13:30')
    expect(clockTime('nope', TZ)).toBe('--:--')
  })
})

describe('pickFeaturedAppointments — several at once', () => {
  const mk = (id: string, start: string, end: string, status = 'confirmed') =>
    ({ id, startsAt: start, endsAt: end, status, customerName: id, serviceName: 's', staffDisplayName: 'p' }) as AgendaItem
  const now = new Date('2026-11-21T15:00:00Z')

  it('returns every appointment in progress plus the next ones', () => {
    const items = [
      mk('a', '2026-11-21T14:30:00Z', '2026-11-21T15:30:00Z'), // in progress
      mk('b', '2026-11-21T14:45:00Z', '2026-11-21T16:00:00Z'), // in progress, other professional
      mk('c', '2026-11-21T16:00:00Z', '2026-11-21T17:00:00Z'), // next
      mk('d', '2026-11-21T16:00:00Z', '2026-11-21T16:45:00Z'), // next, same time
      mk('e', '2026-11-21T17:30:00Z', '2026-11-21T18:30:00Z'), // later: not featured
    ]
    expect(pickFeaturedAppointments(items, now).map((i) => i.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('only the earliest upcoming start time is featured (edge case)', () => {
    const items = [mk('x', '2026-11-21T16:30:00Z', '2026-11-21T17:00:00Z'), mk('y', '2026-11-21T18:00:00Z', '2026-11-21T19:00:00Z')]
    expect(pickFeaturedAppointments(items, now).map((i) => i.id)).toEqual(['x'])
  })

  it('with only appointments in progress, returns those (edge case)', () => {
    const items = [mk('a', '2026-11-21T14:30:00Z', '2026-11-21T15:30:00Z'), mk('b', '2026-11-21T14:00:00Z', '2026-11-21T15:10:00Z')]
    expect(pickFeaturedAppointments(items, now).map((i) => i.id)).toEqual(['a', 'b'])
  })

  it('skips completed ones and ones that already ended (edge case)', () => {
    const items = [
      mk('done', '2026-11-21T14:30:00Z', '2026-11-21T15:30:00Z', 'completed'),
      mk('over', '2026-11-21T13:00:00Z', '2026-11-21T14:00:00Z'),
      mk('next', '2026-11-21T16:00:00Z', '2026-11-21T17:00:00Z'),
    ]
    expect(pickFeaturedAppointments(items, now).map((i) => i.id)).toEqual(['next'])
  })

  it('an appointment ending exactly now is no longer in progress (edge case)', () => {
    expect(pickFeaturedAppointments([mk('z', '2026-11-21T14:00:00Z', '2026-11-21T15:00:00Z')], now)).toEqual([])
  })
})
