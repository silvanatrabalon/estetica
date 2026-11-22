import { useEffect, useRef, useState } from 'react'
import { AccountPicker } from './AccountPicker'
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
  const [selectedId, setSelectedId] = useState('')
  const [listOpen, setListOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const isOpen = staffName !== null

  useEffect(() => {
    if (isOpen) {
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

  if (!isOpen) return null

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
          <AccountPicker
            accounts={accounts}
            linkedUserIds={linkedUserIds}
            value={selectedId}
            onChange={setSelectedId}
            open={listOpen}
            onOpenChange={setListOpen}
            inputRef={searchRef}
            id="link-account"
          />

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
