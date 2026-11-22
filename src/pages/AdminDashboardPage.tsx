import { StatCard } from '../components/StatCard'
import { useAdminDashboardStats } from '../hooks/useAdminDashboardStats'
import { TodayAgenda } from '../components/admin/TodayAgenda'
import { useTodayAgenda } from '../hooks/useTodayAgenda'

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconCalendarDay() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconCalendarWeek() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="13" y2="18" />
    </svg>
  )
}

function IconCalendarMonth() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <circle cx="8" cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="19" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconXCircle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminDashboardPage() {
  const { stats, loading: statsLoading, error: statsError } = useAdminDashboardStats()
  const agenda = useTodayAgenda()

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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Stats error */}
      {statsError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
          {statsError}
        </div>
      )}

      {/* The date is the page heading, so the screen still has an h1 for assistive tech */}
      <h1 className="text-sm font-normal text-shell-subtleText">{formattedDate}</h1>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <TodayAgenda
          items={agenda.items}
          next={agenda.next}
          timezone={agenda.timezone}
          now={agenda.now}
          loading={agenda.loading}
          error={agenda.error}
        />

        <section aria-label="Métricas principales">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Turnos hoy"
              to="/admin/appointments?periodo=today"
              value={stats?.todayCount ?? 0}
              loading={statsLoading}
              icon={<IconCalendarDay />}
            />
            <StatCard
              label="Próximos turnos"
              to="/admin/appointments?periodo=upcoming"
              value={stats?.upcomingCount ?? 0}
              loading={statsLoading}
              icon={<IconCalendarWeek />}
            />
            <StatCard
              label="Turnos este mes"
              to="/admin/appointments?periodo=month"
              value={stats?.monthCount ?? 0}
              loading={statsLoading}
              icon={<IconCalendarMonth />}
            />
            <StatCard
              label="Cancelados este mes"
              to="/admin/appointments?periodo=month&estado=cancelled"
              value={stats?.cancelledCount ?? 0}
              loading={statsLoading}
              icon={<IconXCircle />}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
