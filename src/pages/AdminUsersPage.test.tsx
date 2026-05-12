import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AdminUsersPage } from './AdminUsersPage'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'

const mockListAdminUsers = vi.fn()
const mockGetAdminUserAnalytics = vi.fn()
const mockAdminUpdateUserProfile = vi.fn()
const mockAdminUpdateUserRole = vi.fn()
const mockAdminSetUserActive = vi.fn()

vi.mock('../services/adminUsers', () => ({
  listAdminUsers: (...args: unknown[]) => mockListAdminUsers(...args),
  getAdminUserAnalytics: (...args: unknown[]) => mockGetAdminUserAnalytics(...args),
  adminUpdateUserProfile: (...args: unknown[]) => mockAdminUpdateUserProfile(...args),
  adminUpdateUserRole: (...args: unknown[]) => mockAdminUpdateUserRole(...args),
  adminSetUserActive: (...args: unknown[]) => mockAdminSetUserActive(...args),
}))

function renderAdminUsersPage() {
  return render(
    <MemoryRouter>
      <TestUserProvider user={mockSessions.authenticatedAdmin.user} role="admin" isLoading={false}>
        <AdminUsersPage />
      </TestUserProvider>
    </MemoryRouter>,
  )
}

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    mockGetAdminUserAnalytics.mockResolvedValue({
      totalUsers: 2,
      activeUsers: 2,
      inactiveUsers: 0,
      customerUsers: 1,
      staffUsers: 1,
      adminUsers: 1,
      recentSignups30Days: 1,
    })
  })

  it('loads users and analytics with deterministic state rendering', async () => {
    mockListAdminUsers.mockResolvedValue([
      {
        userId: 'u-1',
        email: 'ana@example.com',
        createdAt: '2026-01-01T00:00:00.000Z',
        lastSignInAt: null,
        name: 'Ana',
        phone: null,
        role: 'customer',
        isActive: true,
      },
      {
        userId: 'u-2',
        email: 'bruno@example.com',
        createdAt: '2026-02-01T00:00:00.000Z',
        lastSignInAt: null,
        name: 'Bruno',
        phone: '+54 11 9999 0000',
        role: 'staff',
        isActive: true,
      },
    ])

    renderAdminUsersPage()

    await waitFor(() => {
      expect(screen.getByText('Ana')).toBeDefined()
      expect(screen.getByText('Bruno')).toBeDefined()
      expect(screen.getByText('Total usuarios')).toBeDefined()
      expect(screen.getByText('2')).toBeDefined()
    })
  })

  it('updates selected user profile', async () => {
    mockListAdminUsers.mockResolvedValue([
      {
        userId: 'u-1',
        email: 'ana@example.com',
        createdAt: '2026-01-01T00:00:00.000Z',
        lastSignInAt: null,
        name: 'Ana',
        phone: null,
        role: 'customer',
        isActive: true,
      },
    ])

    mockAdminUpdateUserProfile.mockResolvedValue({ userId: 'u-1', name: 'Ana Maria', phone: null })

    renderAdminUsersPage()

    await waitFor(() => {
      expect(screen.getByDisplayValue('Ana')).toBeDefined()
    })

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana Maria' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar perfil de usuario' }))

    await waitFor(() => {
      expect(mockAdminUpdateUserProfile).toHaveBeenCalledWith('u-1', {
        name: 'Ana Maria',
        phone: '',
      })
      expect(screen.getByText('Perfil de usuario actualizado correctamente.')).toBeDefined()
    })
  })

  it('changes global role with confirmation', async () => {
    mockListAdminUsers.mockResolvedValue([
      {
        userId: 'u-1',
        email: 'ana@example.com',
        createdAt: '2026-01-01T00:00:00.000Z',
        lastSignInAt: null,
        name: 'Ana',
        phone: null,
        role: 'customer',
        isActive: true,
      },
      {
        userId: mockSessions.authenticatedAdmin.user.id,
        email: 'admin@example.com',
        createdAt: '2026-01-01T00:00:00.000Z',
        lastSignInAt: null,
        name: 'Admin',
        phone: null,
        role: 'admin',
        isActive: true,
      },
    ])

    mockAdminUpdateUserRole.mockResolvedValue({
      user_id: 'u-1',
      role: 'staff',
      is_active: true,
    })

    renderAdminUsersPage()

    await waitFor(() => {
      expect(screen.getByLabelText('Rol global')).toBeDefined()
    })

    fireEvent.change(screen.getByLabelText('Rol global'), { target: { value: 'staff' } })
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar rol' }))

    await waitFor(() => {
      expect(mockAdminUpdateUserRole).toHaveBeenCalledWith('u-1', 'staff')
      expect(screen.getByText('Rol actualizado correctamente.')).toBeDefined()
    })
  })

  it('deactivates user with confirmation and updates feedback', async () => {
    mockListAdminUsers.mockResolvedValue([
      {
        userId: 'u-1',
        email: 'ana@example.com',
        createdAt: '2026-01-01T00:00:00.000Z',
        lastSignInAt: null,
        name: 'Ana',
        phone: null,
        role: 'customer',
        isActive: true,
      },
      {
        userId: mockSessions.authenticatedAdmin.user.id,
        email: 'admin@example.com',
        createdAt: '2026-01-01T00:00:00.000Z',
        lastSignInAt: null,
        name: 'Admin',
        phone: null,
        role: 'admin',
        isActive: true,
      },
    ])

    mockAdminSetUserActive.mockResolvedValue({
      user_id: 'u-1',
      role: 'customer',
      is_active: false,
    })

    renderAdminUsersPage()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Desactivar usuario' })).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Desactivar usuario' }))

    await waitFor(() => {
      expect(mockAdminSetUserActive).toHaveBeenCalledWith('u-1', false)
      expect(screen.getByText('Usuario desactivado correctamente.')).toBeDefined()
    })
  })
})
