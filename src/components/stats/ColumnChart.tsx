import { barPercent } from '../../lib/stats'

export interface ColumnDatum {
  label: string
  value: number
  /** Text read by screen readers and shown on hover, e.g. "nov 2026: $ 1.500". */
  description: string
}

/** Vertical bars, one per period. Pure CSS so it stays light and works on any screen width. */
export function ColumnChart({ data, ariaLabel }: { data: ColumnDatum[]; ariaLabel: string }) {
  const max = Math.max(0, ...data.map((d) => d.value))

  return (
    <ul aria-label={ariaLabel} className="flex h-44 items-end gap-1 sm:gap-2">
      {data.map((d) => {
        const height = barPercent(d.value, max)
        return (
          <li key={d.label + d.description} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={d.description}>
            <span className="sr-only">{d.description}</span>
            <div className="flex w-full flex-1 items-end" aria-hidden="true">
              <div
                className={`w-full rounded-t-md ${d.value > 0 ? 'bg-brand-primary' : 'bg-shell-muted'}`}
                style={{ height: d.value > 0 ? `${height}%` : '3px' }}
              />
            </div>
            <span aria-hidden="true" className="text-[10px] font-medium text-shell-subtleText sm:text-xs">
              {d.label}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
