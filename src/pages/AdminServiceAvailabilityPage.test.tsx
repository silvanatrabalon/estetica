import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminServiceAvailabilityPage } from './AdminServiceAvailabilityPage'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'

const mockListServiceAvailableDates = vi.fn()
const mockAddServiceAvailableDate = vi.fn()
const mockRemoveServiceAvailableDate = vi.fn()

vi.mock('../services/adminServiceAvailability', () => ({
  listServiceAvailableDates: (...args: unknown[]) => mockListServiceAvailableDates(...args),
  addServiceAvailableDate: (...args: unknown[]) => mockAddServiceAvailableDate(...args),
  removeServiceAvailableDate: (...args: unknown[]) => mockRemoveServiceAvailableDate(...args),
}))

function renderPage(serviceId = 'svc-1') {
  return render(
    <MemoryRouter initialEntries={[`/admin/services/${serviceId}/availability`]}>
      <Routes>
        <Route
          path="/admin/services/:serviceId/availability"
          element={
            <TestUserProvider
              user={mockSessions.authenticatedAdmin.user}
              roles={['admin']}
              activeRole="admin"
              isLoading={false}
            >
              <AdminServiceAvailabilityPage />
            </TestUserProvider>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

const mockDate = {
  serviceId: 'svc-1',
  availableDate: '2026-06-15',
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('AdminServiceAvailabilityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state while fetch resolves', () => {
    mockListServiceAvailableDates.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText('Cargando fechas disponibles...')).toBeDefined()
  })

  it('shows empty state when listServiceAvailableDates returns empty array', async () => {
    mockListServiceAvailableDates.mockResolvedValue([])
    renderPage()
    await waitFor(() => {
      expect(
        screen.getByText('Disponible cualquier día'),
      ).toBeDefined()
    })
  })

  it('renders date list with date and Eliminar button', async () => {
    mockListServiceAvailableDates.mockResolvedValue([mockDate])
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('2026-06-15')).toBeDefined()
      expect(screen.getByRole('button', { name: 'Eliminar' })).toBeDefined()
    })
  })

  it('calls addServiceAvailableDate and shows success message on add', async () => {
    mockListServiceAvailableDates.mockResolvedValue([])
    mockAddServiceAvailableDate.mockResolvedValue(undefined)
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Agregar fecha' })).toBeDefined()
    })

    const dateInput = screen.getByLabelText('Fecha')
    fireEvent.change(dateInput, { target: { value: '2026-06-15' } })
    fireEvent.click(screen.getByRole('button', { name: 'Agregar fecha' }))

    await waitFor(() => {
      expect(mockAddServiceAvailableDate).toHaveBeenCalledWith('svc-1', '2026-06-15')
      expect(screen.getByText('Fecha agregada correctamente.')).toBeDefined()
    })
  })

  it('calls removeServiceAvailableDate and removes the row on Eliminar click', async () => {
    mockListServiceAvailableDates
      .mockResolvedValueOnce([mockDate])
      .mockResolvedValue([])
    mockRemoveServiceAvailableDate.mockResolvedValue(undefined)
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('2026-06-15')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

    await waitFor(() => {
      expect(mockRemoveServiceAvailableDate).toHaveBeenCalledWith('svc-1', '2026-06-15')
      expect(screen.getByText('Fecha eliminada correctamente.')).toBeDefined()
    })
  })

  it('shows Spanish error message when load fails', async () => {
    mockListServiceAvailableDates.mockRejectedValue(new Error('Network error'))
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('No pudimos cargar las fechas disponibles.')).toBeDefined()
    })
  })

  it('shows Spanish error message when add fails', async () => {
    mockListServiceAvailableDates.mockResolvedValue([])
    mockAddServiceAvailableDate.mockRejectedValue(new Error('No autorizado'))
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Agregar fecha' })).toBeDefined()
    })

    const dateInput = screen.getByLabelText('Fecha')
    fireEvent.change(dateInput, { target: { value: '2026-06-20' } })
    fireEvent.click(screen.getByRole('button', { name: 'Agregar fecha' }))

    await waitFor(() => {
      expect(screen.getByText('No pudimos agregar la fecha disponible.')).toBeDefined()
    })
  })

  it('shows Spanish error message when remove fails', async () => {
    mockListServiceAvailableDates.mockResolvedValue([mockDate])
    mockRemoveServiceAvailableDate.mockRejectedValue(new Error('No autorizado'))
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('2026-06-15')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

    await waitFor(() => {
      expect(screen.getByText('No pudimos eliminar la fecha disponible.')).toBeDefined()
    })
  })
})
