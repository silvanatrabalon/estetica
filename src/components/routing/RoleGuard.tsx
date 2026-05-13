import { Navigate, Outlet } from 'react-router-dom'
import type { AppRole } from '../../context/UserContext'
import { useUser } from '../../hooks/useUser'
import { RouteLoadingState } from './RouteLoadingState'
import { NullRoleRecovery } from './NullRoleRecovery'

interface RoleGuardProps {
  allowedRoles: AppRole[]
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user, roles, activeRole, isLoading, retryRoleResolution } = useUser()

  if (isLoading) {
    return <RouteLoadingState />
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  // Multi-role user with no active selection → send to selector
  if (roles.length > 1 && !activeRole) {
    return <Navigate to="/seleccionar-rol" replace />
  }

  if (!activeRole) {
    return <NullRoleRecovery onRetry={retryRoleResolution} />
  }

  if (!allowedRoles.includes(activeRole)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
