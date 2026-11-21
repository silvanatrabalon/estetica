import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { listAppointments, listMyStaffAppointments, type AppointmentSummary } from '../services/appointments'

export interface UseAppointmentsResult {
  appointments: AppointmentSummary[]
  loading: boolean
  error: string | null
  setAppointments: Dispatch<SetStateAction<AppointmentSummary[]>>
}

/**
 * `scope: 'staff'` loads only the appointments where the user is the professional,
 * even for admins. The default scope depends on the user's role (customer: own bookings).
 */
export function useAppointments(options: { scope?: 'default' | 'staff' } = {}): UseAppointmentsResult {
  const scope = options.scope ?? 'default'
  const [appointments, setAppointments] = useState<AppointmentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    ;(scope === 'staff' ? listMyStaffAppointments() : listAppointments())
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
  }, [scope])

  return { appointments, loading, error, setAppointments }
}
