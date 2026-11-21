import { useEffect, useMemo, useState } from 'react'
import { adminListAppointments } from '../services/adminAppointments'
import { getBusinessSettings } from '../services/businessSettings'
import { pickNextAppointment, todayAgendaItems, type AgendaItem } from '../lib/todayAgenda'

const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires'
const DAY_MS = 24 * 60 * 60 * 1000

/** Today's appointments (business time zone) and the next one, refreshed every minute. */
export function useTodayAgenda() {
  const [rows, setRows] = useState<AgendaItem[]>([])
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let cancelled = false
    const start = new Date(Date.now() - DAY_MS).toISOString()
    const end = new Date(Date.now() + 2 * DAY_MS).toISOString()

    getBusinessSettings()
      .then((settings) => {
        if (!cancelled && settings.timezone) setTimezone(settings.timezone)
      })
      .catch(() => {
        // Keep the default time zone: the agenda is still usable
      })

    adminListAppointments({ dateFrom: start, dateTo: end }, 1, 100)
      .then((page) => {
        if (!cancelled) setRows(page.rows)
      })
      .catch(() => {
        if (!cancelled) setError('No pudimos cargar los turnos de hoy. Probá de nuevo en unos minutos.')
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

  const items = useMemo(() => todayAgendaItems(rows, timezone, now), [rows, timezone, now])
  const next = useMemo(() => pickNextAppointment(items, now), [items, now])

  return { items, next, timezone, now, loading, error }
}
