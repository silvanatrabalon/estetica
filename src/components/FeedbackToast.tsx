import { useEffect } from 'react'

interface FeedbackToastProps {
  success?: string | null
  error?: string | null
  onDismiss: () => void
  /** Success messages disappear on their own after this many ms (errors stay until dismissed). */
  successDurationMs?: number
}

/**
 * Fixed-position feedback that stays in view wherever the page is scrolled.
 * Announced to assistive tech: success as a polite status, errors as an alert.
 */
export function FeedbackToast({ success, error, onDismiss, successDurationMs = 5000 }: FeedbackToastProps) {
  useEffect(() => {
    if (!success || error) return
    const timer = window.setTimeout(onDismiss, successDurationMs)
    return () => window.clearTimeout(timer)
  }, [success, error, onDismiss, successDurationMs])

  const message = error || success
  if (!message) return null

  const isError = Boolean(error)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div
        role={isError ? 'alert' : 'status'}
        className={[
          'pointer-events-auto flex max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg',
          isError
            ? 'border-red-200 bg-red-50 text-red-800'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800',
        ].join(' ')}
      >
        <span>{message}</span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar aviso"
          className="-my-1 -mr-2 shrink-0 rounded-lg px-2 py-1 text-lg leading-none opacity-70 hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  )
}
