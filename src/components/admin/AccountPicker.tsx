import { useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { roleLabel } from '../../lib/adminUsersView'
import type { AdminManagedUser } from '../../services/adminUsers'

interface AccountPickerProps {
  /** Every account; the ones in `linkedUserIds` are shown but cannot be chosen. */
  accounts: AdminManagedUser[]
  linkedUserIds: string[]
  /** The chosen account id ('' when none). */
  value: string
  onChange: (userId: string) => void
  /** The drop-down is controlled by the parent so it can close it first on Escape. */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Ref of the text box, to focus it when a pop-up opens. */
  inputRef?: React.RefObject<HTMLInputElement | null>
  id?: string
}

const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const labelOf = (a: AdminManagedUser) => a.name || a.email || 'Usuario sin nombre'

/** Drop-down to search and choose an account: type to filter, pick one, it closes and shows its name. */
export function AccountPicker({
  accounts,
  linkedUserIds,
  value,
  onChange,
  open,
  onOpenChange,
  inputRef,
  id = 'account-picker',
}: AccountPickerProps) {
  const [query, setQuery] = useState('')
  const ownRef = useRef<HTMLInputElement>(null)
  const boxRef = inputRef ?? ownRef
  const listId = `${id}-list`

  const matches = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return accounts
    return accounts.filter((a) => normalize(`${a.name} ${a.email ?? ''}`).includes(q))
  }, [accounts, query])

  const selected = accounts.find((a) => a.userId === value) ?? null
  const allTaken = accounts.length > 0 && accounts.every((a) => linkedUserIds.includes(a.userId))

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          ref={boxRef as React.RefObject<HTMLInputElement>}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          value={open ? query : selected ? labelOf(selected) : query}
          onChange={(e) => {
            setQuery(e.target.value)
            onOpenChange(true)
          }}
          onFocus={() => {
            setQuery('')
            onOpenChange(true)
          }}
          onClick={() => onOpenChange(true)}
          placeholder="Buscar por nombre o email..."
          aria-label="Buscar cuenta"
          autoComplete="off"
          className="w-full rounded-lg border border-shell-border bg-white py-2 pl-3 pr-9 text-sm text-shell-text placeholder:text-shell-subtleText focus:border-brand-primary focus:outline-none"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? 'Cerrar la lista de cuentas' : 'Abrir la lista de cuentas'}
          onClick={() => {
            onOpenChange(!open)
            if (!open) boxRef.current?.focus()
          }}
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-shell-subtleText"
        >
          <span aria-hidden="true" className={cn('text-xs transition-transform', open && 'rotate-180')}>▾</span>
        </button>
      </div>

      {allTaken && (
        <p className="rounded-lg bg-shell-muted px-3 py-3 text-sm text-shell-subtleText">
          No hay cuentas disponibles: todas ya están vinculadas a un profesional.
        </p>
      )}

      {open &&
        (accounts.length === 0 ? (
          <p className="rounded-lg bg-shell-muted px-3 py-3 text-sm text-shell-subtleText">No hay cuentas para vincular.</p>
        ) : matches.length === 0 ? (
          <p className="rounded-lg bg-shell-muted px-3 py-3 text-sm text-shell-subtleText">
            No encontramos cuentas con ese criterio.
          </p>
        ) : (
          <ul
            id={listId}
            role="listbox"
            aria-label="Cuentas disponibles"
            className="max-h-40 divide-y divide-shell-border overflow-y-auto overscroll-contain rounded-lg border border-shell-border shadow-sm"
          >
            {matches.map((account) => {
              const isSelected = account.userId === value
              const taken = linkedUserIds.includes(account.userId)
              const choose = () => {
                if (taken) return
                onChange(account.userId)
                onOpenChange(false)
                setQuery('')
              }
              return (
                <li
                  key={account.userId}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={taken || undefined}
                  tabIndex={taken ? -1 : 0}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={choose}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      choose()
                    }
                  }}
                  className={cn(
                    'flex items-center justify-between gap-2 px-3 py-2 text-sm',
                    taken ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                    isSelected ? 'bg-[var(--color-lilac)]/60' : !taken && 'hover:bg-shell-muted',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-shell-text">{account.name || 'Usuario sin nombre'}</span>
                    <span className="block truncate text-xs text-shell-subtleText">
                      {[account.email, (account.roles ?? []).map(roleLabel).join(', ')].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  {taken ? (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      Ya es profesional
                    </span>
                  ) : (
                    isSelected && <span aria-hidden="true">✓</span>
                  )}
                </li>
              )
            })}
          </ul>
        ))}
    </div>
  )
}
