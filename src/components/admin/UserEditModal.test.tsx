import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { UserEditModal } from './UserEditModal'
import { TestUserProvider } from '../../hooks/__test-utils__/test-providers'
import { mockSessions } from '../../hooks/__test-utils__/fixtures'

const mockListAdminUsers = vi.fn()
const mockUpdateProfile = vi.fn()
const mockAssignRole = vi.fn()
const mockRevokeRole = vi.fn()
const mockInvoke = vi.fn()

vi.mock('../../services/adminUsers', () => ({
  listAdminUsers: (...a: unknown[]) => mockListAdminUsers(...a),
  adminUpdateUserProfile: (...a: unknown[]) => mockUpdateProfile(...a),
  adminAssignUserRole: (...a: unknown[]) => mockAssignRole(...a),
  adminRevokeUserRole: (...a: unknown[]) => mockRevokeRole(...a),
}))
vi.mock('../../lib/supabase', () => ({
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

function renderModal(userId: string) {
  const onClose = vi.fn()
  const onChanged = vi.fn()
  const onDeleted = vi.fn()
  render(
    <MemoryRouter>
      <TestUserProvider user={mockSessions.authenticatedAdmin.user} roles={['admin']} activeRole="admin" isLoading={false}>
        <UserEditModal userId={userId} onClose={onClose} onChanged={onChanged} onDeleted={onDeleted} />
      </TestUserProvider>
    </MemoryRouter>,
  )
  return { onClose, onChanged, onDeleted }
}

describe('UserEditModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListAdminUsers.mockResolvedValue([ana, admin])
  })

  it('is a pop-up with the user, roles and data', async () => {
    renderModal('u-1')
    const dialog = await screen.findByRole('dialog', { name: 'Ana' })
    expect(dialog.parentElement?.className).toContain('fixed inset-0')
    expect(dialog.parentElement?.className).toContain('items-end')
    expect(dialog.parentElement?.className).toContain('sm:items-center')
    expect(screen.getByText('ana@example.com')).toBeDefined()
    for (const label of ['Cliente', 'Staff', 'Administrador']) {
      expect(screen.getByRole('checkbox', { name: label })).toBeDefined()
    }
    expect((screen.getByRole('checkbox', { name: 'Cliente' }) as HTMLInputElement).checked).toBe(true)
    expect((screen.getByRole('checkbox', { name: 'Staff' }) as HTMLInputElement).checked).toBe(false)
  })

  it('is lean: no explanation under the roles, no "Datos" title, no access/alta/estado box', async () => {
    renderModal('u-1')
    await screen.findByRole('dialog', { name: 'Ana' })
    expect(screen.queryByText(/Cliente reserva turnos/)).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Datos' })).toBeNull()
    for (const text of ['Último acceso', 'Alta', 'Estado']) {
      expect(screen.queryByText(text)).toBeNull()
    }
    // what is left: roles, name, phone, save and the delete block
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument()
    expect(screen.getByLabelText(/Teléfono/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar perfil de usuario' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Eliminar usuario' })).toBeInTheDocument()
  })

  it('keeps the delete block reachable on phones: dynamic height and room for the bottom bar (edge case)', async () => {
    renderModal('u-1')
    const dialog = await screen.findByRole('dialog', { name: 'Ana' })
    expect(dialog.className).toContain('max-h-[92dvh]')
    const body = screen.getByRole('button', { name: 'Eliminar usuario' }).closest('div.overflow-y-auto')!
    expect(body.className).toContain('safe-area-inset-bottom')
    expect(body.className).toContain('overflow-y-auto')
  })

  it('assigns a role after confirmation and tells the list to refresh', async () => {
    mockAssignRole.mockResolvedValue(undefined)
    const { onChanged } = renderModal('u-1')

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Staff' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(mockAssignRole).toHaveBeenCalledWith('u-1', 'staff'))
    expect(await screen.findByText('Roles actualizados correctamente.')).toBeDefined()
    expect((screen.getByRole('checkbox', { name: 'Staff' }) as HTMLInputElement).checked).toBe(true)
    expect(onChanged).toHaveBeenCalled()
  })

  it('revokes a role after confirmation', async () => {
    mockRevokeRole.mockResolvedValue(undefined)
    mockListAdminUsers.mockResolvedValue([{ ...ana, roles: ['customer', 'staff'] }, admin])
    renderModal('u-1')

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Staff' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(mockRevokeRole).toHaveBeenCalledWith('u-1', 'staff'))
  })

  it('does not change anything if the confirmation is cancelled (edge case)', async () => {
    const { onChanged } = renderModal('u-1')

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Staff' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }))

    expect(mockAssignRole).not.toHaveBeenCalled()
    expect(onChanged).not.toHaveBeenCalled()
    expect((screen.getByRole('checkbox', { name: 'Staff' }) as HTMLInputElement).checked).toBe(false)
  })

  it('refuses to remove the last role (edge case)', async () => {
    renderModal('u-1')

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Cliente' }))

    expect(await screen.findByText('El usuario debe tener al menos un rol asignado.')).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Confirmar' })).toBeNull()
  })

  it('stops an admin from removing their own admin role (edge case)', async () => {
    renderModal(adminId)

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Administrador' }))

    expect(await screen.findByText(/restricción de seguridad/)).toBeDefined()
    expect(mockRevokeRole).not.toHaveBeenCalled()
  })

  it('shows an error when the role change fails (edge case)', async () => {
    mockAssignRole.mockRejectedValue(new Error('x'))
    renderModal('u-1')

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Staff' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByText(/No pudimos actualizar el rol/)).toBeDefined()
  })

  it('updates name and phone', async () => {
    mockUpdateProfile.mockResolvedValue({ userId: 'u-1', name: 'Ana Maria', phone: null })
    const { onChanged } = renderModal('u-1')

    fireEvent.change(await screen.findByLabelText('Nombre'), { target: { value: 'Ana Maria' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar perfil de usuario' }))

    await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledWith('u-1', { name: 'Ana Maria', phone: '' }))
    expect(await screen.findByText('Perfil de usuario actualizado correctamente.')).toBeDefined()
    expect(onChanged).toHaveBeenCalled()
  })

  it('rejects an empty name without saving (edge case)', async () => {
    renderModal('u-1')

    fireEvent.change(await screen.findByLabelText('Nombre'), { target: { value: ' ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar perfil de usuario' }))

    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })

  it('deletes the user after confirmation and tells the page', async () => {
    mockInvoke.mockResolvedValue({ error: null })
    const { onDeleted } = renderModal('u-1')

    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar usuario' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))

    await waitFor(() =>
      expect(mockInvoke).toHaveBeenCalledWith('admin-delete-user', { body: { userId: 'u-1' } }),
    )
    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
  })

  it('stays open and shows the error when deleting fails (edge case)', async () => {
    mockInvoke.mockResolvedValue({ error: new Error('No se pudo eliminar') })
    const { onDeleted } = renderModal('u-1')

    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar usuario' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))

    expect(await screen.findByText('No se pudo eliminar')).toBeDefined()
    expect(onDeleted).not.toHaveBeenCalled()
  })

  it('says so when the user does not exist (edge case)', async () => {
    renderModal('nope')
    expect(await screen.findByText('No encontramos a ese usuario.')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeDefined()
  })

  it('shows an error when the user cannot be loaded (edge case)', async () => {
    mockListAdminUsers.mockRejectedValue(new Error('down'))
    renderModal('u-1')
    expect(await screen.findByText('No pudimos cargar el usuario en este momento.')).toBeDefined()
  })

  it('closes with the × button and with Escape (edge case)', async () => {
    const { onClose } = renderModal('u-1')
    await screen.findByRole('dialog', { name: 'Ana' })
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('Escape does not close it while a confirmation is open (edge case)', async () => {
    const { onClose } = renderModal('u-1')
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Staff' }))
    await screen.findByRole('button', { name: 'Confirmar' })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })
})
