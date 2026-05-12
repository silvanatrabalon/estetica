import { useState } from 'react'
import { commonCopy } from '../../lib/uiCopy'

interface NullRoleRecoveryProps {
  onRetry: () => Promise<void>
}

export function NullRoleRecovery({ onRetry }: NullRoleRecoveryProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRetry = async () => {
    setError(null)
    setIsRetrying(true)

    try {
      await onRetry()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo reintentar la resolución de rol.'
      setError(message)
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg rounded-lg border border-amber-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">No se pudo resolver tu rol</h2>
        <p className="mt-2 text-sm text-gray-600">
          Todavía no pudimos confirmar los permisos de tu cuenta. Reintentá para continuar.
        </p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="mt-5 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {isRetrying ? 'Reintentando...' : commonCopy.retry}
        </button>
      </div>
    </div>
  )
}
