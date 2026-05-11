import { Navigate, Outlet } from 'react-router-dom'
import type { AppRole } from '../../context/UserContext'
import { useUser } from '../../hooks/useUser'
import { RouteLoadingState } from './RouteLoadingState'
import { NullRoleRecovery } from './NullRoleRecovery'

interface RoleGuardProps {
  allowedRoles: AppRole[]
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user, role, isLoading, retryRoleResolution } = useUser()

  if (isLoading) {
    return <RouteLoadingState />
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  if (!role) {
    return <NullRoleRecovery onRetry={retryRoleResolution} />
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
