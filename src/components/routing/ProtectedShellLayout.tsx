import { Outlet } from 'react-router-dom'
import { ShellProvider } from '../../features/shell'
import { AppShell } from '../shell'
import { DevRoleBadge } from './DevRoleBadge'

export function ProtectedShellLayout() {
  return (
    <ShellProvider>
      <AppShell>
        <div className="p-6">
          <Outlet />
        </div>
      </AppShell>
      <DevRoleBadge />
    </ShellProvider>
  )
}
