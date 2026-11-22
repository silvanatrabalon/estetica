import { TodayTotalLink } from '../components/admin/TodayTotalLink'
import { useAdminDashboardStats } from '../hooks/useAdminDashboardStats'
import { TodayAgenda } from '../components/admin/TodayAgenda'
import { useTodayAgenda } from '../hooks/useTodayAgenda'

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
    <div className="mx-auto -mt-2 max-w-6xl space-y-3 sm:-mt-3">
      {/* Stats error */}
      {statsError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
          {statsError}
        </div>
      )}

      <TodayAgenda
        items={agenda.items}
        featured={agenda.featured}
        timezone={agenda.timezone}
        now={agenda.now}
        loading={agenda.loading}
        error={agenda.error}
        detailHref={(id) => `/admin/appointments/${id}`}
        subtitle={
          // The date is the page heading, so the screen still has an h1 for assistive tech
          <h1 className="text-xs font-normal leading-tight text-shell-subtleText sm:text-sm">{formattedDate}</h1>
        }
        headerRight={
          <TodayTotalLink
            count={stats?.todayCount ?? 0}
            loading={statsLoading}
            to="/admin/appointments?periodo=today"
          />
        }
      />
    </div>
  )
}
