import { useEffect, useState } from 'react'
import { listAppointments, type AppointmentSummary } from '../services/appointments'

export interface UseAppointmentsResult {
  appointments: AppointmentSummary[]
  loading: boolean
  error: string | null
}

export function useAppointments(): UseAppointmentsResult {
  const [appointments, setAppointments] = useState<AppointmentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    listAppointments()
      .then((data) => {
        if (!cancelled) {
          setAppointments(data)
        }
      })
      .catch((err: unknown) => {
        console.error('[useAppointments] error:', err)
        if (!cancelled) {
          setError('Ocurrió un error al cargar tus turnos.')
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
  }, [])

  return { appointments, loading, error }
}
