import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ServiceAvailabilityModal } from './ServiceAvailabilityModal'

const mockListServiceAvailableDates = vi.fn()
const mockAddServiceAvailableDate = vi.fn()
const mockRemoveServiceAvailableDate = vi.fn()

vi.mock('../../services/adminServiceAvailability', () => ({
  listServiceAvailableDates: (...args: unknown[]) => mockListServiceAvailableDates(...args),
  addServiceAvailableDate: (...args: unknown[]) => mockAddServiceAvailableDate(...args),
  removeServiceAvailableDate: (...args: unknown[]) => mockRemoveServiceAvailableDate(...args),
}))

const onClose = vi.fn()

function renderPage(serviceId = 'svc-1', serviceName = 'Depilación láser') {
  return render(<ServiceAvailabilityModal serviceId={serviceId} serviceName={serviceName} onClose={onClose} />)
}

const mockDate = {
  serviceId: 'svc-1',
  availableDate: '2026-06-15',
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('ServiceAvailabilityModal', () => {
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

describe('ServiceAvailabilityModal — pop-up', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListServiceAvailableDates.mockResolvedValue([])
  })

  it('is a pop-up (sheet on phones, centered on larger screens) with the service name', async () => {
    renderPage()
    const dialog = screen.getByRole('dialog', { name: 'Disponibilidad del servicio' })
    expect(dialog.parentElement?.className).toContain('fixed inset-0')
    expect(dialog.parentElement?.className).toContain('items-end')
    expect(dialog.parentElement?.className).toContain('sm:items-center')
    expect(dialog.className).toContain('max-h-[92dvh]')
    expect(screen.getByText('Depilación láser')).toBeInTheDocument()
    await screen.findByText('Disponible cualquier día')
  })

  it('the explanation ends with an example: jornadas de depilación', async () => {
    renderPage()
    expect(await screen.findByText(/Cargá fechas si solo se ofrece algunos días\. Ej: jornadas de depilación\./)).toBeInTheDocument()
  })

  it('closes with the × button and with Escape (edge case)', async () => {
    renderPage()
    await screen.findByText('Disponible cualquier día')
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('works without a service name (edge case)', async () => {
    render(<ServiceAvailabilityModal serviceId="svc-1" onClose={onClose} />)
    expect(screen.getByRole('dialog', { name: 'Disponibilidad del servicio' })).toBeInTheDocument()
    await screen.findByText('Disponible cualquier día')
  })

  it('the range mode adds every date and asks for both ends (edge case)', async () => {
    mockAddServiceAvailableDate.mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('Disponible cualquier día')
    fireEvent.click(screen.getByRole('button', { name: 'Rango de fechas' }))
    expect(screen.getByRole('button', { name: 'Agregar rango' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Fecha inicio'), { target: { value: '2026-06-15' } })
    fireEvent.change(screen.getByLabelText('Fecha fin'), { target: { value: '2026-06-17' } })
    fireEvent.click(screen.getByRole('button', { name: 'Agregar rango' }))
    await waitFor(() => expect(mockAddServiceAvailableDate).toHaveBeenCalledTimes(3))
  })
})
