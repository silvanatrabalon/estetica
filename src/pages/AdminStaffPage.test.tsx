import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminStaffPage } from './AdminStaffPage'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'

const mockListAdminStaffMembers = vi.fn()
const mockAdminCreateStaffMember = vi.fn()
const mockAdminSetStaffActive = vi.fn()

vi.mock('../services/adminStaff', () => ({
  listAdminStaffMembers: (...args: unknown[]) => mockListAdminStaffMembers(...args),
  adminCreateStaffMember: (...args: unknown[]) => mockAdminCreateStaffMember(...args),
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
      for (const name of ['Disponibilidad', 'Servicios', 'Editar roles', 'Desactivar']) {
        expect(screen.getByRole('button', { name })).toBeInTheDocument()
      }
    })
  })
})
