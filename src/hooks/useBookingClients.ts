import { useEffect, useState } from 'react'
import { listBookingClients, type BookingClient } from '../services/bookingClients'

/** Client accounts for the "book for a client" picker. Idle (empty) unless `enabled`. */
export function useBookingClients(enabled: boolean) {
  const [clients, setClients] = useState<BookingClient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setLoading(true)
    setError(null)
    listBookingClients()
      .then((list) => {
        if (!cancelled) setClients(list)
      })
      .catch(() => {
        if (!cancelled) setError('No pudimos cargar la lista de clientes.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { clients, loading, error }
}
