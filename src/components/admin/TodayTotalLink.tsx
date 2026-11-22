import { Link } from 'react-router-dom'

interface TodayTotalLinkProps {
  count: number
  loading: boolean
  /** Where the total leads: the appointments list filtered by today. */
  to: string
}

/** Compact pill with the day's total ("14 turnos hoy") that opens the list of appointments. */
export function TodayTotalLink({ count, loading, to }: TodayTotalLinkProps) {
  const label = loading ? 'turnos hoy' : count === 1 ? 'turno hoy' : 'turnos hoy'
  return (
    <Link
      to={to}
      aria-label={loading ? 'Turnos hoy' : `${count} ${label}`}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-lilac)] px-3 py-1.5 text-sm font-bold text-shell-text transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
    >
      <span className="text-lg font-extrabold leading-none tabular-nums">{loading ? '–' : count}</span>
      <span>{label}</span>
    </Link>
  )
}
