import { Navigate, Outlet } from 'react-router-dom'
import { useUser } from '../../hooks/useUser'
import { RouteLoadingState } from './RouteLoadingState'

export function AuthGuard() {
  const { user, isLoading } = useUser()

  if (isLoading) {
    return <RouteLoadingState />
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  return <Outlet />
}
