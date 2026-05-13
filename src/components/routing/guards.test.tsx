import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { AuthGuard } from './AuthGuard'
import { PublicOnlyGuard } from './PublicOnlyGuard'
import { RoleGuard } from './RoleGuard'
import { TestUserProvider } from '../../hooks/__test-utils__/test-providers'
import { mockSessions } from '../../hooks/__test-utils__/fixtures'

describe('AuthGuard', () => {
  it('redirects unauthenticated users to sign-in', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <TestUserProvider user={null} roles={[]} activeRole={null} isLoading={false}>
          <Routes>
            <Route path="/signin" element={<div>Sign in page</div>} />
            <Route element={<AuthGuard />}>
              <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Route>
          </Routes>
        </TestUserProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('Sign in page')).toBeDefined()
  })

  it('renders protected route when authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <TestUserProvider user={mockSessions.authenticatedCustomer.user} roles={['customer']} activeRole="customer" isLoading={false}>
          <Routes>
            <Route path="/signin" element={<div>Sign in page</div>} />
            <Route element={<AuthGuard />}>
              <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Route>
          </Routes>
        </TestUserProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('Dashboard')).toBeDefined()
  })
})

describe('RoleGuard', () => {
  it('redirects non-permitted role to unauthorized route', () => {
    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <TestUserProvider user={mockSessions.authenticatedStaff.user} roles={['staff']} activeRole="staff" isLoading={false}>
          <Routes>
            <Route path="/unauthorized" element={<div>Unauthorized</div>} />
            <Route element={<RoleGuard allowedRoles={['admin']} />}>
              <Route path="/admin/users" element={<div>Admin Users</div>} />
            </Route>
          </Routes>
        </TestUserProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('Unauthorized')).toBeDefined()
  })

  it('shows null-role recovery with retry action', () => {
    const retryRoleResolution = vi.fn(async () => {})

    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <TestUserProvider
          user={mockSessions.authenticatedAdmin.user}
          roles={[]}
          activeRole={null}
          isLoading={false}
          onRetryRoleResolution={retryRoleResolution}
        >
          <Routes>
            <Route element={<RoleGuard allowedRoles={['admin']} />}>
              <Route path="/admin/users" element={<div>Admin Users</div>} />
            </Route>
          </Routes>
        </TestUserProvider>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(retryRoleResolution).toHaveBeenCalledTimes(1)
  })
})

describe('PublicOnlyGuard', () => {
  it('redirects authenticated user away from sign-in route', () => {
    render(
      <MemoryRouter initialEntries={['/signin']}>
        <TestUserProvider user={mockSessions.authenticatedAdmin.user} roles={['admin']} activeRole="admin" isLoading={false}>
          <Routes>
            <Route element={<PublicOnlyGuard />}>
              <Route path="/signin" element={<div>Sign in page</div>} />
            </Route>
            <Route path="/admin/users" element={<div>Admin Home</div>} />
          </Routes>
        </TestUserProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('Admin Home')).toBeDefined()
  })

  it('renders sign-in route for unauthenticated users', () => {
    render(
      <MemoryRouter initialEntries={['/signin']}>
        <TestUserProvider user={null} roles={[]} activeRole={null} isLoading={false}>
          <Routes>
            <Route element={<PublicOnlyGuard />}>
              <Route path="/signin" element={<div>Sign in page</div>} />
            </Route>
          </Routes>
        </TestUserProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('Sign in page')).toBeDefined()
  })
})
