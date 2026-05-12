import { ReactNode } from 'react'
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
  const { user, role, isLoading } = useUser()

  // Still loading session/role
  if (isLoading) {
    return <LoadingShell />
  }

  // User not authenticated (should be handled by App.tsx, but just in case)
  if (!user) {
    return <ErrorShell message="Usuario no autenticado" />
  }

  // No role found (fallback error)
  if (!role) {
    return <ErrorShell message="No se pudo determinar el rol del usuario" />
  }

  // Render the appropriate shell based on role
  switch (role) {
    case 'customer':
      return <CustomerShell>{children}</CustomerShell>
    case 'staff':
      return <StaffShell>{children}</StaffShell>
    case 'admin':
      return <AdminShell>{children}</AdminShell>
    default:
      return <ErrorShell message={`Rol inválido: ${role}`} />
  }
}
