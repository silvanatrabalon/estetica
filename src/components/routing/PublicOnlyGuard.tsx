import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useUser } from '../../hooks/useUser'
import { resolveAuthenticatedSignInRedirect } from '../../lib/routing'
import { RouteLoadingState } from './RouteLoadingState'
import { NullRoleRecovery } from './NullRoleRecovery'

export function PublicOnlyGuard() {
  const { user, role, isLoading, retryRoleResolution } = useUser()
  const location = useLocation()

  if (isLoading) {
    return <RouteLoadingState />
  }

  if (user) {
    if (!role) {
      return <NullRoleRecovery onRetry={retryRoleResolution} />
    }

    const redirectTo = resolveAuthenticatedSignInRedirect({
      isAuthenticated: true,
      role,
      currentPath: location.pathname,
    })

    return <Navigate to={redirectTo ?? '/dashboard'} replace />
  }

  return <Outlet />
}
