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
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockListAdminUsers.mockResolvedValue(mockUsers)
  })

  it('shows loading state initially', () => {
    mockListAdminStaffMembers.mockReturnValue(new Promise(() => {}))
    renderAdminStaffPage()
    expect(screen.getByText('Cargando profesionales...')).toBeDefined()
  })

  it('shows empty state when no staff members exist', async () => {
    mockListAdminStaffMembers.mockResolvedValue([])
    renderAdminStaffPage()
    await waitFor(() => {
      expect(screen.getByText('No hay profesionales registrados todavía.')).toBeDefined()
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
      expect(screen.getByText('Agregar profesional')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Agregar profesional' }))

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
      expect(screen.getByText('Agregar profesional')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Agregar profesional' }))

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
      expect(screen.getByText('Agregar profesional')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Agregar profesional' }))

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
      expect(mockAdminSetStaffActive).toHaveBeenCalledWith('sm-1', true)
    })
  })
})
