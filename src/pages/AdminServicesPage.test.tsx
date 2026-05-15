import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AdminServicesPage } from './AdminServicesPage'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'

const mockListServices = vi.fn()
const mockCreateService = vi.fn()
const mockUpdateService = vi.fn()
const mockSetServiceActive = vi.fn()

vi.mock('../services/adminServices', () => ({
  listServices: (...args: unknown[]) => mockListServices(...args),
  createService: (...args: unknown[]) => mockCreateService(...args),
  updateService: (...args: unknown[]) => mockUpdateService(...args),
  setServiceActive: (...args: unknown[]) => mockSetServiceActive(...args),
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <TestUserProvider
        user={mockSessions.authenticatedAdmin.user}
        roles={['admin']}
        activeRole="admin"
        isLoading={false}
      >
        <AdminServicesPage />
      </TestUserProvider>
    </MemoryRouter>,
  )
}

const mockService = {
  id: 'svc-1',
  organizationId: 'org-1',
  name: 'Corte de cabello',
  durationMinutes: 60,
  priceCents: 500000,
  imageUrl: null,
  isActive: true,
  maxConcurrentBookings: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('AdminServicesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('shows loading state initially', () => {
    mockListServices.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText('Cargando servicios...')).toBeDefined()
  })

  it('shows empty state when no services exist', async () => {
    mockListServices.mockResolvedValue([])
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('No hay servicios registrados todavía.')).toBeDefined()
    })
  })

  it('renders service list with data', async () => {
    mockListServices.mockResolvedValue([mockService])
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Corte de cabello')).toBeDefined()
      expect(screen.getByText('60 min')).toBeDefined()
      expect(screen.getByText('Activo')).toBeDefined()
    })
  })

  it('shows validation error for empty service name', async () => {
    mockListServices.mockResolvedValue([])
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Agregar servicio')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Agregar servicio' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre')).toBeDefined()
    })

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Duración (minutos)'), { target: { value: '60' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(screen.getByText('El nombre debe tener al menos 2 caracteres.')).toBeDefined()
    })
  })

  it('shows validation error for duration out of range', async () => {
    mockListServices.mockResolvedValue([])
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Agregar servicio')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Agregar servicio' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre')).toBeDefined()
    })

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Corte' } })
    fireEvent.change(screen.getByLabelText('Duración (minutos)'), { target: { value: '999' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(
        screen.getByText('La duración debe ser un número entero entre 1 y 480 minutos.'),
      ).toBeDefined()
    })
  })

  it('shows validation error for invalid image URL', async () => {
    mockListServices.mockResolvedValue([])
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Agregar servicio')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Agregar servicio' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre')).toBeDefined()
    })

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Corte' } })
    fireEvent.change(screen.getByLabelText('Duración (minutos)'), { target: { value: '60' } })
    fireEvent.change(screen.getByLabelText(/URL de imagen/), {
      target: { value: 'not-a-url' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(
        screen.getByText('La URL de imagen no tiene un formato válido.'),
      ).toBeDefined()
    })
  })

  it('calls createService and shows success message', async () => {
    mockListServices.mockResolvedValue([])
    mockCreateService.mockResolvedValue(mockService)
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Agregar servicio')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Agregar servicio' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre')).toBeDefined()
    })

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Corte de cabello' } })
    fireEvent.change(screen.getByLabelText('Duración (minutos)'), { target: { value: '60' } })
    fireEvent.change(screen.getByLabelText('Precio (centavos)'), { target: { value: '500000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(mockCreateService).toHaveBeenCalledWith({
        name: 'Corte de cabello',
        durationMinutes: 60,
        priceCents: 500000,
        imageUrl: null,
        maxConcurrentBookings: null,
      })
      expect(screen.getByText('Servicio creado correctamente.')).toBeDefined()
    })
  })

  it('calls updateService when editing an existing service', async () => {
    mockListServices.mockResolvedValue([mockService])
    mockUpdateService.mockResolvedValue({ ...mockService, name: 'Corte actualizado' })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Corte de cabello')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre')).toBeDefined()
    })

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Corte actualizado' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(mockUpdateService).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceId: 'svc-1',
          name: 'Corte actualizado',
        }),
      )
      expect(screen.getByText('Servicio actualizado correctamente.')).toBeDefined()
    })
  })

  it('calls setServiceActive with false to deactivate', async () => {
    mockListServices.mockResolvedValue([mockService])
    mockSetServiceActive.mockResolvedValue(undefined)
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Corte de cabello')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Desactivar' }))

    await waitFor(() => {
      expect(mockSetServiceActive).toHaveBeenCalledWith('svc-1', false)
      expect(screen.getByText('"Corte de cabello" fue desactivado.')).toBeDefined()
    })
  })

  it('calls setServiceActive with true to reactivate', async () => {
    const inactiveService = { ...mockService, isActive: false }
    mockListServices.mockResolvedValue([inactiveService])
    mockSetServiceActive.mockResolvedValue(undefined)
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Inactivo')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Reactivar' }))

    await waitFor(() => {
      expect(mockSetServiceActive).toHaveBeenCalledWith('svc-1', true)
      expect(screen.getByText('"Corte de cabello" fue reactivado.')).toBeDefined()
    })
  })

  it('shows error message when load fails', async () => {
    mockListServices.mockRejectedValue(new Error('Network error'))
    renderPage()

    await waitFor(() => {
      expect(
        screen.getByText('No pudimos cargar el catálogo de servicios en este momento.'),
      ).toBeDefined()
    })
  })

  it('capacity field renders in service create form', async () => {
    mockListServices.mockResolvedValue([])
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Agregar servicio')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Agregar servicio' }))

    await waitFor(() => {
      expect(screen.getByLabelText(/Capacidad simult/)).toBeDefined()
    })
  })

  it('shows validation error when capacity is 0', async () => {
    mockListServices.mockResolvedValue([])
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Agregar servicio')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Agregar servicio' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre')).toBeDefined()
    })

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Corte' } })
    fireEvent.change(screen.getByLabelText('Duración (minutos)'), { target: { value: '60' } })
    fireEvent.change(screen.getByLabelText(/Capacidad simult/), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(
        screen.getByText('La capacidad debe ser un número entero mayor a cero.'),
      ).toBeDefined()
    })
  })

  it('submitting with blank capacity passes null to createService', async () => {
    mockListServices.mockResolvedValue([])
    mockCreateService.mockResolvedValue({ ...mockService, maxConcurrentBookings: null })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Agregar servicio')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Agregar servicio' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre')).toBeDefined()
    })

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Corte de cabello' } })
    fireEvent.change(screen.getByLabelText('Duración (minutos)'), { target: { value: '60' } })
    fireEvent.change(screen.getByLabelText('Precio (centavos)'), { target: { value: '500000' } })
    // leave capacity blank
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(mockCreateService).toHaveBeenCalledWith(
        expect.objectContaining({ maxConcurrentBookings: null }),
      )
    })
  })

  it('renders Gestionar disponibilidad button per service row', async () => {
    mockListServices.mockResolvedValue([mockService])
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Corte de cabello')).toBeDefined()
    })

    expect(screen.getByRole('button', { name: 'Gestionar disponibilidad' })).toBeDefined()
  })
})
