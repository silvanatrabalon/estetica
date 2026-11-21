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

/** The appointment in progress or the first one still to come; null when the day is over. */
export function pickNextAppointment(items: AgendaItem[], now: Date = new Date()): AgendaItem | null {
  const nowMs = now.getTime()
  return items.find((item) => new Date(item.endsAt).getTime() > nowMs && item.status !== 'completed') ?? null
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

export const AGENDA_STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmado',
  pending: 'Pendiente',
  completed: 'Hecho',
}
