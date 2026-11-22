import { useEffect, useRef, useState } from 'react'
import { cn } from '../lib/cn'

export interface MultiListboxOption {
  value: string
  label: string
}

interface MultiListboxProps {
  values: string[]
  onChange: (values: string[]) => void
  options: MultiListboxOption[]
  placeholder?: string
  /** Accessible name of the button. */
  ariaLabel: string
  id?: string
  disabled?: boolean
}

/** Drop-down where several options can be ticked; it stays open while choosing. */
export function MultiListbox({ values, onChange, options, placeholder = 'Elegí una o más opciones', ariaLabel, id, disabled }: MultiListboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Close only the list, not the pop-up around it
        e.stopPropagation()
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [isOpen])

  const chosen = options.filter((o) => values.includes(o.value))
  const summary =
    chosen.length === 0
      ? placeholder
      : chosen.length <= 2
        ? chosen.map((o) => o.label).join(', ')
        : `${chosen.length} elegidos`

  const toggle = (value: string) =>
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value])

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] disabled:opacity-50"
      >
        <span className={cn('truncate', chosen.length > 0 ? 'text-gray-900' : 'text-gray-400')}>{summary}</span>
        <svg
          className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', isOpen && 'rotate-180')}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-multiselectable="true"
          aria-label={ariaLabel}
          className="absolute z-50 mt-1 max-h-52 w-full overflow-auto overscroll-contain rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          {options.length === 0 && <li className="px-3 py-2 text-sm text-gray-500">No hay opciones.</li>}
          {options.map((option) => {
            const isChosen = values.includes(option.value)
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isChosen}
                onClick={() => toggle(option.value)}
                className="flex cursor-pointer select-none items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] text-white',
                    isChosen ? 'border-brand-primary bg-brand-primary' : 'border-gray-300 bg-white',
                  )}
                >
                  {isChosen ? '✓' : ''}
                </span>
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
