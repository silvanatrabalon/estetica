import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  clockTime,
  untilLabel,
  type AgendaItem,
} from '../../lib/todayAgenda'

interface TodayAgendaProps {
  items: AgendaItem[]
  /** In progress now plus the ones starting next (can be several). */
  featured: AgendaItem[]
  timezone: string
  now: Date
  loading: boolean
  error: string | null
  /** When set, the whole next-appointment card and each row link to the appointment's detail. */
  detailHref?: (appointmentId: string) => string
  /** Small line under the title (the screen's date heading). */
  subtitle?: ReactNode
  /** Next to the title, on the same row (the day's total). */
  headerRight?: ReactNode
  /** Hide "con {professional}" (the professional looking at their own agenda). */
  hideStaffName?: boolean
  /** Whose agenda it is: a professional sees who is coming; a client sees which service and with whom. */
  perspective?: 'professional' | 'customer'
  /** Replaces the text of the empty state (a client sees their next appointment instead). */
  emptyContent?: ReactNode
}

/** Cards for what is on now or next. The day's total is a separate counter card on the dashboard. */
export function TodayAgenda({
  items,
  featured,
  timezone,
  now,
  loading,
  error,
  detailHref,
  subtitle,
  headerRight,
  hideStaffName = false,
  perspective = 'professional',
  emptyContent,
}: TodayAgendaProps) {
  const isCustomer = perspective === 'customer'
  const header = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-base font-extrabold leading-tight text-shell-text">
          {featured.length > 1 ? 'Ahora y siguientes' : 'Siguiente turno de hoy'}
        </h2>
        {subtitle}
      </div>
      {headerRight}
    </div>
  )

  const nameOf = (id: string, name: string) =>
    detailHref ? (
      // Stretched link: the whole card or row (a `relative` parent) becomes the click target
      <Link
        to={detailHref(id)}
        className="after:absolute after:inset-0 after:content-[''] after:rounded-[inherit] focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-[var(--color-focus-ring)]"
      >
        {name}
      </Link>
    ) : (
      name
    )

  if (loading) {
    return (
      <section aria-label="Turnos de hoy" aria-busy="true" className="space-y-3">
        {header}
        <div className="h-32 animate-pulse rounded-3xl bg-shell-muted" />
        <div className="h-64 animate-pulse rounded-3xl bg-shell-muted" />
      </section>
    )
  }

  if (error) {
    return (
      <section aria-label="Turnos de hoy" className="space-y-3">
        {header}
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      </section>
    )
  }

  return (
    <section aria-label="Turnos de hoy" className="space-y-3">
      {header}
      <div>
        {featured.length > 0 ? (
          <div className="space-y-2">
            {featured.map((card) => (
              <div key={card.id} className="relative rounded-3xl bg-[var(--color-lilac)] p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <time
                    dateTime={card.startsAt}
                    className="block text-4xl font-extrabold leading-none tracking-tight tabular-nums text-shell-text sm:text-5xl"
                  >
                    {clockTime(card.startsAt, timezone)}
                  </time>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-shell-text">
                    {untilLabel(card.startsAt, now)}
                  </span>
                </div>
                <p className="mt-2 text-lg font-extrabold leading-snug text-shell-text">
                  {nameOf(card.id, isCustomer ? card.serviceName : card.customerName)}
                </p>
                <p className="text-sm text-shell-subtleText">
                  {isCustomer
                    ? `con ${card.staffDisplayName}`
                    : `${card.serviceName}${hideStaffName ? '' : ` · con ${card.staffDisplayName}`}`}
                </p>
              </div>
            ))}
          </div>
        ) : emptyContent ? (
          <div className="rounded-3xl bg-shell-muted p-5 text-shell-text">{emptyContent}</div>
        ) : (
          <div className="rounded-3xl bg-shell-muted p-5 text-shell-text">
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
    </section>
  )
}
