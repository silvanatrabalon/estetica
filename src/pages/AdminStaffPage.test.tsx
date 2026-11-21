import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminStaffPage } from './AdminStaffPage'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'

const mockListAdminStaffMembers = vi.fn()
const mockAdminCreateStaffMember = vi.fn()
const mockAdminUpdateStaffMember = vi.fn()
const mockAdminSetStaffActive = vi.fn()

vi.mock('../services/adminStaff', () => ({
  listAdminStaffMembers: (...args: unknown[]) => mockListAdminStaffMembers(...args),
  adminCreateStaffMember: (...args: unknown[]) => mockAdminCreateStaffMember(...args),
  adminUpdateStaffMember: (...args: unknown[]) => mockAdminUpdateStaffMember(...args),
  adminSetStaffActive: (...args: unknown[]) => mockAdminSetStaffActive(...args),
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

  it('shows validation error on create form for empty display name', async () => {
    mockListAdminStaffMembers.mockResolvedValue([])
    renderAdminStaffPage()

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Agregar profesional/ }).length).toBeGreaterThan(0)
    })

    fireEvent.click(screen.getAllByRole('button', { name: /Agregar profesional/ })[0])

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre para mostrar')).toBeDefined()
    })

    fireEvent.change(screen.getByLabelText('Nombre para mostrar'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(screen.getByText('El nombre debe tener al menos 2 caracteres.')).toBeDefined()
    })
  })

  it('shows validation error on create form for too-short display name', async () => {
    mockListAdminStaffMembers.mockResolvedValue([])
    renderAdminStaffPage()

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Agregar profesional/ }).length).toBeGreaterThan(0)
    })

    fireEvent.click(screen.getAllByRole('button', { name: /Agregar profesional/ })[0])

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre para mostrar')).toBeDefined()
    })

    fireEvent.change(screen.getByLabelText('Nombre para mostrar'), { target: { value: 'A' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(screen.getByText('El nombre debe tener al menos 2 caracteres.')).toBeDefined()
    })
  })

  it('shows validation error on edit form for too-short display name', async () => {
    mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
    renderAdminStaffPage()

    await waitFor(() => {
      expect(screen.getByText('Bruno')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar nombre' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre para mostrar')).toBeDefined()
    })

    fireEvent.change(screen.getByLabelText('Nombre para mostrar'), { target: { value: 'X' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(screen.getByText('El nombre debe tener al menos 2 caracteres.')).toBeDefined()
    })
  })

  it('calls adminCreateStaffMember with correct arguments', async () => {
    mockListAdminStaffMembers.mockResolvedValue([])
    mockAdminCreateStaffMember.mockResolvedValue({
      ...mockStaffMember,
      profileUserId: 'u-1',
      displayName: 'Ana Staff',
      fullName: 'Ana García',
    })
    renderAdminStaffPage()

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Agregar profesional/ }).length).toBeGreaterThan(0)
    })

    fireEvent.click(screen.getAllByRole('button', { name: /Agregar profesional/ })[0])

    await waitFor(() => {
      expect(screen.getByLabelText('Usuario vinculado')).toBeDefined()
    })

    fireEvent.change(screen.getByLabelText('Usuario vinculado'), { target: { value: 'u-1' } })
    fireEvent.change(screen.getByLabelText('Nombre para mostrar'), { target: { value: 'Ana Staff' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(mockAdminCreateStaffMember).toHaveBeenCalledWith('u-1', 'Ana Staff')
    })
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
  describe('Edit button', () => {
    it('opens the edit form with the professional name and scrolls it into view', async () => {
      const scrollIntoView = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoView
      mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
      renderAdminStaffPage()

      fireEvent.click(await screen.findByRole('button', { name: 'Cambiar nombre' }))

      expect(await screen.findByRole('heading', { name: 'Editar profesional' })).toBeDefined()
      expect((screen.getByLabelText(/Nombre para mostrar/i) as HTMLInputElement).value).toBe('Bruno')
      await waitFor(() => expect(scrollIntoView).toHaveBeenCalled())
    })

    it('does not crash when scrollIntoView is unavailable (edge case)', async () => {
      // @ts-expect-error simulate an environment without scrollIntoView
      Element.prototype.scrollIntoView = undefined
      mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
      renderAdminStaffPage()

      fireEvent.click(await screen.findByRole('button', { name: 'Cambiar nombre' }))

      expect(await screen.findByRole('heading', { name: 'Editar profesional' })).toBeDefined()
    })

    it('can switch to editing another professional while the form is open (edge case)', async () => {
      const second = { ...mockStaffMember, id: 'sm-2', displayName: 'Carla', profileUserId: 'u-3' }
      mockListAdminStaffMembers.mockResolvedValue([mockStaffMember, second])
      renderAdminStaffPage()

      const buttons = await screen.findAllByRole('button', { name: 'Cambiar nombre' })
      fireEvent.click(buttons[0])
      await screen.findByRole('heading', { name: 'Editar profesional' })
      fireEvent.click(screen.getAllByRole('button', { name: 'Cambiar nombre' })[1])

      await waitFor(() =>
        expect((screen.getByLabelText(/Nombre para mostrar/i) as HTMLInputElement).value).toBe('Carla'),
      )
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

    it('the card has Cambiar nombre and Editar roles instead of an ambiguous Editar', async () => {
      mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
      renderAdminStaffPage()

      expect(await screen.findByRole('button', { name: 'Cambiar nombre' })).toBeDefined()
      expect(screen.getByRole('button', { name: 'Editar roles' })).toBeDefined()
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

      expect(await screen.findByRole('button', { name: 'Cambiar nombre' })).toBeDefined()
      expect(screen.queryByRole('button', { name: 'Editar roles' })).toBeNull()
    })

    it('the edit form only changes the name, with no role hint (edge case)', async () => {
      mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
      renderAdminStaffPage()

      fireEvent.click(await screen.findByRole('button', { name: 'Cambiar nombre' }))

      expect(await screen.findByRole('heading', { name: 'Editar profesional' })).toBeDefined()
      expect(screen.queryByText(/Para cambiar el rol de esta persona/)).toBeNull()
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

    it('falls back when the professional has no linked user (edge case)', async () => {
      mockListAdminUsers.mockResolvedValue(mockUsers)
      mockListAdminStaffMembers.mockResolvedValue([{ ...mockStaffMember, profileUserId: null, role: 'customer' }])
      renderAdminStaffPage()

      await screen.findByText('Bruno')
      const card = screen.getByText('Bruno').closest('div.shell-surface') as HTMLElement
      expect(Array.from(card.querySelectorAll('span')).some((el) => el.textContent === 'Cliente')).toBe(true)
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
      for (const name of ['Disponibilidad', 'Servicios', 'Cambiar nombre', 'Editar roles', 'Desactivar']) {
        expect(screen.getByRole('button', { name })).toBeInTheDocument()
      }
    })

    it('fills the display name with the selected account name', async () => {
      mockListAdminStaffMembers.mockResolvedValue([])
      renderAdminStaffPage()
      fireEvent.click((await screen.findAllByRole('button', { name: /Agregar profesional/ }))[0])
      fireEvent.change(await screen.findByLabelText(/Usuario vinculado/), { target: { value: 'u-1' } })
      expect((screen.getByLabelText('Nombre para mostrar') as HTMLInputElement).value).toBe('Ana García')
    })

    it('does not overwrite a name the admin already typed (edge case)', async () => {
      mockListAdminStaffMembers.mockResolvedValue([])
      renderAdminStaffPage()
      fireEvent.click((await screen.findAllByRole('button', { name: /Agregar profesional/ }))[0])
      fireEvent.change(screen.getByLabelText('Nombre para mostrar'), { target: { value: 'Anita' } })
      fireEvent.change(await screen.findByLabelText(/Usuario vinculado/), { target: { value: 'u-1' } })
      expect((screen.getByLabelText('Nombre para mostrar') as HTMLInputElement).value).toBe('Anita')
    })

    it('an account without a name leaves the field empty (edge case)', async () => {
      mockListAdminUsers.mockResolvedValue([{ ...mockUsers[0], name: '' }])
      mockListAdminStaffMembers.mockResolvedValue([])
      renderAdminStaffPage()
      fireEvent.click((await screen.findAllByRole('button', { name: /Agregar profesional/ }))[0])
      fireEvent.change(await screen.findByLabelText(/Usuario vinculado/), { target: { value: 'u-1' } })
      expect((screen.getByLabelText('Nombre para mostrar') as HTMLInputElement).value).toBe('')
    })
  })
})
