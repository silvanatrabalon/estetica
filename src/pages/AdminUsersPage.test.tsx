import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AdminUsersPage } from './AdminUsersPage'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'

const mockListAdminUsers = vi.fn()
const mockGetAdminUserAnalytics = vi.fn()
const mockAdminSetUserActive = vi.fn()

vi.mock('../services/adminUsers', () => ({
  listAdminUsers: (...args: unknown[]) => mockListAdminUsers(...args),
  getAdminUserAnalytics: (...args: unknown[]) => mockGetAdminUserAnalytics(...args),
  adminSetUserActive: (...args: unknown[]) => mockAdminSetUserActive(...args),
}))

function renderPage(state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/admin/users', state }]}>
      <TestUserProvider user={mockSessions.authenticatedAdmin.user} roles={['admin']} activeRole="admin" isLoading={false}>
        <AdminUsersPage />
      </TestUserProvider>
    </MemoryRouter>,
  )
}

const ana = {
  userId: 'u-1',
  email: 'ana@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastSignInAt: null,
  name: 'Ana',
  phone: null,
  roles: ['customer'],
  isActive: true,
}

const admin = {
  userId: mockSessions.authenticatedAdmin.user.id,
  email: 'admin@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastSignInAt: null,
  name: 'Admin',
  phone: null,
  roles: ['admin'],
  isActive: true,
}

describe('AdminUsersPage (simple directory)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAdminUserAnalytics.mockResolvedValue({
      totalUsers: 2,
      activeUsers: 2,
      inactiveUsers: 0,
      customerUsers: 1,
      staffUsers: 0,
      adminUsers: 1,
      recentSignups30Days: 1,
    })
  })

  it('lists users with email, roles and status', async () => {
    mockListAdminUsers.mockResolvedValue([ana, admin])
    renderPage()

    expect(await screen.findByText('Ana')).toBeDefined()
    expect(screen.getByText('ana@example.com')).toBeDefined()
    expect(screen.getByText('Cliente')).toBeDefined()
    expect(screen.getByText('Administrador')).toBeDefined()
    expect(screen.getByText('Total usuarios')).toBeDefined()
  })

  it('has a title that mentions roles and explains where to edit them', async () => {
    mockListAdminUsers.mockResolvedValue([ana])
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Usuarios y roles' })).toBeDefined()
    expect(screen.getByText(/usá “Editar roles”/)).toBeDefined()
  })

  it('no longer edits roles or personal data inline', async () => {
    mockListAdminUsers.mockResolvedValue([ana])
    renderPage()
    await screen.findByText('Ana')

    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(screen.queryByText('Roles asignados')).toBeNull()
    expect(screen.queryByRole('button', { name: /Guardar perfil/ })).toBeNull()
    expect(screen.queryByLabelText(/Eliminar usuario/)).toBeNull()
  })

  it('each row links to its own edit screen', async () => {
    mockListAdminUsers.mockResolvedValue([ana, admin])
    renderPage()

    const link = await screen.findByRole('link', { name: 'Editar roles de Ana' })
    expect(link).toHaveAttribute('href', '/admin/users/u-1')
    expect(screen.getByRole('link', { name: 'Editar roles de Admin' })).toHaveAttribute(
      'href',
      `/admin/users/${admin.userId}`,
    )
  })

  it('deactivates a user after confirmation', async () => {
    mockListAdminUsers.mockResolvedValue([ana, admin])
    mockAdminSetUserActive.mockResolvedValue({ user_id: 'u-1', role: 'customer', is_active: false })
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar a Ana' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(mockAdminSetUserActive).toHaveBeenCalledWith('u-1', false))
    expect(await screen.findByText('Usuario desactivado correctamente.')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Reactivar a Ana' })).toBeDefined()
  })

  it('reactivates an inactive user (edge case)', async () => {
    mockListAdminUsers.mockResolvedValue([{ ...ana, isActive: false }, admin])
    mockAdminSetUserActive.mockResolvedValue({ user_id: 'u-1', role: 'customer', is_active: true })
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Reactivar a Ana' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(mockAdminSetUserActive).toHaveBeenCalledWith('u-1', true))
    expect(await screen.findByText('Usuario reactivado correctamente.')).toBeDefined()
  })

  it('blocks deactivating the last active admin (edge case)', async () => {
    mockListAdminUsers.mockResolvedValue([ana, admin])
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar a Admin' }))

    expect(await screen.findByText('No podés desactivar al último administrador activo.')).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Confirmar' })).toBeNull()
    expect(mockAdminSetUserActive).not.toHaveBeenCalled()
  })

  it('shows an error when the status change fails (edge case)', async () => {
    mockListAdminUsers.mockResolvedValue([ana, admin])
    mockAdminSetUserActive.mockRejectedValue(new Error('x'))
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar a Ana' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByText(/No pudimos cambiar el estado del usuario/)).toBeDefined()
  })

  it('filters by name or email and says when nothing matches (edge case)', async () => {
    mockListAdminUsers.mockResolvedValue([ana, admin])
    renderPage()
    await screen.findByText('Ana')

    fireEvent.change(screen.getByLabelText('Buscar usuarios'), { target: { value: 'admin@' } })
    expect(screen.queryByText('Ana')).toBeNull()
    expect(screen.getByText('Admin')).toBeDefined()

    fireEvent.change(screen.getByLabelText('Buscar usuarios'), { target: { value: 'zzz' } })
    expect(screen.getByText('No se encontraron usuarios con ese criterio.')).toBeDefined()
  })

  it('shows an empty state when there are no users (edge case)', async () => {
    mockListAdminUsers.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText('No hay usuarios disponibles para administrar.')).toBeDefined()
  })

  it('shows an error when the directory cannot be loaded (edge case)', async () => {
    mockListAdminUsers.mockRejectedValue(new Error('down'))
    renderPage()
    expect(await screen.findByText(/No pudimos cargar la gestión de usuarios/)).toBeDefined()
  })

  it('shows the notice passed after deleting a user (edge case)', async () => {
    mockListAdminUsers.mockResolvedValue([ana])
    renderPage({ notice: 'Usuario eliminado correctamente.' })
    expect(await screen.findByText('Usuario eliminado correctamente.')).toBeDefined()
  })
})
