import { describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { AuthGuard } from './AuthGuard'
import { RoleGuard } from './RoleGuard'
import { TestUserProvider } from '../../hooks/__test-utils__/test-providers'
import { mockSessions } from '../../hooks/__test-utils__/fixtures'

function renderProtectedRoutes(initialPath: string, role: 'customer' | 'staff' | 'admin' | null) {
  const user =
    role === 'customer'
      ? mockSessions.authenticatedCustomer.user
      : role === 'staff'
        ? mockSessions.authenticatedStaff.user
        : role === 'admin'
          ? mockSessions.authenticatedAdmin.user
          : null

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <TestUserProvider user={user} role={role} isLoading={false}>
        <Routes>
          <Route path="/signin" element={<div>Sign in page</div>} />
          <Route path="/unauthorized" element={<div>Unauthorized page</div>} />

          <Route element={<AuthGuard />}>
            <Route path="/dashboard" element={<div>Dashboard page</div>} />

            <Route element={<RoleGuard allowedRoles={['admin']} />}>
              <Route path="/admin/users" element={<div>Admin users page</div>} />
            </Route>
          </Route>
        </Routes>
      </TestUserProvider>
    </MemoryRouter>,
  )
}

describe('protected-route integration flows', () => {
  it('redirects guest from admin route to sign-in', () => {
    renderProtectedRoutes('/admin/users', null)

    expect(screen.getByText('Sign in page')).toBeDefined()
  })

  it('allows admin user on admin route', () => {
    renderProtectedRoutes('/admin/users', 'admin')

    expect(screen.getByText('Admin users page')).toBeDefined()
  })

  it('redirects staff user from admin route to unauthorized', () => {
    renderProtectedRoutes('/admin/users', 'staff')

    expect(screen.getByText('Unauthorized page')).toBeDefined()
  })
})
