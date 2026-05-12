import { Outlet } from 'react-router-dom'
import { ShellProvider } from '../../features/shell'
import { AppShell } from '../shell'
import { DevRoleBadge } from './DevRoleBadge'
import { ProfileSoftGateNotice } from './ProfileSoftGateNotice'

export function ProtectedShellLayout() {
  return (
    <ShellProvider>
      <AppShell>
        <div className="p-6">
          <ProfileSoftGateNotice />
          <Outlet />
        </div>
      </AppShell>
      <DevRoleBadge />
    </ShellProvider>
  )
}
