import { useEffect, useRef, useState } from 'react'
import { cn } from '../lib/cn'

export interface ListboxOption {
  value: string
  label: string
}

interface ListboxProps {
  value: string
  onChange: (value: string) => void
  options: ListboxOption[]
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
  /** Accessible name when there is no <label htmlFor>. */
  ariaLabel?: string
}

export function Listbox({
  value,
  onChange,
  options,
  placeholder = 'Seleccioná una opción',
  disabled,
  id,
  className,
  ariaLabel,
}: ListboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selected = options.find((o) => o.value === value)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen])

  // Scroll selected option into view when opening
  useEffect(() => {
    if (!isOpen || !listRef.current) return
    const active = listRef.current.querySelector('[data-selected="true"]') as HTMLElement | null
    active?.scrollIntoView?.({ block: 'nearest' })
  }, [isOpen])

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        id={id}
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <span className={cn('truncate', selected ? 'text-gray-900' : 'text-gray-400')}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={cn('h-4 w-4 text-gray-400 shrink-0 transition-transform', isOpen && 'rotate-180')}
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
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto py-1"
        >
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                data-selected={isSelected}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={cn(
                  'px-3 py-2 text-sm cursor-pointer select-none flex items-center justify-between',
                  isSelected
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50',
                )}
              >
                {option.label}
                {isSelected && (
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
