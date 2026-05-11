import { ReactNode } from 'react'
import { NavBar, Sidebar } from './Navigation'
import { useNavigation } from '../../features/shell/hooks/useNavigation'

interface ShellProps {
  children: ReactNode
}

export function CustomerShell({ children }: ShellProps) {
  const navItems = useNavigation('customer')

  return (
    <div className="grid min-h-screen grid-cols-1 gap-0 bg-shell-base text-shell-text md:grid-cols-[250px_1fr]">
      <Sidebar items={navItems} />
      <div className="flex flex-col">
        <NavBar />
        <main className="shell-padding flex-1 overflow-auto bg-shell-base">
          {children}
        </main>
      </div>
    </div>
  )
}
