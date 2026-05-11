import { ReactNode } from 'react'
import { NavBar, Sidebar } from './Navigation'
import { useNavigation } from '../../features/shell/hooks/useNavigation'

interface ShellProps {
  children: ReactNode
}

export function StaffShell({ children }: ShellProps) {
  const navItems = useNavigation('staff')

  return (
    <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] min-h-screen gap-0">
      <Sidebar items={navItems} />
      <div className="flex flex-col">
        <NavBar />
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}
