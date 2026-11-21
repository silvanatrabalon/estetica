import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AdminStaffPage } from './AdminStaffPage'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'

const mockListAdminStaffMembers = vi.fn()
const mockAdminCreateStaffMember = vi.fn()
const mockAdminUpdateStaffMember = vi.fn()
const mockAdminSetStaffActive = vi.fn()
const mockListPermissions = vi.fn()
const mockSetPermission = vi.fn()

vi.mock('../services/adminStaff', () => ({
  listAdminStaffMembers: (...args: unknown[]) => mockListAdminStaffMembers(...args),
  adminCreateStaffMember: (...args: unknown[]) => mockAdminCreateStaffMember(...args),
  adminUpdateStaffMember: (...args: unknown[]) => mockAdminUpdateStaffMember(...args),
  adminSetStaffActive: (...args: unknown[]) => mockAdminSetStaffActive(...args),
  listStaffAvailabilityPermissions: (...args: unknown[]) => mockListPermissions(...args),
  adminSetStaffAvailabilityPermission: (...args: unknown[]) => mockSetPermission(...args),
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
    mockListPermissions.mockResolvedValue({})
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

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))

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
  describe('Availability permission toggle', () => {
    const label = 'Puede editar su propia disponibilidad: Bruno'

    it('shows the toggle reflecting the stored permission', async () => {
      mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
      mockListPermissions.mockResolvedValue({ 'sm-1': false })
      renderAdminStaffPage()

      const checkbox = (await screen.findByLabelText(label)) as HTMLInputElement
      expect(checkbox.checked).toBe(false)
    })

    it('is checked when the professional is allowed', async () => {
      mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
      mockListPermissions.mockResolvedValue({ 'sm-1': true })
      renderAdminStaffPage()

      expect(((await screen.findByLabelText(label)) as HTMLInputElement).checked).toBe(true)
    })

    it('saves the change and confirms it', async () => {
      mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
      mockListPermissions.mockResolvedValue({ 'sm-1': true })
      mockSetPermission.mockResolvedValue(undefined)
      renderAdminStaffPage()

      fireEvent.click(await screen.findByLabelText(label))

      await waitFor(() => expect(mockSetPermission).toHaveBeenCalledWith('sm-1', false))
      expect(await screen.findByText('Bruno ya no puede editar su disponibilidad.')).toBeDefined()
      expect((screen.getByLabelText(label) as HTMLInputElement).checked).toBe(false)
    })

    it('reverts and shows an error when saving fails (edge case)', async () => {
      mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
      mockListPermissions.mockResolvedValue({ 'sm-1': true })
      mockSetPermission.mockRejectedValue(new Error('boom'))
      renderAdminStaffPage()

      fireEvent.click(await screen.findByLabelText(label))

      expect(await screen.findByText('No pudimos cambiar el permiso. Intentá de nuevo.')).toBeDefined()
      expect((screen.getByLabelText(label) as HTMLInputElement).checked).toBe(true)
    })

    it('hides the toggle when permissions cannot be loaded, without breaking the page (edge case)', async () => {
      mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
      mockListPermissions.mockRejectedValue(new Error('down'))
      renderAdminStaffPage()

      expect(await screen.findByText('Bruno')).toBeDefined()
      expect(screen.queryByLabelText(label)).toBeNull()
    })

    it('hides the toggle for a professional without a known permission (edge case)', async () => {
      mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
      mockListPermissions.mockResolvedValue({ 'other-id': true })
      renderAdminStaffPage()

      expect(await screen.findByText('Bruno')).toBeDefined()
      expect(screen.queryByLabelText(label)).toBeNull()
    })
  })
  describe('Edit button', () => {
    it('opens the edit form with the professional name and scrolls it into view', async () => {
      const scrollIntoView = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoView
      mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
      renderAdminStaffPage()

      fireEvent.click(await screen.findByRole('button', { name: 'Editar' }))

      expect(await screen.findByRole('heading', { name: 'Editar profesional' })).toBeDefined()
      expect((screen.getByLabelText(/Nombre para mostrar/i) as HTMLInputElement).value).toBe('Bruno')
      await waitFor(() => expect(scrollIntoView).toHaveBeenCalled())
    })

    it('does not crash when scrollIntoView is unavailable (edge case)', async () => {
      // @ts-expect-error simulate an environment without scrollIntoView
      Element.prototype.scrollIntoView = undefined
      mockListAdminStaffMembers.mockResolvedValue([mockStaffMember])
      renderAdminStaffPage()

      fireEvent.click(await screen.findByRole('button', { name: 'Editar' }))

      expect(await screen.findByRole('heading', { name: 'Editar profesional' })).toBeDefined()
    })

    it('can switch to editing another professional while the form is open (edge case)', async () => {
      const second = { ...mockStaffMember, id: 'sm-2', displayName: 'Carla', profileUserId: 'u-3' }
      mockListAdminStaffMembers.mockResolvedValue([mockStaffMember, second])
      renderAdminStaffPage()

      const buttons = await screen.findAllByRole('button', { name: 'Editar' })
      fireEvent.click(buttons[0])
      await screen.findByRole('heading', { name: 'Editar profesional' })
      fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[1])

      await waitFor(() =>
        expect((screen.getByLabelText(/Nombre para mostrar/i) as HTMLInputElement).value).toBe('Carla'),
      )
    })
  })
})
