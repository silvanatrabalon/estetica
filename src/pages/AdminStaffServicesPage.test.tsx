import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminStaffServicesPage } from './AdminStaffServicesPage'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'

const mockListStaffServices = vi.fn()
const mockListAssignableServices = vi.fn()
const mockAssignServiceToStaff = vi.fn()
const mockUnassignServiceFromStaff = vi.fn()

vi.mock('../services/adminStaffServices', () => ({
  listStaffServices: (...args: unknown[]) => mockListStaffServices(...args),
  listAssignableServices: (...args: unknown[]) => mockListAssignableServices(...args),
  assignServiceToStaff: (...args: unknown[]) => mockAssignServiceToStaff(...args),
  unassignServiceFromStaff: (...args: unknown[]) => mockUnassignServiceFromStaff(...args),
}))

function renderPage(staffId = 'staff-123') {
  return render(
    <MemoryRouter initialEntries={[`/admin/staff/${staffId}/services`]}>
      <Routes>
        <Route
          path="/admin/staff/:staffId/services"
          element={
            <TestUserProvider
              user={mockSessions.authenticatedAdmin.user}
              roles={['admin']}
              activeRole="admin"
              isLoading={false}
            >
              <AdminStaffServicesPage />
            </TestUserProvider>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

const mockAssignedService = {
  serviceId: 'svc-1',
  name: 'Corte de cabello',
  durationMinutes: 60,
  priceCents: 500000,
  imageUrl: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const mockAssignableService = {
  serviceId: 'svc-2',
  name: 'Manicura',
  durationMinutes: 45,
  priceCents: 300000,
  imageUrl: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('AdminStaffServicesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    mockListStaffServices.mockReturnValue(new Promise(() => {}))
    mockListAssignableServices.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText('Cargando servicios...')).toBeDefined()
  })

  it('shows empty assignments message when no services are assigned', async () => {
    mockListStaffServices.mockResolvedValue([])
    mockListAssignableServices.mockResolvedValue([mockAssignableService])
    renderPage()
    await waitFor(() => {
      expect(
        screen.getByText('Este profesional no tiene servicios asignados todavía.'),
      ).toBeDefined()
    })
  })

  it('shows empty assignable message when all services are already assigned', async () => {
    mockListStaffServices.mockResolvedValue([mockAssignedService])
    mockListAssignableServices.mockResolvedValue([])
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Todos los servicios activos ya están asignados.')).toBeDefined()
    })
  })

  it('renders assigned services list with service name and Quitar button', async () => {
    mockListStaffServices.mockResolvedValue([mockAssignedService])
    mockListAssignableServices.mockResolvedValue([])
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Corte de cabello')).toBeDefined()
      expect(screen.getByText('Quitar')).toBeDefined()
    })
  })

  it('clicking Asignar calls assignServiceToStaff with correct params and shows success', async () => {
    mockListStaffServices.mockResolvedValue([])
    mockListAssignableServices.mockResolvedValue([mockAssignableService])
    mockAssignServiceToStaff.mockResolvedValue(undefined)
    // After assign, refresh: assigned list now has the service, assignable is empty
    mockListStaffServices.mockResolvedValueOnce([]).mockResolvedValue([mockAssignedService])
    mockListAssignableServices.mockResolvedValueOnce([mockAssignableService]).mockResolvedValue([])

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Asignar')).toBeDefined()
    })

    fireEvent.click(screen.getByText('Asignar'))

    await waitFor(() => {
      expect(mockAssignServiceToStaff).toHaveBeenCalledWith('staff-123', 'svc-2')
    })

    await waitFor(() => {
      expect(screen.getByText('Servicio asignado correctamente.')).toBeDefined()
    })
  })

  it('clicking Quitar calls unassignServiceFromStaff with correct params and removes the row', async () => {
    mockListStaffServices.mockResolvedValueOnce([mockAssignedService]).mockResolvedValue([])
    mockListAssignableServices.mockResolvedValueOnce([]).mockResolvedValue([mockAssignedService])
    mockUnassignServiceFromStaff.mockResolvedValue(undefined)

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Quitar')).toBeDefined()
    })

    fireEvent.click(screen.getByText('Quitar'))

    await waitFor(() => {
      expect(mockUnassignServiceFromStaff).toHaveBeenCalledWith('staff-123', 'svc-1')
    })

    await waitFor(() => {
      expect(screen.getByText('Servicio quitado correctamente.')).toBeDefined()
    })
  })

  it('shows Spanish error message when load fails', async () => {
    mockListStaffServices.mockRejectedValue(new Error('connection error'))
    mockListAssignableServices.mockResolvedValue([])
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('No pudimos cargar los servicios en este momento.')).toBeDefined()
    })
  })
})
