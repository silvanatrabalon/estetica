import { cn } from '../lib/cn'

export interface TabItem<K extends string> {
  key: K
  label: string
}

interface TabsProps<K extends string> {
  tabs: TabItem<K>[]
  active: K
  onChange: (key: K) => void
  ariaLabel: string
}

/** Compact tab strip that fits a phone: equal-width tabs, no overflow. */
export function Tabs<K extends string>({ tabs, active, onChange, ariaLabel }: TabsProps<K>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex gap-1 rounded-xl border border-shell-border bg-shell-muted/40 p-1"
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
            active === tab.key
              ? 'bg-white text-brand-primary shadow-sm'
              : 'text-shell-subtleText hover:text-shell-text',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
