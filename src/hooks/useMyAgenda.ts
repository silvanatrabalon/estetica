import { useEffect, useMemo, useState } from 'react'
import { listMyCustomerAppointments, listMyStaffAppointments, type AppointmentSummary } from '../services/appointments'
import { pickFeaturedAppointments, todayAgendaItems, type AgendaItem } from '../lib/todayAgenda'
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

/**
 * The logged-in person's own appointments: today's agenda, what is on now or next, and counters.
 * `staff` (default): the ones where they are the professional. `customer`: the ones they booked as a client.
 */
export function useMyAgenda(scope: 'staff' | 'customer' = 'staff') {
  const [appointments, setAppointments] = useState<AppointmentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let cancelled = false
    ;(scope === 'customer' ? listMyCustomerAppointments() : listMyStaffAppointments())
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
  }, [scope])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const timezone = appointments[0]?.orgTimezone || DEFAULT_TIMEZONE
  const items = useMemo(
    () => todayAgendaItems(appointments.map(toAgendaItem), timezone, now),
    [appointments, timezone, now],
  )
  const featured = useMemo(() => pickFeaturedAppointments(items, now), [items, now])
  const stats: StaffStats = useMemo(
    () => computeStaffStats(appointments, timezone, now),
    [appointments, timezone, now],
  )

  // The next one to come, in any day: what a client sees when nothing is left today
  const nextAppointment = useMemo(
    () =>
      appointments
        .filter((a) => (a.status === 'pending' || a.status === 'confirmed') && new Date(a.startsAt) > now)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ?? null,
    [appointments, now],
  )

  return { items, featured, timezone, now, stats, nextAppointment, loading, error }
}
