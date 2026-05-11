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
    return <ErrorShell message="User not authenticated" />
  }

  // No role found (fallback error)
  if (!role) {
    return <ErrorShell message="Unable to determine user role" />
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
      return <ErrorShell message={`Invalid role: ${role}`} />
  }
}
