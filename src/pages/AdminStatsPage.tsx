import { useEffect, useMemo, useState } from 'react'
import { StatCard } from '../components/StatCard'
import { BarList } from '../components/stats/BarList'
import { ColumnChart } from '../components/stats/ColumnChart'
import { Tabs } from '../components/Tabs'
import { formatMoney, getStatsRange, monthLongLabel, monthShortLabel, STATS_PERIODS, type StatsPeriod } from '../lib/stats'
import { getAdminStats, type AdminStats } from '../services/adminStats'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export function AdminStatsPage() {
  const [period, setPeriod] = useState<StatsPeriod>('month')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const { from, to } = getStatsRange(period)
    setLoading(true)
    setError(null)
    getAdminStats(from, to)
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch(() => {
        if (!cancelled) setError('No pudimos cargar las estadísticas. Intentá de nuevo.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [period])

  const professionalItems = useMemo(
    () =>
      (stats?.professionals ?? []).map((p) => ({
        id: p.staffMemberId,
        label: p.displayName,
        value: p.services,
        display: plural(p.services, 'servicio', 'servicios'),
        sub: `Ingresos: ${formatMoney(p.revenueCents)}`,
      })),
    [stats],
  )

  const clientItems = useMemo(
    () =>
      (stats?.clients ?? []).map((c) => ({
        id: c.customerUserId,
        label: c.name,
        value: c.visits,
        display: plural(c.visits, 'visita', 'visitas'),
        sub: `Gastó ${formatMoney(c.spentCents)}`,
      })),
    [stats],
  )

  const monthData = useMemo(
    () =>
      (stats?.months ?? []).map((m) => ({
        label: monthShortLabel(m.month),
        value: m.revenueCents,
        description: `${monthLongLabel(m.month)}: ${formatMoney(m.revenueCents)} (${plural(m.services, 'servicio', 'servicios')})`,
      })),
    [stats],
  )

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-shell-text">Estadísticas</h1>
        <p className="text-sm text-shell-subtleText">
          Cuentan los turnos que ya se realizaron (confirmados o completados). Los cancelados y los próximos no suman.
        </p>
      </div>

      <Tabs
        ariaLabel="Período"
        active={period}
        onChange={setPeriod}
        tabs={STATS_PERIODS.map((p) => ({ key: p.value, label: p.label }))}
      />

      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section aria-label="Resumen" className="grid grid-cols-3 gap-3">
        <StatCard label="Servicios" value={stats?.totals.services ?? 0} loading={loading} />
        <StatCard label="Ingresos brutos" value={formatMoney(stats?.totals.revenueCents ?? 0)} loading={loading} />
        <StatCard label="Clientes" value={stats?.totals.clients ?? 0} loading={loading} />
      </section>

      <section className="shell-surface rounded-2xl border p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-shell-text">Ingresos por mes</h2>
        {loading ? (
          <div className="h-44 animate-pulse rounded-xl bg-shell-muted" />
        ) : (
          <ColumnChart data={monthData} ariaLabel="Ingresos brutos de los últimos 12 meses" />
        )}
        <p className="mt-2 text-xs text-shell-subtleText">Últimos 12 meses, sin importar el período elegido.</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="shell-surface rounded-2xl border p-4 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-shell-text">Servicios por profesional</h2>
          {loading ? (
            <div className="h-32 animate-pulse rounded-xl bg-shell-muted" />
          ) : (
            <BarList
              items={professionalItems}
              ariaLabel="Servicios realizados por profesional"
              emptyText="Todavía no hay servicios realizados en este período."
            />
          )}
        </section>

        <section className="shell-surface rounded-2xl border p-4 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-shell-text">Clientes más fieles</h2>
          {loading ? (
            <div className="h-32 animate-pulse rounded-xl bg-shell-muted" />
          ) : (
            <BarList
              items={clientItems}
              ariaLabel="Clientes con más visitas"
              emptyText="Todavía no hay visitas en este período."
            />
          )}
        </section>
      </div>
    </div>
  )
}
