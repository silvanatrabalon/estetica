import { useEffect, useMemo, useState } from 'react'
import { StatCard } from '../components/StatCard'
import { BarList } from '../components/stats/BarList'
import { ColumnChart } from '../components/stats/ColumnChart'
import { formatMoney, getStatsRange, monthLongLabel, monthShortLabel, statsRangeError } from '../lib/stats'
import { getAdminStats, type AdminStats } from '../services/adminStats'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export function AdminStatsPage() {
  // Starts on the current month; an empty date means no limit on that side
  const [from, setFrom] = useState(() => getStatsRange('month').from ?? '')
  const [to, setTo] = useState(() => getStatsRange('month').to ?? '')
  const rangeError = statsRangeError(from, to)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (rangeError) return
    setLoading(true)
    setError(null)
    getAdminStats(from || null, to || null)
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
  }, [from, to, rangeError])

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

      <fieldset className="shell-surface rounded-2xl border p-3 shadow-sm">
        <legend className="sr-only">Período</legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="stats-from" className="mb-1 block text-xs font-medium text-shell-subtleText">
              Desde
            </label>
            <input
              id="stats-from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              aria-invalid={rangeError ? true : undefined}
              className="dt-field"
            />
          </div>
          <div>
            <label htmlFor="stats-to" className="mb-1 block text-xs font-medium text-shell-subtleText">
              Hasta
            </label>
            <input
              id="stats-to"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              aria-invalid={rangeError ? true : undefined}
              className="dt-field"
            />
          </div>
        </div>
        {rangeError ? (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {rangeError}
          </p>
        ) : (
          <p className="mt-2 text-xs text-shell-subtleText">Si dejás una fecha vacía, no se limita de ese lado.</p>
        )}
      </fieldset>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section aria-label="Resumen" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Servicios" value={stats?.totals.services ?? 0} loading={loading} inlineOnMobile />
        <StatCard label="Ingresos brutos" value={formatMoney(stats?.totals.revenueCents ?? 0)} loading={loading} inlineOnMobile />
        <StatCard label="Clientes" value={stats?.totals.clients ?? 0} loading={loading} inlineOnMobile />
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
