import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import {
  listAppointments,
  listMyCustomerAppointments,
  listMyStaffAppointments,
  type AppointmentSummary,
} from '../services/appointments'

export interface UseAppointmentsResult {
  appointments: AppointmentSummary[]
  loading: boolean
  error: string | null
  setAppointments: Dispatch<SetStateAction<AppointmentSummary[]>>
}

/**
 * `scope: 'staff'` loads only the appointments where the user is the professional, even for admins.
 * `scope: 'customer'` loads only the ones the user booked as a client, whatever other roles they have.
 * The default scope depends on the user's real roles.
 */
export function useAppointments(
  options: { scope?: 'default' | 'staff' | 'customer' } = {},
): UseAppointmentsResult {
  const scope = options.scope ?? 'default'
  const [appointments, setAppointments] = useState<AppointmentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    const load =
      scope === 'staff'
        ? listMyStaffAppointments()
        : scope === 'customer'
          ? listMyCustomerAppointments()
          : listAppointments()
    load
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
