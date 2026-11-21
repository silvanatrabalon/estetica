import { ReactNode } from 'react'
import { MobileTabBar, NavBar, Sidebar } from './Navigation'
import { useNavigation } from '../../features/shell/hooks/useNavigation'

interface ShellProps {
  children: ReactNode
}

export function AdminShell({ children }: ShellProps) {
  const navItems = useNavigation('admin')

  return (
    <div className="grid min-h-screen grid-cols-1 gap-0 bg-shell-base text-shell-text md:grid-cols-[250px_1fr]">
      <Sidebar items={navItems} />
      <div className="flex flex-col">
        <NavBar />
        <main className="shell-padding flex-1 overflow-auto bg-shell-base">
          {/* Room for the phone-only tab bar so the last row is never hidden */}
          <div className="pb-20 md:pb-0">{children}</div>
        </main>
      </div>
      <MobileTabBar />
    </div>
  )
}
