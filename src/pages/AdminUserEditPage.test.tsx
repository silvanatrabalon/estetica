import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminUserEditPage } from './AdminUserEditPage'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'

const mockListAdminUsers = vi.fn()
const mockUpdateProfile = vi.fn()
const mockAssignRole = vi.fn()
const mockRevokeRole = vi.fn()
const mockInvoke = vi.fn()

vi.mock('../services/adminUsers', () => ({
  listAdminUsers: (...a: unknown[]) => mockListAdminUsers(...a),
  adminUpdateUserProfile: (...a: unknown[]) => mockUpdateProfile(...a),
  adminAssignUserRole: (...a: unknown[]) => mockAssignRole(...a),
  adminRevokeUserRole: (...a: unknown[]) => mockRevokeRole(...a),
}))
vi.mock('../lib/supabase', () => ({
  initSupabase: () => ({ functions: { invoke: (...a: unknown[]) => mockInvoke(...a) } }),
}))

const adminId = mockSessions.authenticatedAdmin.user.id

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
  userId: adminId,
  email: 'admin@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastSignInAt: null,
  name: 'Admin',
  phone: null,
  roles: ['admin', 'staff'],
  isActive: true,
}

function renderAt(userId: string) {
  return render(
    <MemoryRouter initialEntries={[`/admin/users/${userId}`]}>
      <TestUserProvider user={mockSessions.authenticatedAdmin.user} roles={['admin']} activeRole="admin" isLoading={false}>
        <Routes>
          <Route path="/admin/users/:userId" element={<AdminUserEditPage />} />
          <Route path="/admin/users" element={<p>LISTA</p>} />
        </Routes>
      </TestUserProvider>
    </MemoryRouter>,
  )
}

describe('AdminUserEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListAdminUsers.mockResolvedValue([ana, admin])
  })

  it('shows the user with roles, data and a way back', async () => {
    renderAt('u-1')

    expect(await screen.findByRole('heading', { name: 'Ana' })).toBeDefined()
    expect(screen.getByText('ana@example.com')).toBeDefined()
    expect(screen.getByRole('link', { name: /Usuarios y roles/ })).toHaveAttribute('href', '/admin/users')
    for (const label of ['Cliente', 'Staff', 'Administrador']) {
      expect(screen.getByRole('checkbox', { name: label })).toBeDefined()
    }
    expect((screen.getByRole('checkbox', { name: 'Cliente' }) as HTMLInputElement).checked).toBe(true)
    expect((screen.getByRole('checkbox', { name: 'Staff' }) as HTMLInputElement).checked).toBe(false)
  })

  it('assigns a role after confirmation', async () => {
    mockAssignRole.mockResolvedValue(undefined)
    renderAt('u-1')

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Staff' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(mockAssignRole).toHaveBeenCalledWith('u-1', 'staff'))
    expect(await screen.findByText('Roles actualizados correctamente.')).toBeDefined()
    expect((screen.getByRole('checkbox', { name: 'Staff' }) as HTMLInputElement).checked).toBe(true)
  })

  it('revokes a role after confirmation', async () => {
    mockRevokeRole.mockResolvedValue(undefined)
    mockListAdminUsers.mockResolvedValue([{ ...ana, roles: ['customer', 'staff'] }, admin])
    renderAt('u-1')

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Staff' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(mockRevokeRole).toHaveBeenCalledWith('u-1', 'staff'))
  })

  it('does not change anything if the confirmation is cancelled (edge case)', async () => {
    renderAt('u-1')

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Staff' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }))

    expect(mockAssignRole).not.toHaveBeenCalled()
    expect((screen.getByRole('checkbox', { name: 'Staff' }) as HTMLInputElement).checked).toBe(false)
  })

  it('refuses to remove the last role (edge case)', async () => {
    renderAt('u-1')

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Cliente' }))

    expect(await screen.findByText('El usuario debe tener al menos un rol asignado.')).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Confirmar' })).toBeNull()
  })

  it('stops an admin from removing their own admin role (edge case)', async () => {
    renderAt(adminId)

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Administrador' }))

    expect(await screen.findByText(/restricción de seguridad/)).toBeDefined()
    expect(mockRevokeRole).not.toHaveBeenCalled()
  })

  it('shows an error when the role change fails (edge case)', async () => {
    mockAssignRole.mockRejectedValue(new Error('x'))
    renderAt('u-1')

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Staff' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByText(/No pudimos actualizar el rol/)).toBeDefined()
  })

  it('updates name and phone', async () => {
    mockUpdateProfile.mockResolvedValue({ userId: 'u-1', name: 'Ana Maria', phone: null })
    renderAt('u-1')

    fireEvent.change(await screen.findByLabelText('Nombre'), { target: { value: 'Ana Maria' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar perfil de usuario' }))

    await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledWith('u-1', { name: 'Ana Maria', phone: '' }))
    expect(await screen.findByText('Perfil de usuario actualizado correctamente.')).toBeDefined()
  })

  it('rejects an empty name without saving (edge case)', async () => {
    renderAt('u-1')

    fireEvent.change(await screen.findByLabelText('Nombre'), { target: { value: ' ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar perfil de usuario' }))

    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })

  it('deletes the user after confirmation and goes back to the list', async () => {
    mockInvoke.mockResolvedValue({ error: null })
    renderAt('u-1')

    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar usuario' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))

    await waitFor(() =>
      expect(mockInvoke).toHaveBeenCalledWith('admin-delete-user', { body: { userId: 'u-1' } }),
    )
    expect(await screen.findByText('LISTA')).toBeDefined()
  })

  it('stays on the page and shows the error when deleting fails (edge case)', async () => {
    mockInvoke.mockResolvedValue({ error: new Error('No se pudo eliminar') })
    renderAt('u-1')

    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar usuario' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))

    expect(await screen.findByText('No se pudo eliminar')).toBeDefined()
    expect(screen.queryByText('LISTA')).toBeNull()
  })

  it('says so when the user does not exist (edge case)', async () => {
    renderAt('nope')
    expect(await screen.findByText('No encontramos a ese usuario.')).toBeDefined()
    expect(screen.getByRole('link', { name: /Usuarios y roles/ })).toBeDefined()
  })

  it('shows an error when the user cannot be loaded (edge case)', async () => {
    mockListAdminUsers.mockRejectedValue(new Error('down'))
    renderAt('u-1')
    expect(await screen.findByText('No pudimos cargar el usuario en este momento.')).toBeDefined()
  })

  it('starts at the top of the screen when it opens (edge case)', async () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    renderAt('u-1')

    await screen.findByRole('heading', { name: 'Ana' })
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled())
  })

  it('does not crash when scrollIntoView is unavailable (edge case)', async () => {
    // @ts-expect-error simulate an environment without scrollIntoView
    Element.prototype.scrollIntoView = undefined
    renderAt('u-1')

    expect(await screen.findByRole('heading', { name: 'Ana' })).toBeDefined()
  })
})
