import { Link, useNavigate } from 'react-router-dom'
import { StatCard } from '../StatCard'
import { useUser } from '../../hooks/useUser'
import { TodayAgenda } from '../admin/TodayAgenda'
import { useMyAgenda } from '../../hooks/useMyAgenda'

const AGENDA_PATH = '/staff/appointments'
const detailHref = (id: string) => `${AGENDA_PATH}/${id}`

/** Inicio for a professional: today's agenda and counters, only their own appointments. */
export function StaffDashboard() {
  const agenda = useMyAgenda()
  const { roles, setActiveRole } = useUser()
  const navigate = useNavigate()
  const isAlsoCustomer = roles.includes('customer')

  const bookForMyself = () => {
    // The booking screens are for the customer role: switch to it first.
    setActiveRole('customer')
    navigate('/booking')
  }

  const formattedDate = (() => {
    const raw = new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  })()

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-sm font-normal text-shell-subtleText">{formattedDate}</h1>
        <Link to="/" className="text-sm font-medium text-brand-primary hover:underline">
          Ir al sitio web
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <TodayAgenda
          items={agenda.items}
          next={agenda.next}
          timezone={agenda.timezone}
          now={agenda.now}
          loading={agenda.loading}
          error={agenda.error}
          detailHref={detailHref}
          hideStaffName
        />

        <section aria-label="Resumen de tus turnos">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Mis turnos hoy" to={AGENDA_PATH} value={agenda.stats.today} loading={agenda.loading} />
            <StatCard label="Próximos turnos" to={AGENDA_PATH} value={agenda.stats.upcoming} loading={agenda.loading} />
            <StatCard label="Este mes" to={AGENDA_PATH} value={agenda.stats.month} loading={agenda.loading} />
            <StatCard
              label="Cancelados este mes"
              to={AGENDA_PATH}
              value={agenda.stats.cancelledMonth}
              loading={agenda.loading}
            />
          </div>
        </section>
      </div>

      <section aria-label="Reservar un turno" className="rounded-2xl border border-shell-border bg-white p-4">
        {isAlsoCustomer ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-shell-subtleText">¿Querés reservar un turno para vos?</p>
            <button
              type="button"
              onClick={bookForMyself}
              className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Reservar turno
            </button>
          </div>
        ) : (
          <p className="text-sm text-shell-subtleText">
            Para crear tus propias reservas a tu nombre, pedile a tu administrador que te haga cliente.
          </p>
        )}
      </section>
    </div>
  )
}
