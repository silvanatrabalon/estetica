import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { getAppointment, type AppointmentDetail } from '../services/appointments'
import { formatSlotTime } from '../lib/formatSlotTime'

type PageState = 'loading' | 'success' | 'not-found' | 'error'

function formatAppointmentDate(isoUtc: string, orgTimezone: string): string {
  let timezone = 'UTC'
  if (orgTimezone) {
    try {
      Intl.DateTimeFormat('es', { timeZone: orgTimezone })
      timezone = orgTimezone
    } catch {
      // fall back to UTC
    }
  }
  return new Intl.DateTimeFormat('es', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(isoUtc))
}

export function BookingConfirmationPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const { isLoading: sessionLoading } = useUser()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null)

  useEffect(() => {
    if (sessionLoading) return
    if (!appointmentId) {
      setPageState('not-found')
      return
    }

    let cancelled = false

    getAppointment(appointmentId)
      .then((result) => {
        if (cancelled) return
        if (result === null) {
          setPageState('not-found')
        } else {
          setAppointment(result)
          setPageState('success')
        }
      })
      .catch(() => {
        if (cancelled) return
        setPageState('error')
      })

    return () => {
      cancelled = true
    }
  }, [appointmentId, sessionLoading])

  if (pageState === 'loading') {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-shell-accent mx-auto mb-4" />
        <p className="text-shell-subtleText">Cargando tu turno...</p>
      </div>
    )
  }

  if (pageState === 'not-found') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <p className="text-shell-subtleText mb-6">
          No encontramos tu turno. Verificá que el enlace sea correcto.
        </p>
        <Link
          to="/booking"
          className="text-shell-accent underline underline-offset-2 hover:opacity-80"
        >
          Hacer una reserva
        </Link>
      </div>
    )
  }

  if (pageState === 'error') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <p className="text-shell-subtleText mb-6">
          Ocurrió un error al cargar tu turno. Intentá de nuevo.
        </p>
        <Link
          to="/booking"
          className="text-shell-accent underline underline-offset-2 hover:opacity-80"
        >
          Volver al inicio
        </Link>
      </div>
    )
  }

  // success
  const apt = appointment!
  const bookingReference = apt.id.slice(-8).toUpperCase()
  const formattedDate = formatAppointmentDate(apt.startsAt, apt.orgTimezone)
  const formattedTime = formatSlotTime(apt.startsAt, apt.orgTimezone)

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="mb-6">
        <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
          Confirmado
        </span>
      </div>

      <h1 className="text-3xl font-heading font-bold text-shell-text mb-2">
        ¡Tu turno está reservado!
      </h1>
      <p className="text-shell-subtleText mb-8">
        Referencia de reserva:{' '}
        <span className="font-mono font-semibold text-shell-text">
          {bookingReference}
        </span>
      </p>

      <div className="bg-shell-surface border border-shell-border rounded-xl p-6 space-y-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-wide text-shell-subtleText mb-1">
            Servicio
          </p>
          <p className="font-semibold text-shell-text">{apt.serviceName}</p>
          <p className="text-sm text-shell-subtleText">
            {apt.serviceDurationMinutes} min · $
            {(apt.servicePriceCents / 100).toLocaleString('es-AR', {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-shell-subtleText mb-1">
            Fecha y hora
          </p>
          <p className="font-semibold text-shell-text capitalize">
            {formattedDate}
          </p>
          <p className="text-sm text-shell-subtleText">{formattedTime}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-shell-subtleText mb-1">
            Profesional
          </p>
          <p className="font-semibold text-shell-text">{apt.staffDisplayName}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-shell-subtleText mb-1">
            Negocio
          </p>
          <p className="font-semibold text-shell-text">{apt.orgName}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/appointments"
          className="flex-1 text-center px-4 py-3 rounded-lg bg-shell-accent text-white font-medium hover:opacity-90 transition-opacity"
        >
          Ver mis turnos
        </Link>
        <Link
          to="/booking"
          className="flex-1 text-center px-4 py-3 rounded-lg border border-shell-border text-shell-text font-medium hover:bg-shell-surface transition-colors"
        >
          Hacer otra reserva
        </Link>
      </div>
    </div>
  )
}
