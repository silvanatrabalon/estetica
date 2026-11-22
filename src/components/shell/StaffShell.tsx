import { ReactNode } from 'react'
import { STAFF_TABS, MobileTabBar, NavBar, Sidebar } from './Navigation'
import { useNavigation } from '../../features/shell/hooks/useNavigation'
import { useShellContext } from '../../features/shell/hooks/useShellContext'
import { cn } from '../../lib'

interface ShellProps {
  children: ReactNode
}

export function StaffShell({ children }: ShellProps) {
  const { isSidebarOpen } = useShellContext()
  const navItems = useNavigation('staff')

  return (
    <div
      className={cn(
        'grid min-h-screen grid-cols-1 gap-0 bg-shell-base text-shell-text',
        isSidebarOpen ? 'md:grid-cols-[250px_1fr]' : 'md:grid-cols-1',
      )}
    >
      <Sidebar items={navItems} />
      <div className="flex flex-col">
        <NavBar />
        <main className="shell-padding flex-1 overflow-auto bg-shell-base">
          {/* Room for the phone-only tab bar so the last row is never hidden */}
          <div className="pb-20 md:pb-0">{children}</div>
        </main>
      </div>
      <MobileTabBar tabs={STAFF_TABS} />
    </div>
  )
}
