import { ReactNode } from 'react'
import { render, RenderOptions, renderHook, RenderHookOptions } from '@testing-library/react'
import type { User } from '@supabase/supabase-js'
import type { AppRole } from '../../context/UserContext'
import { AllTestContextProviders } from './test-providers'

/**
 * Wrapper for rendering hooks with context providers
 * Reduces boilerplate in hook tests by automatically wrapping with UserContext + ShellContext
 */

interface RenderHookWithContextOptions extends Omit<RenderHookOptions<any>, 'wrapper'> {
  user?: User | null
  role?: AppRole | null
  isLoading?: boolean
  sidebarOpen?: boolean
}

/**
 * Render a hook with UserContext and ShellContext providers
 * Equivalent to renderHook from @testing-library/react but with context pre-configured
 */
export function renderHookWithContext<TProps, TResult>(
  callback: (props: TProps) => TResult,
  options?: RenderHookWithContextOptions
) {
  const {
    user = null,
    role = null,
    isLoading = false,
    sidebarOpen = true,
    ...renderOptions
  } = options || {}

  return renderHook(callback, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <AllTestContextProviders
        user={user}
        role={role}
        isLoading={isLoading}
        sidebarOpen={sidebarOpen}
      >
        {children}
      </AllTestContextProviders>
    ),
    ...renderOptions,
  })
}

/**
 * Render a component with context providers
 * Useful for component integration tests
 */
export function renderWithContext(
  ui: ReactNode,
  options?: Omit<RenderOptions, 'wrapper'> & {
    user?: User | null
    role?: AppRole | null
    isLoading?: boolean
    sidebarOpen?: boolean
  }
) {
  const {
    user = null,
    role = null,
    isLoading = false,
    sidebarOpen = true,
    ...renderOptions
  } = options || {}

  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <AllTestContextProviders
        user={user}
        role={role}
        isLoading={isLoading}
        sidebarOpen={sidebarOpen}
      >
        {children}
      </AllTestContextProviders>
    ),
    ...renderOptions,
  })
}
