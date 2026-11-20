import { useState, useEffect } from 'react'
import { cn } from '../lib/cn'
import { getBusinessSettings } from '../services/businessSettings'
import { StatCard } from '../components/StatCard'
import { useAdminDashboardStats } from '../hooks/useAdminDashboardStats'
import { getStatsByRange, type StatsByRange } from '../services/adminDashboard'

// ── Currency formatter ────────────────────────────────────────────────────────

function formatARS(cents: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

// ── Analytics breakdown ───────────────────────────────────────────────────────

const ANALYTICS_STATUSES = [
  { key: 'confirmed' as const, label: 'Confirmado' },
  { key: 'pending' as const, label: 'Pendiente' },
  { key: 'cancelled' as const, label: 'Cancelado' },
  { key: 'completed' as const, label: 'Completado' },
]

const STATUS_BAR_COLORS: Record<string, string> = {
  confirmed: 'bg-emerald-500',
  pending: 'bg-amber-400',
  cancelled: 'bg-red-400',
  completed: 'bg-teal-500',
}

const STATUS_DOT_COLORS: Record<string, string> = {
  confirmed: 'bg-emerald-500',
  pending: 'bg-amber-400',
  cancelled: 'bg-red-400',
  completed: 'bg-teal-500',
}

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

function IconCheckCircle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22,4 12,14.01 9,11.01" />
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

function IconCurrency() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminDashboardPage() {
  const { stats, loading: statsLoading, error: statsError } = useAdminDashboardStats()

  const [rangePreset, setRangePreset] = useState<RangePreset>('last_month')
  const [rangeStats, setRangeStats] = useState<StatsByRange | null>(null)
  const [rangeLoading, setRangeLoading] = useState(false)
  const [rangeError, setRangeError] = useState<string | null>(null)

  const formattedDate = (() => {
    const raw = new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  })()

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
    getStatsByRange(dateFrom, dateTo)
      .then((data) => { if (!cancelled) setRangeStats(data) })
      .catch(() => { if (!cancelled) setRangeError('Error al cargar las analíticas. Intentá nuevamente.') })
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

  function pctNum(count: number): number {
    if (analyticsTotal === 0) return 0
    return Math.round((count / analyticsTotal) * 100)
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
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Stats error */}
      {statsError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
          {statsError}
        </div>
      )}

      {/* ── KPI section ──────────────────────────────────────────────────── */}
      <section aria-label="Métricas principales">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4 gap-4">
          <div>
            <h1 className="text-2xl font-heading font-semibold tracking-tight text-gray-900">
              Panel de administración
            </h1>
            <p className="text-sm mt-0.5 text-gray-400">
              {formattedDate}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-700">En vivo</span>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            label="Turnos hoy"
            value={stats?.todayCount ?? 0}
            loading={statsLoading}
            icon={<IconCalendarDay />}
          />
          <StatCard
            label="Turnos esta semana"
            value={stats?.weekCount ?? 0}
            loading={statsLoading}
            icon={<IconCalendarWeek />}
          />
          <StatCard
            label="Turnos este mes"
            value={stats?.monthCount ?? 0}
            loading={statsLoading}
            icon={<IconCalendarMonth />}
          />
          <StatCard
            label="Confirmados + pendientes hoy"
            value={confirmedPendingToday}
            loading={statsLoading}
            icon={<IconCheckCircle />}
          />
          <StatCard
            label="Cancelados"
            value={stats?.cancelledCount ?? 0}
            loading={statsLoading}
            icon={<IconXCircle />}
          />
          <StatCard
            label="Ingresos estimados este mes"
            value={stats ? formatARS(stats.revenueCentsMonth) : '—'}
            loading={statsLoading}
            icon={<IconCurrency />}
            accent="bg-orange-50 text-orange-500"
          />
        </div>
      </section>

      {/* ── Analytics section ─────────────────────────────────────────────── */}
      <section
        aria-label="Análisis de turnos"
        className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-heading font-semibold text-gray-900">Resumen de turnos</h2>
            <p className="text-xs text-gray-400 mt-0.5">Desglose por estado del período seleccionado</p>
          </div>
          <div className="inline-flex rounded-xl border border-gray-100 bg-gray-50 p-1 gap-0.5">
            {(Object.keys(PRESET_LABELS) as RangePreset[]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setRangePreset(preset)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-150',
                  rangePreset === preset
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-100'
                    : 'text-gray-400 hover:text-gray-600',
                )}
              >
                {PRESET_LABELS[preset]}
              </button>
            ))}
          </div>
        </div>

        {rangeLoading ? (
          <div className="space-y-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-24 rounded bg-gray-100 animate-pulse" />
                  <div className="h-4 w-16 rounded bg-gray-100 animate-pulse" />
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : rangeError ? (
          <div className="py-10 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">{rangeError}</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-5 border-b border-gray-50">
              <span className="text-sm text-gray-400 font-medium">Total de turnos</span>
              <span className="text-3xl font-heading font-bold text-gray-900 tabular-nums leading-none">
                {analyticsTotal}
              </span>
            </div>
            {ANALYTICS_STATUSES.map(({ key, label }) => {
              const count = analyticsCountByKey?.[key] ?? 0
              const percentage = pctNum(count)
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', STATUS_DOT_COLORS[key])} />
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-semibold text-gray-900 tabular-nums w-5 text-right">{count}</span>
                      <span className="text-gray-400 tabular-nums w-9 text-right text-xs">{pct(count)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', STATUS_BAR_COLORS[key])}
                      style={{
                        width: `${percentage}%`,
                        transition: 'width 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
