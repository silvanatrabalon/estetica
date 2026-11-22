import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AdminUsersPage } from './AdminUsersPage'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'

const mockListAdminUsers = vi.fn()
const mockAdminSetUserActive = vi.fn()
const mockListInvitations = vi.fn()
const mockInviteUser = vi.fn()
const mockDeleteInvitation = vi.fn()

vi.mock('../services/adminUsers', () => ({
  listAdminUsers: (...args: unknown[]) => mockListAdminUsers(...args),
  adminSetUserActive: (...args: unknown[]) => mockAdminSetUserActive(...args),
  adminListUserInvitations: (...args: unknown[]) => mockListInvitations(...args),
  adminInviteUser: (...args: unknown[]) => mockInviteUser(...args),
  adminDeleteUserInvitation: (...args: unknown[]) => mockDeleteInvitation(...args),
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
    mockListInvitations.mockResolvedValue([])
  })

  it('lists users with email, roles and status', async () => {
    mockListAdminUsers.mockResolvedValue([ana, admin])
    renderPage()

    expect(await screen.findByText('Ana')).toBeDefined()
    expect(screen.getByText('ana@example.com')).toBeDefined()
    expect(screen.getByText('Cliente')).toBeDefined()
    expect(screen.getByText('Administrador')).toBeDefined()
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

  describe('filters and retry', () => {
    const staffUser = { ...ana, userId: 'u-3', name: 'Sofía', email: 'sofia@example.com', roles: ['staff', 'customer'] }
    const inactive = { ...ana, userId: 'u-4', name: 'Inés', email: 'ines@example.com', isActive: false }

    it('has no "Reintentar" button when the directory loaded fine', async () => {
      mockListAdminUsers.mockResolvedValue([ana])
      renderPage()
      await screen.findByText('Ana')
      expect(screen.queryByRole('button', { name: /Reintentar/ })).toBeNull()
    })

    it('offers "Reintentar" only when loading failed, and reloads on click (edge case)', async () => {
      mockListAdminUsers.mockRejectedValueOnce(new Error('down'))
      renderPage()
      await screen.findByText(/No pudimos cargar la gestión de usuarios/)
      mockListAdminUsers.mockResolvedValue([ana])
      fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }))
      expect(await screen.findByText('Ana')).toBeDefined()
      expect(screen.queryByRole('button', { name: /Reintentar/ })).toBeNull()
    })

    it('shows how many users each role filter has', async () => {
      mockListAdminUsers.mockResolvedValue([ana, admin, staffUser])
      renderPage()
      await screen.findByText('Ana')
      const group = screen.getByRole('group', { name: 'Filtrar por rol' })
      expect(group.textContent).toContain('Todos3')
      expect(group.textContent).toContain('Administradores1')
      expect(group.textContent).toContain('Staff1')
      expect(group.textContent).toContain('Clientes2')
    })

    it('filters by role (a user with several roles appears in each)', async () => {
      mockListAdminUsers.mockResolvedValue([ana, admin, staffUser])
      renderPage()
      await screen.findByText('Ana')
      fireEvent.click(screen.getByRole('button', { name: /^Staff/ }))
      expect(screen.getByText('Sofía')).toBeDefined()
      expect(screen.queryByText('Ana')).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: /^Clientes/ }))
      expect(screen.getByText('Sofía')).toBeDefined()
      expect(screen.getByText('Ana')).toBeDefined()
      expect(screen.queryByText('Admin')).toBeNull()
    })

    it('filters by status', async () => {
      mockListAdminUsers.mockResolvedValue([ana, inactive])
      renderPage()
      await screen.findByText('Ana')
      fireEvent.click(screen.getByRole('button', { name: 'Inactivos' }))
      expect(screen.getByText('Inés')).toBeDefined()
      expect(screen.queryByText('Ana')).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: 'Activos' }))
      expect(screen.getByText('Ana')).toBeDefined()
      expect(screen.queryByText('Inés')).toBeNull()
    })

    it('combines search, role and status, and says when nothing matches (edge case)', async () => {
      mockListAdminUsers.mockResolvedValue([ana, admin, staffUser, inactive])
      renderPage()
      await screen.findByText('Ana')
      fireEvent.click(screen.getByRole('button', { name: /^Clientes/ }))
      fireEvent.click(screen.getByRole('button', { name: 'Inactivos' }))
      fireEvent.change(screen.getByLabelText('Buscar usuarios'), { target: { value: 'sofia' } })
      expect(screen.getByText('No se encontraron usuarios con ese criterio.')).toBeDefined()
    })
  })

  describe('add a user (invitation)', () => {
    const pending = {
      id: 'i1',
      email: 'nora@mail.com',
      name: 'Nora Díaz',
      roles: ['admin', 'staff'],
      createdAt: '2026-11-21T00:00:00Z',
    }

    async function openForm() {
      mockListAdminUsers.mockResolvedValue([ana])
      renderPage()
      await screen.findByText('Ana')
      fireEvent.click(screen.getByRole('button', { name: '+ Agregar usuario' }))
    }

    it('offers email, name and the three roles, with "Cliente" checked by default', async () => {
      await openForm()
      expect(screen.getByLabelText('Email')).toBeDefined()
      expect(screen.getByLabelText(/Nombre/)).toBeDefined()
      expect(screen.getByRole('checkbox', { name: 'Cliente' })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Staff' })).not.toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Administrador' })).not.toBeChecked()
    })

    it('saves the invitation with the chosen roles and says what happens next', async () => {
      mockInviteUser.mockResolvedValue({ status: 'invited', invitationId: 'i1' })
      await openForm()
      mockListInvitations.mockResolvedValue([pending])
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'Nora@Mail.com' } })
      fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Nora Díaz' } })
      fireEvent.click(screen.getByRole('checkbox', { name: 'Cliente' }))
      fireEvent.click(screen.getByRole('checkbox', { name: 'Administrador' }))
      fireEvent.click(screen.getByRole('checkbox', { name: 'Staff' }))
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

      await waitFor(() => expect(mockInviteUser).toHaveBeenCalledWith('Nora@Mail.com', 'Nora Díaz', ['admin', 'staff']))
      expect(await screen.findByText(/Cuando nora@mail.com entre a la app, ya tiene sus roles/)).toBeDefined()
      expect(screen.getByText('Invitación pendiente')).toBeDefined()
    })

    it('needs at least one role (edge case)', async () => {
      await openForm()
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nora@mail.com' } })
      fireEvent.click(screen.getByRole('checkbox', { name: 'Cliente' }))
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
      expect(await screen.findByText('Elegí al menos un rol.')).toBeDefined()
      expect(mockInviteUser).not.toHaveBeenCalled()
    })

    it('an email that already has an account points to "Editar roles" instead (edge case)', async () => {
      mockInviteUser.mockResolvedValue({ status: 'exists', userId: 'u-1' })
      await openForm()
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@example.com' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
      expect(await screen.findByText(/Ese email ya tiene cuenta/)).toBeDefined()
      expect(screen.getByRole('link', { name: 'Ir a Editar roles de esa cuenta' })).toHaveAttribute('href', '/admin/users/u-1')
    })

    it('shows the error and keeps the form open when the invitation fails (edge case)', async () => {
      mockInviteUser.mockRejectedValue(new Error('Ya hay una invitación pendiente para ese email.'))
      await openForm()
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nora@mail.com' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
      expect(await screen.findByText('Ya hay una invitación pendiente para ese email.')).toBeDefined()
      expect(screen.getByLabelText('Email')).toBeDefined()
    })

    it('lists the pending invitations with their roles and removes one after confirming', async () => {
      mockListAdminUsers.mockResolvedValue([ana])
      mockListInvitations.mockResolvedValue([pending])
      mockDeleteInvitation.mockResolvedValue(undefined)
      renderPage()
      expect(await screen.findByText('Nora Díaz')).toBeDefined()
      expect(screen.getByText('Administrador, Staff')).toBeDefined()

      fireEvent.click(screen.getByRole('button', { name: 'Quitar la invitación de nora@mail.com' }))
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
      await waitFor(() => expect(mockDeleteInvitation).toHaveBeenCalledWith('i1'))
      expect(await screen.findByText('Invitación quitada.')).toBeDefined()
      expect(screen.queryByText('Nora Díaz')).toBeNull()
    })

    it('does not remove an invitation if the confirmation is cancelled (edge case)', async () => {
      mockListAdminUsers.mockResolvedValue([ana])
      mockListInvitations.mockResolvedValue([pending])
      renderPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Quitar la invitación de nora@mail.com' }))
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
      expect(mockDeleteInvitation).not.toHaveBeenCalled()
    })

    it('the page still works if the invitations cannot be loaded (edge case)', async () => {
      mockListAdminUsers.mockResolvedValue([ana])
      mockListInvitations.mockRejectedValue(new Error('down'))
      renderPage()
      expect(await screen.findByText('Ana')).toBeDefined()
      expect(screen.queryByText('Invitaciones pendientes')).toBeNull()
    })
  })
})
