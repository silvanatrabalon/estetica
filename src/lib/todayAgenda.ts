import { toLocalDateKey } from './formatSlotTime'

export interface AgendaItem {
  id: string
  startsAt: string
  endsAt: string
  status: string
  customerName: string
  serviceName: string
  staffDisplayName: string
}

/** Today's appointments in the business time zone, cancelled ones removed, in time order. */
export function todayAgendaItems(rows: AgendaItem[], timezone: string, now: Date = new Date()): AgendaItem[] {
  const todayKey = toLocalDateKey(now.toISOString(), timezone)
  return rows
    .filter((row) => row.status !== 'cancelled' && toLocalDateKey(row.startsAt, timezone) === todayKey)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
}

/**
 * What to put in the top cards: every appointment in progress right now (there can be several, one
 * per professional) plus every one that starts at the next start time. Empty when the day is over.
 */
export function pickFeaturedAppointments(items: AgendaItem[], now: Date = new Date()): AgendaItem[] {
  const nowMs = now.getTime()
  const open = items.filter((item) => new Date(item.endsAt).getTime() > nowMs && item.status !== 'completed')
  const inProgress = open.filter((item) => new Date(item.startsAt).getTime() <= nowMs)
  const upcoming = open.filter((item) => new Date(item.startsAt).getTime() > nowMs)
  if (upcoming.length === 0) return inProgress
  const nextStart = Math.min(...upcoming.map((item) => new Date(item.startsAt).getTime()))
  return [...inProgress, ...upcoming.filter((item) => new Date(item.startsAt).getTime() === nextStart)]
}

/** "Ahora", "en 12 min", "en 1 h 20 min". */
export function untilLabel(startsAt: string, now: Date = new Date()): string {
  const minutes = Math.round((new Date(startsAt).getTime() - now.getTime()) / 60000)
  if (Number.isNaN(minutes) || minutes <= 0) return 'Ahora'
  if (minutes < 60) return `en ${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `en ${hours} h` : `en ${hours} h ${rest} min`
}

/** 24-hour clock time in the business time zone, e.g. "10:30". Invalid input returns "--:--". */
export function clockTime(isoUtc: string, timezone: string): string {
  const date = new Date(isoUtc)
  if (Number.isNaN(date.getTime())) return '--:--'
  let zone = 'UTC'
  if (timezone) {
    try {
      Intl.DateTimeFormat('es', { timeZone: timezone })
      zone = timezone
    } catch {
      // Invalid time zone: fall back to UTC
    }
  }
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: zone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
}
