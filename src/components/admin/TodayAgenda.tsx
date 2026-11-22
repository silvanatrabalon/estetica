import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import {
  AGENDA_STATUS_LABEL,
  clockTime,
  untilLabel,
  type AgendaItem,
} from '../../lib/todayAgenda'

interface TodayAgendaProps {
  items: AgendaItem[]
  next: AgendaItem | null
  timezone: string
  now: Date
  loading: boolean
  error: string | null
  /** When set, each appointment links to its detail. */
  detailHref?: (appointmentId: string) => string
  /** Hide "con {professional}" (the professional looking at their own agenda). */
  hideStaffName?: boolean
}

function StatusPill({ status, className }: { status: string; className?: string }) {
  const label = AGENDA_STATUS_LABEL[status] ?? status
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2.5 py-1 text-xs font-bold',
        status === 'pending'
          ? 'bg-[var(--color-peach)] text-[var(--color-peach-ink)]'
          : 'bg-brand-secondary text-shell-text',
        className,
      )}
    >
      {label}
    </span>
  )
}

/** "Siguiente turno de hoy" card plus the day's list, in time order. */
export function TodayAgenda({
  items,
  next,
  timezone,
  now,
  loading,
  error,
  detailHref,
  hideStaffName = false,
}: TodayAgendaProps) {
  const nameOf = (id: string, name: string) =>
    detailHref ? (
      <Link to={detailHref(id)} className="hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]">
        {name}
      </Link>
    ) : (
      name
    )

  if (loading) {
    return (
      <section aria-label="Turnos de hoy" aria-busy="true" className="space-y-4">
        <div className="h-44 animate-pulse rounded-3xl bg-shell-muted" />
        <div className="h-64 animate-pulse rounded-3xl bg-shell-muted" />
      </section>
    )
  }

  if (error) {
    return (
      <section aria-label="Turnos de hoy">
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      </section>
    )
  }

  return (
    <section aria-label="Turnos de hoy" className="space-y-6">
      <div>
        <h2 className="text-base font-extrabold text-shell-text">Siguiente turno de hoy</h2>
        {next ? (
          <div className="mt-2 rounded-3xl bg-[var(--color-lilac)] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <time
                dateTime={next.startsAt}
                className="block text-6xl font-extrabold leading-none tracking-tight tabular-nums text-shell-text"
              >
                {clockTime(next.startsAt, timezone)}
              </time>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-shell-text">
                {untilLabel(next.startsAt, now)}
              </span>
            </div>
            <p className="mt-3 text-xl font-extrabold text-shell-text">{nameOf(next.id, next.customerName)}</p>
            <p className="mt-0.5 text-base text-shell-subtleText">
              {next.serviceName}
              {hideStaffName ? '' : ` · con ${next.staffDisplayName}`}
            </p>
          </div>
        ) : (
          <div className="mt-2 rounded-3xl bg-shell-muted p-5 text-shell-text">
            <p className="text-lg font-bold">
              {items.length === 0 ? 'Hoy no tenés turnos.' : 'No quedan turnos por hoy.'}
            </p>
            <p className="mt-1 text-sm text-shell-subtleText">
              {items.length === 0
                ? 'Cuando alguien reserve para hoy, lo vas a ver acá.'
                : 'Ya terminaron todos los de hoy.'}
            </p>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div>
          <h2 className="text-base font-extrabold text-shell-text">
            Hoy · {items.length} {items.length === 1 ? 'turno' : 'turnos'}
          </h2>
          <ul className="mt-2 divide-y divide-shell-border rounded-3xl border border-shell-border bg-white px-4">
            {items.map((item) => {
              const isNext = next?.id === item.id
              const isDone = item.status === 'completed'
              return (
                <li
                  key={item.id}
                  aria-current={isNext ? 'true' : undefined}
                  className={cn(
                    'grid min-h-16 grid-cols-[3.5rem_1fr] items-center gap-x-3 gap-y-1 py-3 sm:grid-cols-[3.5rem_1fr_auto]',
                    isNext && '-mx-4 rounded-2xl bg-[var(--color-lilac)] px-4',
                    isDone && 'opacity-60',
                  )}
                >
                  <time
                    dateTime={item.startsAt}
                    className="row-span-2 self-start pt-0.5 text-lg font-extrabold tabular-nums text-shell-text sm:row-span-1 sm:self-center sm:pt-0"
                  >
                    {clockTime(item.startsAt, timezone)}
                  </time>
                  <div className="min-w-0">
                    <p className="text-base font-semibold leading-snug text-shell-text">{nameOf(item.id, item.customerName)}</p>
                    <p className="text-sm leading-snug text-shell-subtleText">{item.serviceName}</p>
                  </div>
                  <StatusPill status={item.status} className="col-start-2 justify-self-start sm:col-start-3 sm:row-start-1 sm:justify-self-end" />
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
