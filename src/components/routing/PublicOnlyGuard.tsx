import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useUser } from '../../hooks/useUser'
import { resolveAuthenticatedSignInRedirect } from '../../lib/routing'
import { RouteLoadingState } from './RouteLoadingState'
import { NullRoleRecovery } from './NullRoleRecovery'

export function PublicOnlyGuard() {
  const { user, roles, activeRole, isLoading, retryRoleResolution } = useUser()
  const location = useLocation()

  if (isLoading) {
    return <RouteLoadingState />
  }

  if (user) {
    // Multi-role user with no selection → send to selector
    if (roles.length > 1 && !activeRole) {
      return <Navigate to="/seleccionar-rol" replace />
    }

    if (!activeRole) {
      return <NullRoleRecovery onRetry={retryRoleResolution} />
    }

    const redirectTo = resolveAuthenticatedSignInRedirect({
      isAuthenticated: true,
      role: activeRole,
      currentPath: location.pathname,
    })

    return <Navigate to={redirectTo ?? '/dashboard'} replace />
  }

  return <Outlet />
}
