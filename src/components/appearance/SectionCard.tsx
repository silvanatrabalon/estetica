import { useEffect, type FormEvent, type ReactNode } from 'react'
import { ActionButton, ActionRow } from '../ActionButton'

/** A titled block of Apariencia: what is set now, and an "Editar" that opens its own pop-up. */
export function SectionCard({
  title,
  description,
  onEdit,
  children,
}: {
  title: string
  /** One line saying what the section is for. */
  description?: string
  onEdit: () => void
  /** Summary of the current values. */
  children?: ReactNode
}) {
  return (
    <section aria-label={title} className="shell-surface rounded-2xl border p-4 shadow-sm">
      <h2 className="text-base font-semibold text-shell-text">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-shell-subtleText">{description}</p>}
      {children && <div className="mt-2 text-sm text-shell-text">{children}</div>}
      <ActionRow>
        <ActionButton onClick={onEdit} aria-label={`Editar ${title}`}>
          Editar
        </ActionButton>
      </ActionRow>
    </section>
  )
}

/** Muted text for a value that was not set yet. */
export function NotSet({ children = 'Sin completar' }: { children?: ReactNode }) {
  return <span className="text-shell-subtleText">{children}</span>
}

/**
 * Pop-up to edit one section: bottom sheet on phones, centered from sm up. Escape or Cancelar close it
 * without saving. Without `onSubmit` it is just a window with a "Listo" button (changes apply at once).
 */
export function EditPopup({
  title,
  onClose,
  onSubmit,
  isSaving = false,
  error,
  submitLabel = 'Guardar',
  children,
}: {
  title: string
  onClose: () => void
  onSubmit?: () => void | Promise<void>
  isSaving?: boolean
  /** Shown inside the pop-up, so it is never hidden behind it. */
  error?: string | null
  submitLabel?: string
  children: ReactNode
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, isSaving])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void onSubmit?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-label={title}
        noValidate
        onSubmit={handleSubmit}
        className="max-h-[88dvh] w-full max-w-lg space-y-3 overflow-y-auto rounded-t-2xl bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-xl sm:max-h-[92dvh] sm:rounded-2xl sm:p-4"
      >
        <h2 className="text-base font-semibold text-shell-text">{title}</h2>

        {children}

        {error && (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-shell-border bg-white px-4 pt-2.5 sm:static sm:mx-0 sm:border-0 sm:px-0 sm:pt-1">
          {onSubmit ? (
            <>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : submitLabel}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong"
            >
              Listo
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
