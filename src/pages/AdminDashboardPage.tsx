import { useState, useEffect } from 'react'
import { cn } from '../lib/cn'
import { getBusinessSettings } from '../services/businessSettings'
import { StatCard } from '../components/StatCard'
import { useAdminDashboardStats } from '../hooks/useAdminDashboardStats'
import { getAdminStatsByRange, type AdminRangeStats } from '../services/adminDashboard'

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
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-800',
}

// ── Analytics breakdown ───────────────────────────────────────────────────────

const ANALYTICS_STATUSES = [
  { key: 'confirmed' as const, label: 'Confirmado' },
  { key: 'pending' as const, label: 'Pendiente' },
  { key: 'cancelled' as const, label: 'Cancelado' },
  { key: 'completed' as const, label: 'Completado' },
]

type RangePreset = 'today' | 'last_month' | 'last_6_months' | 'last_year'

const PRESET_LABELS: Record<RangePreset, string> = {
  today: 'Hoy',
  last_month: 'Último mes',
  last_6_months: 'Últimos 6 meses',
  last_year: 'Último año',
}

function getPresetRange(preset: RangePreset): { dateFrom: string; dateTo: string } {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const dateTo = today

  if (preset === 'today') {
    return { dateFrom: today, dateTo }
  }
  if (preset === 'last_month') {
    const d = new Date(now)
    d.setMonth(d.getMonth() - 1)
    return { dateFrom: d.toISOString().slice(0, 10), dateTo }
  }
  if (preset === 'last_6_months') {
    const d = new Date(now)
    d.setMonth(d.getMonth() - 6)
    return { dateFrom: d.toISOString().slice(0, 10), dateTo }
  }
  // last_year
  const d = new Date(now)
  d.setFullYear(d.getFullYear() - 1)
  return { dateFrom: d.toISOString().slice(0, 10), dateTo }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminDashboardPage() {
  const { stats, loading: statsLoading, error: statsError } = useAdminDashboardStats()

  const [rangePreset, setRangePreset] = useState<RangePreset>('last_month')
  const [rangeStats, setRangeStats] = useState<AdminRangeStats | null>(null)
  const [rangeLoading, setRangeLoading] = useState(false)
  const [rangeError, setRangeError] = useState<string | null>(null)

  // Fetch business settings for KPI timezone (non-blocking)
  useEffect(() => {
    void getBusinessSettings().catch(() => {})
  }, [])

  // Fetch analytics whenever preset changes
  useEffect(() => {
    let cancelled = false
    setRangeLoading(true)
    setRangeError(null)
    const { dateFrom, dateTo } = getPresetRange(rangePreset)
    getAdminStatsByRange(dateFrom, dateTo)
      .then((data) => { if (!cancelled) setRangeStats(data) })
      .catch(() => { if (!cancelled) setRangeError('Las analíticas por rango estarán disponibles próximamente.') })
      .finally(() => { if (!cancelled) setRangeLoading(false) })
    return () => { cancelled = true }
  }, [rangePreset])

  const confirmedPendingToday = stats ? stats.confirmedCount + stats.pendingCount : 0

  const analyticsTotal = rangeStats
    ? rangeStats.confirmedCount + rangeStats.pendingCount + rangeStats.cancelledCount + rangeStats.completedCount
    : 0

  function pct(count: number): string {
    if (analyticsTotal === 0) return '0%'
    return `${Math.round((count / analyticsTotal) * 100)}%`
  }

  const analyticsCountByKey = rangeStats
    ? {
        confirmed: rangeStats.confirmedCount,
        pending: rangeStats.pendingCount,
        cancelled: rangeStats.cancelledCount,
        completed: rangeStats.completedCount,
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

      {/* Quick-access section removed (43c) */}

      {/* Today's widget removed (43e) */}

      {/* Analytics status breakdown with date-range preset */}
      <section aria-label="Análisis de turnos">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Resumen de turnos</h2>
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 gap-0.5">
            {(Object.keys(PRESET_LABELS) as RangePreset[]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setRangePreset(preset)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-md font-medium transition-colors',
                  rangePreset === preset
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                )}
              >
                {PRESET_LABELS[preset]}
              </button>
            ))}
          </div>
        </div>

        {rangeLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 rounded bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : rangeError ? (
          <p className="text-sm text-gray-500 italic py-4">{rangeError}</p>
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
