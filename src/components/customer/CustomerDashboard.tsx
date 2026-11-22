import { Link } from 'react-router-dom'
import { TodayAgenda } from '../admin/TodayAgenda'
import { useMyAgenda } from '../../hooks/useMyAgenda'
import { formatSlotDateTime } from '../../lib/formatSlotTime'

const APPOINTMENTS_PATH = '/appointments'
const detailHref = (id: string) => `${APPOINTMENTS_PATH}/${id}`

/** Inicio for a client: what is on now or next today, or their next appointment, and a way to book. Only their own appointments. */
export function CustomerDashboard() {
  const agenda = useMyAgenda('customer')
  const formattedDate = (() => {
    const raw = new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  })()

  const next = agenda.nextAppointment

  return (
    <div className="mx-auto -mt-2 max-w-6xl space-y-3 sm:-mt-3">
      <TodayAgenda
        items={agenda.items}
        featured={agenda.featured}
        timezone={agenda.timezone}
        now={agenda.now}
        loading={agenda.loading}
        error={agenda.error}
        detailHref={detailHref}
        perspective="customer"
        subtitle={<h1 className="text-xs font-normal leading-tight text-shell-subtleText sm:text-sm">{formattedDate}</h1>}
        headerRight={
          <Link
            to="/booking"
            className="shrink-0 rounded-xl bg-brand-primary px-3 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
          >
            + Reservar
          </Link>
        }
        emptyContent={
          next ? (
            <>
              <p className="text-lg font-bold">Hoy no tenés turnos.</p>
              <p className="mt-1 text-sm text-shell-subtleText">Tu próximo turno:</p>
              <p className="relative mt-1 rounded-2xl bg-white p-3 text-sm">
                <Link
                  to={detailHref(next.id)}
                  className="font-bold text-shell-text after:absolute after:inset-0 after:content-[''] after:rounded-[inherit]"
                >
                  {next.serviceName}
                </Link>
                <span className="block text-shell-subtleText">
                  {formatSlotDateTime(next.startsAt, next.orgTimezone)} · con {next.staffDisplayName}
                </span>
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold">Todavía no tenés turnos.</p>
              <p className="mt-1 text-sm text-shell-subtleText">
                Elegí el servicio, el día y el horario que más te convenga.
              </p>
              <Link
                to="/booking"
                className="mt-3 inline-block rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
              >
                Reservar turno
              </Link>
            </>
          )
        }
      />
      <p className="text-center text-sm">
        <Link to={APPOINTMENTS_PATH} className="font-semibold text-brand-primary hover:underline">
          Ver todos mis turnos
        </Link>
      </p>
    </div>
  )
}
