import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminStaffPage } from './AdminStaffPage'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'

const mockListAdminStaffMembers = vi.fn()
const mockAdminCreateStaffMember = vi.fn()
const mockAdminSetStaffActive = vi.fn()
const mockCreateWithoutAccount = vi.fn()
const mockLinkStaff = vi.fn()
const mockRenameStaff = vi.fn()

vi.mock('../services/adminStaff', () => ({
  listAdminStaffMembers: (...args: unknown[]) => mockListAdminStaffMembers(...args),
  adminCreateStaffMember: (...args: unknown[]) => mockAdminCreateStaffMember(...args),
  adminSetStaffActive: (...args: unknown[]) => mockAdminSetStaffActive(...args),
  adminCreateStaffWithoutAccount: (...args: unknown[]) => mockCreateWithoutAccount(...args),
  adminLinkStaffMember: (...args: unknown[]) => mockLinkStaff(...args),
  adminRenameStaffMember: (...args: unknown[]) => mockRenameStaff(...args),
}))

const mockListAdminUsers = vi.fn()

vi.mock('../services/adminUsers', () => ({
  listAdminUsers: (...args: unknown[]) => mockListAdminUsers(...args),
}))

function renderAdminStaffPage() {
  return render(
    <MemoryRouter>
      <TestUserProvider user={mockSessions.authenticatedAdmin.user} roles={['admin']} activeRole="admin" isLoading={false}>
        <AdminStaffPage />
      </TestUserProvider>
    </MemoryRouter>,
  )
}

const mockUsers = [
  {
    userId: 'u-1',
    email: 'ana@example.com',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastSignInAt: null,
    name: 'Ana García',
    phone: null,
    role: 'customer',
    isActive: true,
  },
  {
    userId: 'u-2',
    email: 'bruno@example.com',
    createdAt: '2026-02-01T00:00:00.000Z',
    lastSignInAt: null,
    name: 'Bruno López',
    phone: null,
    role: 'staff',
    isActive: true,
  },
]

const mockStaffMember = {
  id: 'sm-1',
  organizationId: 'org-1',
  profileUserId: 'u-2',
  displayName: 'Bruno',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  fullName: 'Bruno López',
  role: 'staff',
}

describe('AdminStaffPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListAdminUsers.mockResolvedValue(mockUsers)
  })

  it('shows loading state initially', () => {
    mockListAdminStaffMembers.mockReturnValue(new Promise(() => {}))
    renderAdminStaffPage()
    // Loading state renders skeletons only: the page heading must not be shown yet
    expect(screen.queryByRole('heading', { name: 'Profesionales' })).toBeNull()
  })

  it('shows empty state when no staff members exist', async () => {
    mockListAdminStaffMembers.mockResolvedValue([])
    renderAdminStaffPage()
    await waitFor(() => {
      expect(screen.getByText('Sin profesionales registrados')).toBeDefined()
    })
  })

  it('renders staff directory with member data', async () => {
    mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
    renderAdminStaffPage()
    await waitFor(() => {
      expect(screen.getByText('Bruno')).toBeDefined()
      expect(screen.getByText('Bruno López')).toBeDefined()
      expect(screen.getByText('Activo')).toBeDefined()
    })
  })

  async function openCreateForm() {
    fireEvent.click((await screen.findAllByRole('button', { name: /Agregar profesional/ }))[0])
    await screen.findByLabelText('Usuario vinculado')
  }

  it('the create form only asks for the account, with no display name field', async () => {
    mockListAdminStaffMembers.mockResolvedValue([])
    renderAdminStaffPage()
    await openCreateForm()

    expect(screen.queryByLabelText('Nombre para mostrar')).toBeNull()
    expect(screen.getByText(/usa el nombre de esa cuenta/)).toBeDefined()
  })

  it('creates the professional from the chosen account, without sending a name', async () => {
    mockListAdminStaffMembers.mockResolvedValue([])
    mockAdminCreateStaffMember.mockResolvedValue({ ...mockStaffMember, profileUserId: 'u-1', displayName: 'Ana García' })
    renderAdminStaffPage()
    await openCreateForm()

    fireEvent.change(screen.getByLabelText('Usuario vinculado'), { target: { value: 'u-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(mockAdminCreateStaffMember).toHaveBeenCalledWith('u-1'))
    expect(await screen.findByText('Profesional creado correctamente.')).toBeDefined()
  })

  it('asks to choose an account before saving (edge case)', async () => {
    mockListAdminStaffMembers.mockResolvedValue([])
    renderAdminStaffPage()
    await openCreateForm()

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('Seleccioná un usuario para vincular al profesional.')).toBeDefined()
    expect(mockAdminCreateStaffMember).not.toHaveBeenCalled()
  })

  it('shows a clear error when the account already is a professional (edge case)', async () => {
    mockListAdminStaffMembers.mockResolvedValue([])
    mockAdminCreateStaffMember.mockRejectedValue(new Error('duplicate key value'))
    renderAdminStaffPage()
    await openCreateForm()

    fireEvent.change(screen.getByLabelText('Usuario vinculado'), { target: { value: 'u-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('Ya existe un profesional vinculado a ese usuario.')).toBeDefined()
  })

  it('calls adminSetStaffActive with false to deactivate', async () => {
    mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
    mockAdminSetStaffActive.mockResolvedValue(undefined)
    renderAdminStaffPage()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Desactivar' })).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Desactivar' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDefined()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => {
      expect(mockAdminSetStaffActive).toHaveBeenCalledWith('sm-1', false)
    })
  })

  it('calls adminSetStaffActive with true to reactivate', async () => {
    const inactiveMember = { ...mockStaffMember, isActive: false }
    mockListAdminStaffMembers.mockResolvedValue([inactiveMember])
    mockAdminSetStaffActive.mockResolvedValue(undefined)
    renderAdminStaffPage()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reactivar' })).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Reactivar' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDefined()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => {
      expect(mockAdminSetStaffActive).toHaveBeenCalledWith('sm-1', true)
    })
  })
  describe('No separate display name', () => {
    it('cards have no "Cambiar nombre": the name comes from the account (edge case)', async () => {
      mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
      renderAdminStaffPage()
      await screen.findByText('Bruno')
      expect(screen.queryByRole('button', { name: 'Cambiar nombre' })).toBeNull()
      expect(screen.queryByRole('heading', { name: 'Editar profesional' })).toBeNull()
    })
  })
  describe('Editar roles button', () => {
    function renderWithRoutes() {
      return render(
        <MemoryRouter initialEntries={['/admin/staff']}>
          <TestUserProvider user={mockSessions.authenticatedAdmin.user} roles={['admin']} activeRole="admin" isLoading={false}>
            <Routes>
              <Route path="/admin/staff" element={<AdminStaffPage />} />
              <Route path="/admin/users/:userId" element={<p>PANTALLA ROLES</p>} />
            </Routes>
          </TestUserProvider>
        </MemoryRouter>,
      )
    }

    it('the card has Editar roles instead of an ambiguous Editar', async () => {
      mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
      renderAdminStaffPage()

      expect(await screen.findByRole('button', { name: 'Editar roles' })).toBeDefined()
      expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull()
    })

    it('Editar roles opens that person\'s edit screen in Usuarios y roles', async () => {
      mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
      renderWithRoutes()

      fireEvent.click(await screen.findByRole('button', { name: 'Editar roles' }))

      expect(await screen.findByText('PANTALLA ROLES')).toBeDefined()
    })

    it('hides Editar roles when the professional has no linked user (edge case)', async () => {
      mockListAdminStaffMembers.mockResolvedValue([{ ...mockStaffMember, profileUserId: null }])
      renderAdminStaffPage()

      await screen.findByText('Bruno')
      expect(screen.queryByRole('button', { name: 'Editar roles' })).toBeNull()
    })

    it('the footer note still links to Usuarios y roles', async () => {
      mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
      renderAdminStaffPage()

      await screen.findByText('Bruno')
      expect(screen.getByRole('link', { name: 'Usuarios y roles' })).toHaveAttribute('href', '/admin/users')
    })
  })

  describe('Role badges', () => {
    it('shows every role of the linked user, highest first', async () => {
      mockListAdminUsers.mockResolvedValue([
        { ...mockUsers[1], userId: 'u-2', roles: ['customer', 'admin', 'staff'] },
      ])
      mockListAdminStaffMembers.mockResolvedValue([{ ...mockStaffMember, role: 'staff' }])
      renderAdminStaffPage()

      await screen.findByText('Bruno')
      const card = screen.getByText('Bruno').closest('div.shell-surface') as HTMLElement
      const badges = ['Administrador', 'Staff', 'Cliente'].map((t) =>
        Array.from(card.querySelectorAll('span')).find((el) => el.textContent === t),
      )
      expect(badges.every(Boolean)).toBe(true)
      const order = Array.from(card.querySelectorAll('span.rounded-full'))
        .map((el) => el.textContent)
        .filter((t) => ['Administrador', 'Staff', 'Cliente'].includes(t ?? ''))
      expect(order).toEqual(['Administrador', 'Staff', 'Cliente'])
    })

    it('shows a single role when the user has only one', async () => {
      mockListAdminUsers.mockResolvedValue([{ ...mockUsers[1], userId: 'u-2', roles: ['staff'] }])
      mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
      renderAdminStaffPage()

      await screen.findByText('Bruno')
      expect(screen.queryByText('Administrador')).toBeNull()
      expect(screen.queryByText('Cliente')).toBeNull()
    })

    it('falls back to the staff list role when the user is not in the directory (edge case)', async () => {
      mockListAdminUsers.mockResolvedValue([])
      mockListAdminStaffMembers.mockResolvedValue([{ ...mockStaffMember, role: 'staff' }])
      renderAdminStaffPage()

      await screen.findByText('Bruno')
      const card = screen.getByText('Bruno').closest('div.shell-surface') as HTMLElement
      expect(Array.from(card.querySelectorAll('span')).some((el) => el.textContent === 'Staff')).toBe(true)
    })

    it('shows "Sin cuenta" instead of a role when the professional has no linked user (edge case)', async () => {
      mockListAdminUsers.mockResolvedValue(mockUsers)
      mockListAdminStaffMembers.mockResolvedValue([{ ...mockStaffMember, profileUserId: null, role: 'customer' }])
      renderAdminStaffPage()

      await screen.findByText('Bruno')
      const card = screen.getByText('Bruno').closest('div.shell-surface') as HTMLElement
      expect(Array.from(card.querySelectorAll('span')).some((el) => el.textContent === 'Sin cuenta')).toBe(true)
      expect(Array.from(card.querySelectorAll('span')).some((el) => el.textContent === 'Cliente')).toBe(false)
    })
  })

  describe('Layout and defaults', () => {
    it('has a single add button in the header and no floating one (edge case)', async () => {
      mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
      renderAdminStaffPage()
      await screen.findByText('Bruno')
      expect(screen.getAllByRole('button', { name: /Agregar profesional/ })).toHaveLength(1)
      expect(screen.queryByRole('button', { name: '+ Agregar' })).toBeNull()
    })

    it('shows the primary actions as buttons and the secondary ones as links on each card', async () => {
      mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
      renderAdminStaffPage()
      await screen.findByText('Bruno')
      for (const name of ['Disponibilidad', 'Servicios', 'Editar roles', 'Desactivar']) {
        expect(screen.getByRole('button', { name })).toBeInTheDocument()
      }
    })
  })

  describe('professionals without an account', () => {
    const noAccount = {
      ...mockStaffMember,
      id: 'sm-9',
      profileUserId: null,
      displayName: 'Laura Sosa',
      fullName: null,
      inviteEmail: 'laura@mail.com',
    }

    async function openGuestForm() {
      fireEvent.click((await screen.findAllByRole('button', { name: /Agregar profesional/ }))[0])
      fireEvent.click(await screen.findByRole('radio', { name: 'Sin cuenta' }))
    }

    it('offers "Con cuenta" and "Sin cuenta" and the second one asks for a name and an optional email', async () => {
      mockListAdminStaffMembers.mockResolvedValue([])
      renderAdminStaffPage()
      fireEvent.click((await screen.findAllByRole('button', { name: /Agregar profesional/ }))[0])
      expect(screen.getByRole('radio', { name: 'Con cuenta' })).toHaveAttribute('aria-checked', 'true')
      expect(screen.getByLabelText('Usuario vinculado')).toBeDefined()

      fireEvent.click(screen.getByRole('radio', { name: 'Sin cuenta' }))
      expect(screen.getByLabelText('Nombre')).toBeDefined()
      expect(screen.getByLabelText(/Email/)).toBeDefined()
      expect(screen.queryByLabelText('Usuario vinculado')).toBeNull()
    })

    it('creates a professional with a name and an invitation email', async () => {
      mockListAdminStaffMembers.mockResolvedValue([])
      mockCreateWithoutAccount.mockResolvedValue(noAccount)
      renderAdminStaffPage()
      await openGuestForm()

      fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Laura Sosa' } })
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'laura@mail.com' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

      await waitFor(() => expect(mockCreateWithoutAccount).toHaveBeenCalledWith('Laura Sosa', 'laura@mail.com'))
      expect(await screen.findByText(/Cuando laura@mail.com entre a la app, queda vinculado/)).toBeDefined()
      expect(screen.getByText('Sin cuenta')).toBeDefined()
      expect(screen.getByText('Invitación: laura@mail.com')).toBeDefined()
    })

    it('a name alone is enough (edge case)', async () => {
      mockListAdminStaffMembers.mockResolvedValue([])
      mockCreateWithoutAccount.mockResolvedValue({ ...noAccount, inviteEmail: null })
      renderAdminStaffPage()
      await openGuestForm()
      fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Laura Sosa' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
      await waitFor(() => expect(mockCreateWithoutAccount).toHaveBeenCalledWith('Laura Sosa', ''))
      expect(await screen.findByText('Profesional creado sin cuenta.')).toBeDefined()
    })

    it('needs a name of at least 2 letters (edge case)', async () => {
      mockListAdminStaffMembers.mockResolvedValue([])
      renderAdminStaffPage()
      await openGuestForm()
      fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'L' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
      expect(await screen.findByText('El nombre debe tener al menos 2 caracteres.')).toBeDefined()
      expect(mockCreateWithoutAccount).not.toHaveBeenCalled()
    })

    it('says so when the email already had an account and the link was immediate (edge case)', async () => {
      mockListAdminStaffMembers.mockResolvedValue([])
      mockCreateWithoutAccount.mockResolvedValue({ ...mockStaffMember, profileUserId: 'u-5', inviteEmail: null })
      renderAdminStaffPage()
      await openGuestForm()
      fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Laura Sosa' } })
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'ya@existe.com' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
      expect(await screen.findByText('Ese email ya tenía cuenta: el profesional quedó vinculado.')).toBeDefined()
    })

    it('shows the database error and keeps the form open (edge case)', async () => {
      mockListAdminStaffMembers.mockResolvedValue([])
      mockCreateWithoutAccount.mockRejectedValue(new Error('Ya hay un profesional sin cuenta con ese email.'))
      renderAdminStaffPage()
      await openGuestForm()
      fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Laura Sosa' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
      expect(await screen.findByText('Ya hay un profesional sin cuenta con ese email.')).toBeDefined()
      expect(screen.getByLabelText('Nombre')).toBeDefined()
    })

    it('a card without account offers linking and renaming, not "Editar roles"', async () => {
      mockListAdminStaffMembers.mockResolvedValue([noAccount])
      renderAdminStaffPage()
      await screen.findByText('Laura Sosa')
      expect(screen.getByRole('button', { name: 'Vincular cuenta' })).toBeDefined()
      expect(screen.getByRole('button', { name: 'Cambiar nombre' })).toBeDefined()
      expect(screen.queryByRole('button', { name: 'Editar roles' })).toBeNull()
    })

    it('a card with account has neither "Vincular cuenta" nor "Cambiar nombre" (edge case)', async () => {
      mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
      renderAdminStaffPage()
      await screen.findByText('Bruno')
      expect(screen.queryByRole('button', { name: 'Vincular cuenta' })).toBeNull()
      expect(screen.queryByRole('button', { name: 'Cambiar nombre' })).toBeNull()
    })

    it('links a professional to an account and takes the account name', async () => {
      mockListAdminStaffMembers.mockResolvedValue([noAccount])
      mockLinkStaff.mockResolvedValue({ ...noAccount, profileUserId: 'u-1', displayName: 'Ana García', fullName: 'Ana García', inviteEmail: null })
      renderAdminStaffPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Vincular cuenta' }))

      expect(await screen.findByRole('heading', { name: 'Vincular una cuenta a Laura Sosa' })).toBeDefined()
      fireEvent.change(screen.getByLabelText('Usuario vinculado'), { target: { value: 'u-1' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

      await waitFor(() => expect(mockLinkStaff).toHaveBeenCalledWith('sm-9', 'u-1'))
      expect(await screen.findByText(/Cuenta vinculada/)).toBeDefined()
      expect(screen.getByText('Ana García')).toBeDefined()
      expect(screen.queryByText('Sin cuenta')).toBeNull()
    })

    it('does not link without choosing an account (edge case)', async () => {
      mockListAdminStaffMembers.mockResolvedValue([noAccount])
      renderAdminStaffPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Vincular cuenta' }))
      fireEvent.click(await screen.findByRole('button', { name: 'Guardar' }))
      expect(await screen.findByText('Seleccioná un usuario para vincular al profesional.')).toBeDefined()
      expect(mockLinkStaff).not.toHaveBeenCalled()
    })

    it('renames a professional without account', async () => {
      mockListAdminStaffMembers.mockResolvedValue([noAccount])
      mockRenameStaff.mockResolvedValue(undefined)
      renderAdminStaffPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Cambiar nombre' }))

      const input = (await screen.findByLabelText('Nombre')) as HTMLInputElement
      expect(input.value).toBe('Laura Sosa')
      fireEvent.change(input, { target: { value: 'Laura S.' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

      await waitFor(() => expect(mockRenameStaff).toHaveBeenCalledWith('sm-9', 'Laura S.'))
      expect(await screen.findByText('Nombre actualizado.')).toBeDefined()
      expect(screen.getByText('Laura S.')).toBeDefined()
    })
  })
})
