import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { roleLabel } from '../../lib/adminUsersView'
import type { AdminManagedUser } from '../../services/adminUsers'

interface LinkAccountModalProps {
  /** The professional that gets the account; null keeps the modal closed. */
  staffName: string | null
  /** Every account; the ones already linked to a professional are shown but cannot be chosen. */
  accounts: AdminManagedUser[]
  /** Ids of the accounts that already belong to a professional. */
  linkedUserIds: string[]
  isSaving: boolean
  error: string | null
  onCancel: () => void
  onSave: (userId: string) => void
}

const normalize = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/** Pop-up to pick the account of a professional: type to search or choose from the list. */
export function LinkAccountModal({
  staffName,
  accounts,
  linkedUserIds,
  isSaving,
  error,
  onCancel,
  onSave,
}: LinkAccountModalProps) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [listOpen, setListOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const isOpen = staffName !== null

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedId('')
      setListOpen(false)
      searchRef.current?.focus()
    }
  }, [isOpen, staffName])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || isSaving) return
      // First Escape closes the drop-down, the next one the pop-up
      if (listOpen) setListOpen(false)
      else onCancel()
    }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, isSaving, onCancel, listOpen])

  // If the chosen account stops being available (someone else took it), the choice is dropped
  useEffect(() => {
    if (selectedId && (!accounts.some((a) => a.userId === selectedId) || linkedUserIds.includes(selectedId))) {
      setSelectedId('')
    }
  }, [accounts, linkedUserIds, selectedId])

  const matches = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return accounts
    return accounts.filter((a) => normalize(`${a.name} ${a.email ?? ''}`).includes(q))
  }, [accounts, query])

  if (!isOpen) return null

  const selected = accounts.find((a) => a.userId === selectedId) ?? null
  const label = (a: AdminManagedUser) => a.name || a.email || 'Usuario sin nombre'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="link-account-title"
        className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="border-b border-shell-border px-4 py-3">
          <h2 id="link-account-title" className="text-base font-semibold text-shell-text">
            Vincular una cuenta a {staffName}
          </h2>
          <p className="mt-0.5 text-sm text-shell-subtleText">
            Buscá o elegí la cuenta. El profesional pasa a usar el nombre de esa cuenta.
          </p>
        </div>

        <div className="space-y-3 overflow-y-auto p-4">
          <div className="relative">
            <input
              ref={searchRef}
              type="search"
              role="combobox"
              aria-expanded={listOpen}
              aria-controls="link-account-list"
              aria-autocomplete="list"
              value={listOpen ? query : selected ? label(selected) : query}
              onChange={(e) => {
                setQuery(e.target.value)
                setListOpen(true)
              }}
              onFocus={() => {
                setQuery('')
                setListOpen(true)
              }}
              onClick={() => setListOpen(true)}
              placeholder="Buscar por nombre o email..."
              aria-label="Buscar cuenta"
              autoComplete="off"
              className="w-full rounded-lg border border-shell-border bg-white py-2 pl-3 pr-9 text-sm text-shell-text placeholder:text-shell-subtleText focus:border-brand-primary focus:outline-none"
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={listOpen ? 'Cerrar la lista de cuentas' : 'Abrir la lista de cuentas'}
              onClick={() => {
                setListOpen((open) => !open)
                if (!listOpen) searchRef.current?.focus()
              }}
              className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-shell-subtleText"
            >
              <span aria-hidden="true" className={cn('text-xs transition-transform', listOpen && 'rotate-180')}>▾</span>
            </button>
          </div>

          {accounts.length > 0 && accounts.every((a) => linkedUserIds.includes(a.userId)) && (
            <p className="rounded-lg bg-shell-muted px-3 py-3 text-sm text-shell-subtleText">
              No hay cuentas disponibles: todas ya están vinculadas a un profesional.
            </p>
          )}

          {listOpen &&
            (accounts.length === 0 ? (
              <p className="rounded-lg bg-shell-muted px-3 py-3 text-sm text-shell-subtleText">
                No hay cuentas para vincular.
              </p>
            ) : matches.length === 0 ? (
              <p className="rounded-lg bg-shell-muted px-3 py-3 text-sm text-shell-subtleText">
                No encontramos cuentas con ese criterio.
              </p>
            ) : (
              <ul
                id="link-account-list"
                role="listbox"
                aria-label="Cuentas disponibles"
                className="max-h-40 divide-y divide-shell-border overflow-y-auto overscroll-contain rounded-lg border border-shell-border shadow-sm"
              >
                {matches.map((account) => {
                  const isSelected = account.userId === selectedId
                  const taken = linkedUserIds.includes(account.userId)
                  const choose = () => {
                    if (taken) return
                    setSelectedId(account.userId)
                    setListOpen(false)
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
                          {[account.email, account.roles.map(roleLabel).join(', ')].filter(Boolean).join(' · ')}
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

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-shell-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-lg border border-shell-border px-4 py-2 text-sm font-medium text-shell-text hover:bg-shell-muted disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave(selectedId)}
            disabled={isSaving || !selectedId}
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
