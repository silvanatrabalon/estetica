import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../lib/cn'
import { formatSlotTime, toLocalDateKey } from '../lib/formatSlotTime'
import { getBusinessSettings } from '../services/businessSettings'
import { adminListAppointments, type AdminAppointmentRow } from '../services/adminAppointments'
import { StatCard } from '../components/StatCard'
import { useAdminDashboardStats } from '../hooks/useAdminDashboardStats'

// ── Currency formatter ────────────────────────────────────────────────────────

function formatARS(cents: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Completado',
  no_show: 'No asistió',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-800',
  no_show: 'bg-gray-100 text-gray-600',
}

// ── Quick-access cards ────────────────────────────────────────────────────────

const QUICK_ACCESS = [
  { label: 'Turnos', href: '/admin/appointments' },
  { label: 'Calendario', href: '/admin/calendar' },
  { label: 'Profesionales', href: '/admin/staff' },
  { label: 'Servicios', href: '/admin/services' },
]

// ── Analytics breakdown ───────────────────────────────────────────────────────

const ANALYTICS_STATUSES = [
  { key: 'confirmed' as const, label: 'Confirmado' },
  { key: 'pending' as const, label: 'Pendiente' },
  { key: 'cancelled' as const, label: 'Cancelado' },
  { key: 'completed' as const, label: 'Completado' },
  { key: 'no_show' as const, label: 'No presentado' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminDashboardPage() {
  const { stats, loading: statsLoading, error: statsError } = useAdminDashboardStats()

  const [orgTimezone, setOrgTimezone] = useState('UTC')
  const [todayRows, setTodayRows] = useState<AdminAppointmentRow[]>([])
  const [todayLoading, setTodayLoading] = useState(true)
  const [todayError, setTodayError] = useState<string | null>(null)

  // Fetch org timezone then today's appointments
  useEffect(() => {
    let cancelled = false

    getBusinessSettings()
      .then((settings) => {
        if (cancelled) return
        const tz = settings.timezone || 'UTC'
        setOrgTimezone(tz)

        // Build today's date range in org timezone
        const now = new Date()
        const todayKey = toLocalDateKey(now.toISOString(), tz)
        const dateFrom = `${todayKey}T00:00:00.000Z`
        const dateTo = `${todayKey}T23:59:59.999Z`

        setTodayLoading(true)
        setTodayError(null)

        return adminListAppointments({ dateFrom, dateTo }, 1, 10)
      })
      .then((result) => {
        if (!cancelled && result) {
          setTodayRows(result.rows)
        }
      })
      .catch((err: unknown) => {
        console.error('[AdminDashboardPage] today appointments error:', err)
        if (!cancelled) {
          setTodayError('Ocurrió un error al cargar los turnos de hoy.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setTodayLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  // ── Today KPI: confirmed + pending ────────────────────────────────────────
  // Derived from all-org stats; the "today" context is the appointments widget
  const confirmedPendingToday = stats ? stats.confirmedCount + stats.pendingCount : 0

  // ── Analytics: total for percentages ──────────────────────────────────────
  const analyticsTotal = stats
    ? stats.confirmedCount +
      stats.pendingCount +
      stats.cancelledCount +
      stats.completedCount +
      stats.noShowCount
    : 0

  function pct(count: number): string {
    if (analyticsTotal === 0) return '0%'
    return `${Math.round((count / analyticsTotal) * 100)}%`
  }

  const analyticsCountByKey = stats
    ? {
        confirmed: stats.confirmedCount,
        pending: stats.pendingCount,
        cancelled: stats.cancelledCount,
        completed: stats.completedCount,
        no_show: stats.noShowCount,
      }
    : null

  return (
    <div className="space-y-8 p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Panel de administración</h1>

      {/* Stats error */}
      {statsError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
          {statsError}
        </div>
      )}

      {/* KPI cards */}
      <section aria-label="Métricas principales">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Turnos hoy" value={stats?.todayCount ?? 0} loading={statsLoading} />
          <StatCard label="Turnos esta semana" value={stats?.weekCount ?? 0} loading={statsLoading} />
          <StatCard label="Turnos este mes" value={stats?.monthCount ?? 0} loading={statsLoading} />
          <StatCard
            label="Confirmados + pendientes hoy"
            value={confirmedPendingToday}
            loading={statsLoading}
          />
          <StatCard
            label="Ingresos estimados este mes"
            value={stats ? formatARS(stats.revenueCentsMonth) : '—'}
            loading={statsLoading}
          />
        </div>
      </section>

      {/* Quick-access cards */}
      <section aria-label="Acceso rápido">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Acceso rápido</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {QUICK_ACCESS.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="bg-white rounded-xl border border-gray-200 p-4 text-center font-medium text-gray-700 hover:border-pink-300 hover:text-pink-700 transition-colors shadow-sm"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Today's appointments widget */}
      <section aria-label="Turnos de hoy">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Turnos de hoy</h2>
          <Link
            to="/admin/appointments"
            className="text-sm text-pink-600 hover:underline font-medium"
          >
            Ver todos los turnos
          </Link>
        </div>

        {todayLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : todayError ? (
          <p className="text-sm text-red-600">{todayError}</p>
        ) : todayRows.length === 0 ? (
          <p className="text-sm text-gray-500">No hay turnos para hoy.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2 text-left">Hora</th>
                  <th className="px-4 py-2 text-left">Cliente</th>
                  <th className="px-4 py-2 text-left">Servicio</th>
                  <th className="px-4 py-2 text-left">Profesional</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {todayRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatSlotTime(row.startsAt, orgTimezone)}
                    </td>
                    <td className="px-4 py-2">{row.customerName}</td>
                    <td className="px-4 py-2">{row.serviceName}</td>
                    <td className="px-4 py-2">{row.staffDisplayName}</td>
                    <td className="px-4 py-2">
                      <span
                        className={cn(
                          'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                          STATUS_COLORS[row.status] ?? 'bg-gray-100 text-gray-600',
                        )}
                      >
                        {STATUS_LABELS[row.status] ?? row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Analytics status breakdown */}
      <section aria-label="Análisis de turnos del mes">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Resumen del mes actual
        </h2>

        {statsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 rounded bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2 text-left">Estado</th>
                  <th className="px-4 py-2 text-right">Cantidad</th>
                  <th className="px-4 py-2 text-right">% del total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {ANALYTICS_STATUSES.map(({ key, label }) => {
                  const count = analyticsCountByKey?.[key] ?? 0
                  return (
                    <tr key={key}>
                      <td className="px-4 py-2">
                        <span
                          className={cn(
                            'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                            STATUS_COLORS[key] ?? 'bg-gray-100 text-gray-600',
                          )}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-medium">{count}</td>
                      <td className="px-4 py-2 text-right text-gray-500">{pct(count)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
