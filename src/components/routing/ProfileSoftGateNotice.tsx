import { Link, useLocation } from 'react-router-dom'
import { useUser } from '../../hooks/useUser'

export function ProfileSoftGateNotice() {
  const { profileStatus, profileWarning, retryProfileBootstrap } = useUser()
  const location = useLocation()

  if (profileStatus === 'complete') {
    return null
  }

  if (location.pathname === '/profile/setup') {
    return null
  }

  const isLoadError = profileStatus === 'load-error'

  return (
    <div
      className={[
        'mb-4 rounded-xl border p-4 text-sm',
        isLoadError
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-amber-200 bg-amber-50 text-amber-800',
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>{profileWarning ?? 'Complete your profile setup to keep account details current.'}</p>
        <div className="flex items-center gap-3">
          {isLoadError ? (
            <button
              type="button"
              onClick={() => void retryProfileBootstrap()}
              className="rounded-lg border border-red-300 px-3 py-1.5 font-semibold text-red-700 transition-micro hover:bg-red-100"
            >
              Retry
            </button>
          ) : null}
          <Link
            to="/profile/setup"
            className={[
              'rounded-lg px-3 py-1.5 font-semibold transition-micro',
              isLoadError
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-amber-600 text-white hover:bg-amber-700',
            ].join(' ')}
          >
            Complete profile
          </Link>
        </div>
      </div>
    </div>
  )
}
