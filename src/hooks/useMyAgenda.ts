import { useEffect, useMemo, useState } from 'react'
import { listMyStaffAppointments, type AppointmentSummary } from '../services/appointments'
import { pickNextAppointment, todayAgendaItems, type AgendaItem } from '../lib/todayAgenda'
import { computeStaffStats, type StaffStats } from '../lib/staffStats'

const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires'

function toAgendaItem(apt: AppointmentSummary): AgendaItem {
  return {
    id: apt.id,
    startsAt: apt.startsAt,
    endsAt: apt.endsAt,
    status: apt.status,
    customerName: apt.customerName ?? 'Cliente sin nombre',
    serviceName: apt.serviceName,
    staffDisplayName: apt.staffDisplayName,
  }
}

/** The logged-in professional's own appointments: today's agenda, the next one, and counters. */
export function useMyAgenda() {
  const [appointments, setAppointments] = useState<AppointmentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let cancelled = false
    listMyStaffAppointments()
      .then((data) => {
        if (!cancelled) setAppointments(data)
      })
      .catch(() => {
        if (!cancelled) setError('No pudimos cargar tus turnos. Probá de nuevo en unos minutos.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const timezone = appointments[0]?.orgTimezone || DEFAULT_TIMEZONE
  const items = useMemo(
    () => todayAgendaItems(appointments.map(toAgendaItem), timezone, now),
    [appointments, timezone, now],
  )
  const next = useMemo(() => pickNextAppointment(items, now), [items, now])
  const stats: StaffStats = useMemo(
    () => computeStaffStats(appointments, timezone, now),
    [appointments, timezone, now],
  )

  return { items, next, timezone, now, stats, loading, error }
}
