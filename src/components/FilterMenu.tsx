import { useState } from 'react'
import { cn } from '../lib/cn'

export interface MenuOption {
  value: string
  label: string
}

export function FilterMenu({
  label,
  options,
  value,
  onSelect,
  children,
  active,
}: {
  label: string
  options: MenuOption[]
  value: string
  onSelect: (value: string) => void
  children: React.ReactNode
  active?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-10 items-center gap-1.5 rounded-xl border bg-white px-3 text-sm font-medium text-shell-text shadow-sm hover:bg-shell-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
          active ? 'border-brand-primary' : 'border-shell-border',
        )}
      >
        {children}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" aria-hidden="true" onClick={() => setOpen(false)} />
          <ul
            role="menu"
            aria-label={label}
            className="absolute left-0 z-20 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-shell-border bg-white py-1 shadow-lg"
          >
            {options.map((opt) => (
              <li key={opt.value} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={opt.value === value}
                  onClick={() => {
                    onSelect(opt.value)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-shell-muted',
                    opt.value === value ? 'font-semibold text-brand-primary' : 'text-shell-text',
                  )}
                >
                  {opt.label}
                  {opt.value === value && <span aria-hidden="true">✓</span>}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
