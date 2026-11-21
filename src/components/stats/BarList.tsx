import { barPercent } from '../../lib/stats'

export interface BarListItem {
  id: string
  label: string
  value: number
  /** Main figure shown at the end of the row, e.g. "12 servicios". */
  display: string
  /** Secondary text under the label, e.g. "$ 12.000". */
  sub?: string
}

/** Ranked horizontal bars. Renders `emptyText` when there is nothing to show. */
export function BarList({ items, emptyText, ariaLabel }: { items: BarListItem[]; emptyText: string; ariaLabel: string }) {
  if (items.length === 0 || items.every((i) => i.value === 0)) {
    return <p className="py-6 text-center text-sm text-shell-subtleText">{emptyText}</p>
  }

  const max = Math.max(...items.map((i) => i.value))

  return (
    <ol aria-label={ariaLabel} className="space-y-3">
      {items.map((item, index) => (
        <li key={item.id}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-semibold text-shell-text">
              <span className="mr-2 text-xs font-bold text-shell-subtleText">{index + 1}</span>
              {item.label}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-shell-text">{item.display}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-shell-muted" aria-hidden="true">
            <div className="h-full rounded-full bg-brand-primary" style={{ width: `${barPercent(item.value, max)}%` }} />
          </div>
          {item.sub && <p className="mt-0.5 text-xs text-shell-subtleText">{item.sub}</p>}
        </li>
      ))}
    </ol>
  )
}
