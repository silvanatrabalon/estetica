import { useEffect, useState } from 'react'
import { getAvailableDays } from '../services/availability'

export interface UseAvailableDaysResult {
  /** date key (YYYY-MM-DD) -> free slots. Days not in the map cannot be booked. */
  days: Map<string, number>
  loading: boolean
  error: string | null
}

/** Free days (with slot counts) for a service in a date range. Idle when any input is null. */
export function useAvailableDays(
  serviceId: string | null,
  from: string | null,
  to: string | null,
): UseAvailableDaysResult {
  const [days, setDays] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!serviceId || !from || !to) {
      setDays(new Map())
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setDays(new Map())
    setLoading(true)
    setError(null)

    getAvailableDays(serviceId, from, to)
      .then((rows) => {
        if (!cancelled) setDays(new Map(rows.map((r) => [r.day, r.slotCount])))
      })
      .catch(() => {
        if (!cancelled) setError('No pudimos cargar los días disponibles. Intentá de nuevo.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [serviceId, from, to])

  return { days, loading, error }
}
