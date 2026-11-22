import { useEffect, type ReactNode } from 'react'

/** The pop-up frame of an appointment's detail: bottom sheet on phones, centered from sm up. Escape, X or a click outside closes it. */
export function DetailPopup({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalle del turno"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-2xl bg-white p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl"
      >
        {children}
      </div>
    </div>
  )
}
