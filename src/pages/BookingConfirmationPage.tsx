import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { getAppointment, type AppointmentDetail } from '../services/appointments'
import { formatSlotTime } from '../lib/formatSlotTime'
import { formatPriceARS } from '../lib/formatPrice'

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
  const { user, isLoading: sessionLoading } = useUser()
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

  const isCancelled = apt.status === 'cancelled'
  const isCompleted = apt.status === 'completed' || apt.status === 'no_show'

  const statusBadge = isCancelled
    ? { label: 'Cancelado', className: 'bg-red-100 text-red-700' }
    : isCompleted
      ? { label: 'Completado', className: 'bg-gray-100 text-gray-600' }
      : { label: 'Confirmado', className: 'bg-green-100 text-green-800' }

  const heading = isCancelled
    ? 'Este turno fue cancelado'
    : isCompleted
      ? 'Este turno ya se realizó'
      : '¡Tu turno está reservado!'

  const isActive = !isCancelled && !isCompleted
  // Admin or staff looking at an appointment they booked for someone else
  const isForSomeoneElse = apt.customerUserId !== (user?.id ?? null)

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-4">
      {/* Celebration header */}
      <section
        className={`rounded-3xl p-6 text-center ${
          isCancelled ? 'bg-red-50' : isCompleted ? 'bg-shell-muted' : 'bg-[var(--color-lilac)]'
        }`}
      >
        <div
          aria-hidden="true"
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
            isCancelled ? 'bg-red-100 text-red-600' : isCompleted ? 'bg-white text-shell-subtleText' : 'bg-white text-emerald-600'
          }`}
        >
          {isCancelled ? '✕' : isCompleted ? '✓' : '🎉'}
        </div>
        <h1 className="mt-4 font-heading text-2xl font-extrabold text-shell-text sm:text-3xl">{heading}</h1>
        <div className="mt-2 flex items-center justify-center gap-2 text-sm text-shell-subtleText">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
          <span>
            Referencia <span className="font-mono font-semibold text-shell-text">{bookingReference}</span>
          </span>
        </div>
      </section>

      {isActive && isForSomeoneElse && (
        <p
          role="note"
          className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          <span aria-hidden="true" className="text-lg leading-none">✉️</span>
          <span>
            <strong>Turno reservado{apt.customerName ? ` para ${apt.customerName}` : ''}.</strong> Avisamos por email
            al profesional y, si la persona tiene email, también a ella.
          </span>
        </p>
      )}

      {isActive && !isForSomeoneElse && (
        <p
          role="note"
          className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          <span aria-hidden="true" className="text-lg leading-none">✉️</span>
          <span>
            <strong>Te enviamos un email con la confirmación</strong> de tu reserva. Si no lo ves, revisá la carpeta de
            correo no deseado.
          </span>
        </p>
      )}

      {/* Details */}
      <section className="rounded-3xl border border-shell-border bg-white p-5">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div className="col-span-2">
            <dt className="text-xs uppercase tracking-wide text-shell-subtleText">Servicio</dt>
            <dd className="font-semibold text-shell-text">{apt.serviceName}</dd>
            <dd className="text-sm text-shell-subtleText">
              {apt.serviceDurationMinutes} min · {formatPriceARS(apt.servicePriceCents)}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs uppercase tracking-wide text-shell-subtleText">Fecha y hora</dt>
            <dd className="font-semibold capitalize text-shell-text">{formattedDate}</dd>
            <dd className="text-sm text-shell-subtleText">{formattedTime}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-shell-subtleText">Profesional</dt>
            <dd className="font-semibold text-shell-text">{apt.staffDisplayName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-shell-subtleText">Negocio</dt>
            <dd className="font-semibold text-shell-text">{apt.orgName}</dd>
          </div>
        </dl>
      </section>

      {/* Actions: stacked, full width and right below the details so they are never hidden on phones */}
      <div className="flex flex-col gap-3">
        {isCancelled ? (
          <>
            <Link
              to="/booking"
              className="rounded-xl bg-brand-primary px-4 py-3.5 text-center font-semibold text-white transition-opacity hover:opacity-90"
            >
              Reservar de nuevo
            </Link>
            <Link
              to="/appointments"
              className="rounded-xl border border-shell-border bg-white px-4 py-3.5 text-center font-semibold text-shell-text transition-colors hover:bg-shell-muted"
            >
              Ver mis turnos
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/booking"
              className="rounded-xl bg-brand-primary px-4 py-3.5 text-center font-semibold text-white transition-opacity hover:opacity-90"
            >
              Hacer otra reserva
            </Link>
            <Link
              to="/appointments"
              className="rounded-xl border border-shell-border bg-white px-4 py-3.5 text-center font-semibold text-shell-text transition-colors hover:bg-shell-muted"
            >
              Ver mis turnos
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
