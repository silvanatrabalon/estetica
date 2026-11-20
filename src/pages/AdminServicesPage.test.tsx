import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AdminServicesPage } from './AdminServicesPage'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'

const mockListServices = vi.fn()
const mockCreateService = vi.fn()
const mockUpdateService = vi.fn()
const mockSetServiceActive = vi.fn()
const mockUploadMediaFile = vi.fn()
const mockDeleteMediaFile = vi.fn()

vi.mock('../services/adminServices', () => ({
  listServices: (...args: unknown[]) => mockListServices(...args),
  createService: (...args: unknown[]) => mockCreateService(...args),
  updateService: (...args: unknown[]) => mockUpdateService(...args),
  setServiceActive: (...args: unknown[]) => mockSetServiceActive(...args),
}))

vi.mock('../services/adminLanding', () => ({
  uploadMediaFile: (...args: unknown[]) => mockUploadMediaFile(...args),
  deleteMediaFile: (...args: unknown[]) => mockDeleteMediaFile(...args),
}))

vi.mock('../services/adminCategories', () => ({
  adminListCategories: () => Promise.resolve([]),
  adminCreateCategory: vi.fn(),
  adminUpdateCategory: vi.fn(),
  adminDeleteCategory: vi.fn(),
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

// The page renders both mobile cards and a desktop table (CSS-hidden, so both
// exist in jsdom). Scope row queries to the desktop table to avoid duplicates.
function getTable() {
  return within(screen.getByRole('table'))
}

function setDuration(hours: string, mins: string) {
  fireEvent.change(screen.getByLabelText('Horas'), { target: { value: hours } })
  fireEvent.change(screen.getByLabelText('Minutos'), { target: { value: mins } })
}

async function openCreateForm() {
  fireEvent.click(await screen.findByRole('button', { name: /Agregar servicio/ }))
  await screen.findByLabelText('Nombre')
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
  description: null,
  categoryId: null,
  categoryName: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('AdminServicesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
      expect(getTable().getByText('Corte de cabello')).toBeDefined()
      expect(getTable().getByText('60 min')).toBeDefined()
      expect(getTable().getByText('Activo')).toBeDefined()
    })
  })

  it('shows validation error for empty service name', async () => {
    mockListServices.mockResolvedValue([])
    renderPage()

    await openCreateForm()

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: '' } })
    setDuration('1', '0')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(screen.getByText('El nombre debe tener al menos 2 caracteres.')).toBeDefined()
    })
  })

  it('shows validation error for duration out of range', async () => {
    mockListServices.mockResolvedValue([])
    renderPage()

    await openCreateForm()

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Corte' } })
    setDuration('8', '1')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(
        screen.getByText('La duración debe ser entre 1 y 480 minutos (hasta 8 horas).'),
      ).toBeDefined()
    })
  })

  it('shows description textarea in create form', async () => {
    mockListServices.mockResolvedValue([])
    renderPage()

    await openCreateForm()

    await waitFor(() => {
      expect(screen.getByLabelText(/Descripción/)).toBeDefined()
    })
  })

  it('calls createService and shows success message', async () => {
    mockListServices.mockResolvedValue([])
    mockCreateService.mockResolvedValue(mockService)
    renderPage()

    await openCreateForm()

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Corte de cabello' } })
    setDuration('1', '0')
    fireEvent.change(screen.getByLabelText('Precio ($)'), { target: { value: '5000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(mockCreateService).toHaveBeenCalledWith({
        name: 'Corte de cabello',
        durationMinutes: 60,
        priceCents: 500000,
        imageUrl: null,
        maxConcurrentBookings: null,
        description: null,
        categoryId: null,
      })
      expect(screen.getByText('Servicio creado correctamente.')).toBeDefined()
    })
  })

  it('calls updateService when editing an existing service', async () => {
    mockListServices.mockResolvedValue([mockService])
    mockUpdateService.mockResolvedValue({ ...mockService, name: 'Corte actualizado' })
    renderPage()

    await waitFor(() => {
      expect(getTable().getByText('Corte de cabello')).toBeDefined()
    })

    fireEvent.click(getTable().getByRole('button', { name: 'Editar' }))

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
      expect(getTable().getByText('Corte de cabello')).toBeDefined()
    })

    fireEvent.click(getTable().getByRole('button', { name: 'Desactivar' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDefined()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

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
      expect(getTable().getByText('Inactivo')).toBeDefined()
    })

    fireEvent.click(getTable().getByRole('button', { name: 'Reactivar' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDefined()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

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

    await openCreateForm()

    await waitFor(() => {
      expect(screen.getByLabelText(/Capacidad simult/)).toBeDefined()
    })
  })

  it('shows validation error when capacity is 0', async () => {
    mockListServices.mockResolvedValue([])
    renderPage()

    await openCreateForm()

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Corte' } })
    setDuration('1', '0')
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

    await openCreateForm()

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Corte de cabello' } })
    setDuration('1', '0')
    fireEvent.change(screen.getByLabelText('Precio ($)'), { target: { value: '5000' } })
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
      expect(getTable().getByText('Corte de cabello')).toBeDefined()
    })

    expect(getTable().getByRole('button', { name: 'Gestionar disponibilidad' })).toBeDefined()
  })
})
