import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useUser } from '../../hooks/useUser'
import { LoadingShell } from './LoadingShell'
import { ErrorShell } from './ErrorShell'
import { CustomerShell } from './CustomerShell'
import { StaffShell } from './StaffShell'
import { AdminShell } from './AdminShell'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { user, roles, activeRole, isLoading } = useUser()

  // Still loading session/role
  if (isLoading) {
    return <LoadingShell />
  }

  // User not authenticated (should be handled by App.tsx, but just in case)
  if (!user) {
    return <ErrorShell message="Usuario no autenticado" />
  }

  // Multi-role user hasn't selected a role yet → send to selector
  // (RoleGuard is nested inside AppShell so it would never fire its own redirect)
  if (!activeRole && roles.length > 1) {
    return <Navigate to="/seleccionar-rol" replace />
  }

  // No active role found (fallback error)
  if (!activeRole) {
    return <ErrorShell message="No se pudo determinar el rol del usuario" />
  }

  // Render the appropriate shell based on active role
  switch (activeRole) {
    case 'customer':
      return <CustomerShell>{children}</CustomerShell>
    case 'staff':
      return <StaffShell>{children}</StaffShell>
    case 'admin':
      return <AdminShell>{children}</AdminShell>
    default:
      return <ErrorShell message={`Rol inválido: ${activeRole}`} />
  }
}
