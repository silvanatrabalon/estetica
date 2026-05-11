import { useState } from 'react'

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
      const message = err instanceof Error ? err.message : 'Failed to retry role resolution.'
      setError(message)
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg rounded-lg border border-amber-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Unable to resolve your role</h2>
        <p className="mt-2 text-sm text-gray-600">
          We could not confirm your account permissions yet. Try again to continue.
        </p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="mt-5 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {isRetrying ? 'Retrying...' : 'Retry'}
        </button>
      </div>
    </div>
  )
}
