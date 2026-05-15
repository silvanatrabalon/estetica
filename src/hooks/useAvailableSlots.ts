import { useEffect, useState } from 'react'
import { getAvailableSlots, type AvailableSlot } from '../services/availability'

export interface UseAvailableSlotsResult {
  slots: AvailableSlot[]
  loading: boolean
  error: string | null
}

/**
 * Fetches available time slots for a service on a given date.
 * Does nothing when either input is null.
 * Resets and re-fetches when inputs change.
 */
export function useAvailableSlots(
  serviceId: string | null,
  date: string | null,
): UseAvailableSlotsResult {
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!serviceId || !date) {
      setSlots([])
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false

    setSlots([])
    setLoading(true)
    setError(null)

    getAvailableSlots(serviceId, date)
      .then((data) => {
        if (!cancelled) {
          setSlots(data)
        }
      })
      .catch((err: unknown) => {
        console.error('[useAvailableSlots] RPC error:', err)
        if (!cancelled) {
          setError('No pudimos cargar los horarios disponibles. Intentá de nuevo.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [serviceId, date])

  return { slots, loading, error }
}
