import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BookingPage } from './BookingPage'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'
import type { Service } from '../services/adminServices'
import type { AvailableSlot } from '../services/availability'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockGetBusinessSettings = vi.fn()

vi.mock('../services/businessSettings', () => ({
  getBusinessSettings: (...args: unknown[]) => mockGetBusinessSettings(...args),
}))

const mockGetAvailableSlots = vi.fn()

vi.mock('../services/availability', () => ({
  getAvailableSlots: (...args: unknown[]) => mockGetAvailableSlots(...args),
}))

const mockSupabaseFrom = vi.fn()

vi.mock('../lib/supabase', () => ({
  initSupabase: () => ({
    from: mockSupabaseFrom,
  }),
}))

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockCreateAppointment = vi.fn()

vi.mock('../services/appointments', () => ({
  createAppointment: (...args: unknown[]) => mockCreateAppointment(...args),
  isConflictError: (err: unknown) => {
    if (!err || typeof err !== 'object') return false
    const e = err as { code?: string }
    return e.code === '23P01' || e.code === '23505' || e.code === 'CONFLICT'
  },
}))

const mockGetLandingConfig = vi.fn()

vi.mock('../services/landing', () => ({
  getLandingConfig: (...args: unknown[]) => mockGetLandingConfig(...args),
}))

const mockListCategories = vi.fn()

vi.mock('../services/adminCategories', () => ({
  listCategories: (...args: unknown[]) => mockListCategories(...args),
}))

// ── Fixtures ─────────────────────────────────────────────────────────────────

const mockService: Service = {
  id: 'svc-1',
  organizationId: 'org-1',
  name: 'Corte de cabello',
  durationMinutes: 60,
  priceCents: 5000,
  imageUrl: null,
  isActive: true,
  maxConcurrentBookings: null,
  description: null,
  categoryId: null,
  categoryName: null,
  createdAt: '2026-01-01T00:00:00Z',
}

const mockServiceRow = {
  id: mockService.id,
  organization_id: mockService.organizationId,
  name: mockService.name,
  duration_minutes: mockService.durationMinutes,
  price_cents: mockService.priceCents,
  image_url: null,
  is_active: true,
  max_concurrent_bookings: null,
  description: null,
  category_id: null,
  created_at: mockService.createdAt,
}

const mockSlot: AvailableSlot = {
  starts_at: '2025-06-10T14:00:00Z',
  ends_at: '2025-06-10T15:00:00Z',
}

function buildQueryChain(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(result),
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderPage() {
  return render(
    <MemoryRouter>
      <TestUserProvider
        user={mockSessions.authenticatedCustomer.user}
        roles={['customer']}
        activeRole="customer"
        isLoading={false}
      >
        <BookingPage />
      </TestUserProvider>
    </MemoryRouter>,
  )
}

async function selectService(name = 'Corte de cabello') {
  // Card click opens the detail panel; the panel's CTA actually selects the service
  fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }))
  fireEvent.click(screen.getByRole('button', { name: 'Seleccionar este servicio' }))
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BookingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetBusinessSettings.mockResolvedValue({
      timezone: 'UTC',
      bookingMaxHorizonDays: 60,
      weeklyHours: [],
    })
    mockListCategories.mockResolvedValue([])
    mockGetLandingConfig.mockResolvedValue({
      primaryColor: '#f3e8ff',
      businessName: 'Test',
      tagline: null,
      logoUrl: null,
      heroImageUrl: null,
      carouselImages: [],
    })
  })

  describe('Step 1 — Service selector', () => {
    it('shows loading skeleton while services are fetching', () => {
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnValue(new Promise(() => {})),
      })
      renderPage()
      // Loading state shows skeleton cards (animate-pulse divs)
      expect(document.querySelector('.animate-pulse')).toBeTruthy()
    })

    it('shows list of active services after loading', async () => {
      mockSupabaseFrom.mockReturnValueOnce(
        buildQueryChain({ data: [mockServiceRow], error: null }),
      )
      renderPage()
      await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())
    })

    it('shows empty state when no active services', async () => {
      mockSupabaseFrom.mockReturnValueOnce(buildQueryChain({ data: [], error: null }))
      renderPage()
      await waitFor(() =>
        expect(screen.getByText(/No hay servicios disponibles/)).toBeDefined(),
      )
    })

    it('shows Spanish error state on fetch failure', async () => {
      mockSupabaseFrom.mockReturnValueOnce(
        buildQueryChain({ data: null, error: new Error('db error') }),
      )
      renderPage()
      await waitFor(() => expect(screen.getByText(/servicios/)).toBeDefined())
    })

    it('advances to step 2 after selecting a service', async () => {
      mockSupabaseFrom.mockReturnValueOnce(
        buildQueryChain({ data: [mockServiceRow], error: null }),
      )
      renderPage()
      await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())

      await selectService()

      expect(screen.getByText(/Seleccioná una fecha para/)).toBeDefined()
    })
  })

  describe('Step 2 — Date picker', () => {
    async function goToStep2() {
      mockSupabaseFrom.mockReturnValueOnce(
        buildQueryChain({ data: [mockServiceRow], error: null }),
      )
      renderPage()
      await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())
      await selectService()
    }

    it('shows date picker and back button', async () => {
      await goToStep2()
      expect(screen.getByRole('button', { name: 'Volver al paso anterior' })).toBeDefined()
      expect(document.querySelector('input[type="date"]')).not.toBeNull()
    })

    it('shows selected service name', async () => {
      await goToStep2()
      expect(screen.getByText('Corte de cabello', { selector: 'strong' })).toBeDefined()
    })

    it('goes back to step 1 on back button click', async () => {
      await goToStep2()
      fireEvent.click(screen.getByRole('button', { name: 'Volver al paso anterior' }))
      await waitFor(() => expect(screen.getByText(/Elegí el servicio/)).toBeDefined())
    })

    it('advances to step 3 after selecting a date', async () => {
      mockGetAvailableSlots.mockResolvedValueOnce([])
      await goToStep2()

      const input = document.querySelector('input[type="date"]') as HTMLInputElement
      fireEvent.change(input, { target: { value: '2025-06-10' } })

      await waitFor(() =>
        expect(screen.getByText(/Turnos disponibles para/)).toBeDefined(),
      )
    })
  })

  describe('Step 3 — Time-axis slot picker', () => {
    async function goToStep3() {
      mockSupabaseFrom.mockReturnValueOnce(
        buildQueryChain({ data: [mockServiceRow], error: null }),
      )
      renderPage()
      await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())
      await selectService()
      const input = document.querySelector('input[type="date"]') as HTMLInputElement
      fireEvent.change(input, { target: { value: '2025-06-10' } })
    }

    it('renders BookingSlotDayView loading skeleton while slots are fetching', async () => {
      mockGetAvailableSlots.mockImplementationOnce(() => new Promise(() => {}))
      await goToStep3()
      await waitFor(() =>
        expect(screen.getByTestId('booking-slot-loading')).toBeInTheDocument(),
      )
    })

    it('renders slot blocks when slots are available', async () => {
      mockGetAvailableSlots.mockResolvedValueOnce([mockSlot])
      await goToStep3()
      await waitFor(() =>
        expect(screen.getByTestId('slot-block')).toBeInTheDocument(),
      )
    })

    it('shows Spanish empty state when no slots available', async () => {
      mockGetAvailableSlots.mockResolvedValueOnce([])
      await goToStep3()
      await waitFor(() =>
        expect(screen.getByTestId('booking-slot-empty')).toBeInTheDocument(),
      )
    })

    it('shows error message on RPC failure', async () => {
      mockGetAvailableSlots.mockRejectedValueOnce(new Error('RPC error'))
      await goToStep3()
      await waitFor(() =>
        expect(screen.getByText(/No pudimos cargar los horarios disponibles/)).toBeDefined(),
      )
    })

    it('"Siguiente" button is disabled when no slot is selected', async () => {
      mockGetAvailableSlots.mockResolvedValueOnce([mockSlot])
      await goToStep3()
      await waitFor(() =>
        expect(screen.getByTestId('slot-block')).toBeInTheDocument(),
      )
      const siguiente = screen.getByRole('button', { name: 'Siguiente' })
      expect(siguiente).toBeDisabled()
    })

    it('"Siguiente" button is enabled after selecting a slot', async () => {
      mockGetAvailableSlots.mockResolvedValueOnce([mockSlot])
      await goToStep3()
      await waitFor(() =>
        expect(screen.getByTestId('slot-block')).toBeInTheDocument(),
      )
      fireEvent.click(screen.getByTestId('slot-block'))
      const siguiente = screen.getByRole('button', { name: 'Siguiente' })
      expect(siguiente).not.toBeDisabled()
    })

    it('clicking "Siguiente" after selecting a slot advances to step 4', async () => {
      mockGetAvailableSlots.mockResolvedValueOnce([mockSlot])
      await goToStep3()
      await waitFor(() =>
        expect(screen.getByTestId('slot-block')).toBeInTheDocument(),
      )
      fireEvent.click(screen.getByTestId('slot-block'))
      fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
      await waitFor(() =>
        expect(screen.getByText(/Revisá tu reserva/)).toBeDefined(),
      )
    })
  })

  describe('Admin-configured texts', () => {
    const baseSettings = { timezone: 'UTC', bookingMaxHorizonDays: 60, weeklyHours: [] }

    it('shows the admin title and subtitle when configured', async () => {
      mockGetBusinessSettings.mockResolvedValue({
        ...baseSettings,
        bookingHeaderText: 'Reservá tu momento',
        bookingSubtitleText: 'Elegí tu tratamiento favorito',
      })
      mockSupabaseFrom.mockReturnValueOnce(buildQueryChain({ data: [], error: null }))
      renderPage()

      await waitFor(() => expect(screen.getByText('Reservá tu momento')).toBeDefined())
      expect(screen.getByText('Elegí tu tratamiento favorito')).toBeDefined()
      expect(screen.queryByText('Reservar turno')).toBeNull()
    })

    it('keeps the default texts when the admin left them empty (edge case)', async () => {
      mockGetBusinessSettings.mockResolvedValue({
        ...baseSettings,
        bookingHeaderText: null,
        bookingSubtitleText: '   ',
      })
      mockSupabaseFrom.mockReturnValueOnce(buildQueryChain({ data: [], error: null }))
      renderPage()

      await waitFor(() => expect(mockGetBusinessSettings).toHaveBeenCalled())
      expect(screen.getByText('Reservar turno')).toBeDefined()
      expect(screen.getByText('Elegí el servicio que querés reservar.')).toBeDefined()
    })

    it('keeps the default texts when business settings fail to load (edge case)', async () => {
      mockGetBusinessSettings.mockRejectedValue(new Error('down'))
      mockSupabaseFrom.mockReturnValueOnce(buildQueryChain({ data: [], error: null }))
      renderPage()

      await waitFor(() => expect(mockGetBusinessSettings).toHaveBeenCalled())
      expect(screen.getByText('Reservar turno')).toBeDefined()
    })
  })

  describe('Spanish copy', () => {
    it('page heading is in Spanish', async () => {
      mockSupabaseFrom.mockReturnValueOnce(buildQueryChain({ data: [], error: null }))
      renderPage()
      expect(screen.getByText('Reservar turno')).toBeDefined()
    })

    it('step labels are in Spanish', async () => {
      mockSupabaseFrom.mockReturnValueOnce(buildQueryChain({ data: [], error: null }))
      renderPage()
      expect(screen.getByText('Servicio')).toBeDefined()
      expect(screen.getByText('Fecha')).toBeDefined()
      expect(screen.getByText('Horario')).toBeDefined()
      expect(screen.getByText('Confirmar')).toBeDefined()
    })
  })

  describe('Step 4 — Review and confirm', () => {
    async function goToStep4() {
      mockSupabaseFrom.mockReturnValueOnce(
        buildQueryChain({ data: [mockServiceRow], error: null }),
      )
      mockGetAvailableSlots.mockResolvedValueOnce([mockSlot])
      renderPage()

      await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())
      await selectService()

      const input = document.querySelector('input[type="date"]') as HTMLInputElement
      fireEvent.change(input, { target: { value: '2025-06-10' } })

      await waitFor(() =>
        expect(screen.getByTestId('slot-block')).toBeInTheDocument(),
      )

      fireEvent.click(screen.getByTestId('slot-block'))
      fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))

      await waitFor(() => expect(screen.getByText(/Revisá tu reserva/)).toBeDefined())
    }

    it('renders service name on review screen', async () => {
      await goToStep4()
      expect(screen.getByText('Corte de cabello')).toBeDefined()
      expect(screen.getByText('Servicio')).toBeDefined()
    })

    it('renders duration in minutes', async () => {
      await goToStep4()
      expect(screen.getByText(/60 min/)).toBeDefined()
    })

    it('renders price formatted in pesos', async () => {
      await goToStep4()
      // 5000 cents = $50.00
      expect(screen.getByText('$50.00')).toBeDefined()
    })

    it('"Confirmar reserva" calls createAppointment with correct params', async () => {
      mockCreateAppointment.mockResolvedValueOnce({ id: 'appt-new' })
      await goToStep4()

      const confirmBtn = screen.getByText('Confirmar reserva')
      fireEvent.click(confirmBtn)

      await waitFor(() =>
        expect(mockCreateAppointment).toHaveBeenCalledWith({
          serviceId: 'svc-1',
          startsAt: mockSlot.starts_at,
        }),
      )
    })

    it('navigates to /booking/confirmation/:id on success', async () => {
      mockCreateAppointment.mockResolvedValueOnce({ id: 'appt-new' })
      await goToStep4()

      fireEvent.click(screen.getByText('Confirmar reserva'))

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith('/booking/confirmation/appt-new'),
      )
    })

    it('shows inline Spanish error message on booking failure', async () => {
      const err = new Error('El turno seleccionado ya no tiene disponibilidad. Por favor, elegí otro.')
      mockCreateAppointment.mockRejectedValueOnce(err)
      await goToStep4()

      fireEvent.click(screen.getByText('Confirmar reserva'))

      await waitFor(() =>
        expect(screen.getByText(/El turno seleccionado ya no tiene disponibilidad/)).toBeDefined(),
      )
    })

    it('"Elegir otro turno" returns user to step 3 after conflict error', async () => {
      const err = new Error('El horario seleccionado ya no está disponible. Por favor, seleccioná otro turno.')
      Object.assign(err, { code: '23P01' })
      mockCreateAppointment.mockRejectedValueOnce(err)
      await goToStep4()

      fireEvent.click(screen.getByText('Confirmar reserva'))

      await waitFor(() =>
        expect(screen.getByText(/Elegir otro turno/)).toBeDefined(),
      )

      fireEvent.click(screen.getByText('Elegir otro turno'))

      await waitFor(() =>
        expect(screen.getByText(/Turnos disponibles para/)).toBeDefined(),
      )
    })

    it('back button from step 4 returns to step 3', async () => {
      await goToStep4()

      fireEvent.click(screen.getByRole('button', { name: 'Volver al paso anterior' }))

      await waitFor(() =>
        expect(screen.getByText(/Turnos disponibles para/)).toBeDefined(),
      )
    })
  })
  describe('Service cards and detail panel (edge cases)', () => {
    const longDescription = 'x'.repeat(100)

    function loadServices(rows: unknown[]) {
      mockSupabaseFrom.mockReturnValueOnce(buildQueryChain({ data: rows, error: null }))
      renderPage()
    }

    it('clicking a card opens the detail panel without advancing to step 2', async () => {
      loadServices([mockServiceRow])
      await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())

      fireEvent.click(screen.getByRole('button', { name: /Corte de cabello/ }))

      expect(screen.getByRole('dialog', { name: 'Corte de cabello' })).toBeDefined()
      expect(screen.queryByText(/Seleccioná una fecha para/)).toBeNull()
    })

    it('closes the detail panel with the close button and with Escape', async () => {
      loadServices([mockServiceRow])
      await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())

      fireEvent.click(screen.getByRole('button', { name: /Corte de cabello/ }))
      fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
      expect(screen.queryByRole('dialog')).toBeNull()

      fireEvent.click(screen.getByRole('button', { name: /Corte de cabello/ }))
      fireEvent.keyDown(window, { key: 'Escape' })
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('card truncates descriptions over 80 chars; panel shows the full text', async () => {
      loadServices([{ ...mockServiceRow, description: longDescription }])
      await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())

      expect(screen.getByText('x'.repeat(80) + '…')).toBeDefined()
      expect(screen.queryByText(longDescription)).toBeNull()

      fireEvent.click(screen.getByRole('button', { name: /Corte de cabello/ }))
      expect(screen.getByText(longDescription)).toBeDefined()
    })

    it('does not truncate a description of exactly 80 chars', async () => {
      const desc = 'y'.repeat(80)
      loadServices([{ ...mockServiceRow, description: desc }])
      await waitFor(() => expect(screen.getByText(desc)).toBeDefined())
    })

    it('shows price and duration on the card', async () => {
      loadServices([mockServiceRow])
      await waitFor(() => expect(screen.getByText(/60 min/)).toBeDefined())
    })

    it('falls back to the placeholder when the image fails to load', async () => {
      loadServices([{ ...mockServiceRow, image_url: 'https://example.test/broken.jpg' }])
      const img = await screen.findByRole('img', { name: 'Corte de cabello' })
      fireEvent.error(img)
      expect(screen.queryByRole('img', { name: 'Corte de cabello' })).toBeNull()
    })

    describe('categories', () => {
      const otherRow = {
        ...mockServiceRow,
        id: 'svc-2',
        name: 'Manicura',
        category_id: 'cat-2',
      }
      const hairRow = { ...mockServiceRow, category_id: 'cat-1' }

      it('filters services by category chip and "Todos" resets', async () => {
        mockListCategories.mockResolvedValue([
          { id: 'cat-1', name: 'Peluquería' },
          { id: 'cat-2', name: 'Uñas' },
        ])
        loadServices([hairRow, otherRow])
        await waitFor(() => expect(screen.getByRole('button', { name: 'Uñas' })).toBeDefined())

        fireEvent.click(screen.getByRole('button', { name: 'Uñas' }))
        expect(screen.queryByText('Corte de cabello')).toBeNull()
        expect(screen.getByText('Manicura')).toBeDefined()

        fireEvent.click(screen.getByRole('button', { name: 'Todos' }))
        expect(screen.getByText('Corte de cabello')).toBeDefined()
        expect(screen.getByText('Manicura')).toBeDefined()
      })

      it('hides categories that have no services', async () => {
        mockListCategories.mockResolvedValue([
          { id: 'cat-1', name: 'Peluquería' },
          { id: 'cat-empty', name: 'Vacía' },
        ])
        loadServices([hairRow])
        await waitFor(() => expect(screen.getByRole('button', { name: 'Peluquería' })).toBeDefined())
        expect(screen.queryByRole('button', { name: 'Vacía' })).toBeNull()
      })

      it('shows no category chips when there are no categories', async () => {
        loadServices([mockServiceRow])
        await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())
        expect(screen.queryByRole('button', { name: 'Todos' })).toBeNull()
      })

      it('still lists services when loading categories fails', async () => {
        mockListCategories.mockRejectedValue(new Error('boom'))
        loadServices([mockServiceRow])
        await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())
      })
    })
  })

  describe('Navigation and boundary behavior', () => {
    async function goToStep3WithSlot() {
      mockSupabaseFrom.mockReturnValueOnce(
        buildQueryChain({ data: [mockServiceRow], error: null }),
      )
      mockGetAvailableSlots.mockResolvedValue([mockSlot])
      renderPage()
      await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())
      await selectService()
      fireEvent.change(document.querySelector('input[type="date"]') as HTMLInputElement, {
        target: { value: '2025-06-10' },
      })
      await waitFor(() => expect(screen.getByTestId('slot-block')).toBeInTheDocument())
    }

    it('date input ignores an empty value (stays on step 2)', async () => {
      mockSupabaseFrom.mockReturnValueOnce(
        buildQueryChain({ data: [mockServiceRow], error: null }),
      )
      renderPage()
      await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())
      await selectService()

      const input = document.querySelector('input[type="date"]') as HTMLInputElement
      fireEvent.change(input, { target: { value: '' } })
      expect(mockGetAvailableSlots).not.toHaveBeenCalled()
      expect(screen.getByText(/Seleccioná una fecha para/)).toBeDefined()
    })

    it('date input has min=today and max within the booking horizon', async () => {
      mockGetBusinessSettings.mockResolvedValue({
        timezone: 'UTC',
        bookingMaxHorizonDays: 7,
        weeklyHours: [],
      })
      mockSupabaseFrom.mockReturnValueOnce(
        buildQueryChain({ data: [mockServiceRow], error: null }),
      )
      renderPage()
      await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())
      await selectService()

      const input = document.querySelector('input[type="date"]') as HTMLInputElement
      const today = new Date().toISOString().slice(0, 10)
      expect(input.min).toBe(today)
      await waitFor(() => {
        const max = new Date()
        max.setDate(max.getDate() + 7)
        expect(input.max).toBe(max.toISOString().slice(0, 10))
      })
    })

    it('back from step 3 returns to the date picker and keeps service', async () => {
      await goToStep3WithSlot()
      fireEvent.click(screen.getByRole('button', { name: 'Volver al paso anterior' }))
      expect(screen.getByText(/Seleccioná una fecha para/)).toBeDefined()
      expect(screen.getByText('Corte de cabello', { selector: 'strong' })).toBeDefined()
    })

    it('back to step 1 clears the service and shows the list again', async () => {
      await goToStep3WithSlot()
      fireEvent.click(screen.getByRole('button', { name: 'Volver al paso anterior' }))
      fireEvent.click(screen.getByRole('button', { name: 'Volver al paso anterior' }))
      expect(screen.getByText(/Elegí el servicio/)).toBeDefined()
    })

    it('"Siguiente" is disabled again after returning from a conflict error', async () => {
      const err = Object.assign(new Error('Horario no disponible'), { code: '23P01' })
      mockCreateAppointment.mockRejectedValueOnce(err)
      await goToStep3WithSlot()
      fireEvent.click(screen.getByTestId('slot-block'))
      fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
      await waitFor(() => expect(screen.getByText(/Revisá tu reserva/)).toBeDefined())
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
      await waitFor(() => expect(screen.getByText('Elegir otro turno')).toBeDefined())
      fireEvent.click(screen.getByText('Elegir otro turno'))

      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled(),
      )
    })

    it('falls back to a generic Spanish message when the error has no message', async () => {
      mockCreateAppointment.mockRejectedValueOnce({})
      await goToStep3WithSlot()
      fireEvent.click(screen.getByTestId('slot-block'))
      fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
      await waitFor(() => expect(screen.getByText(/Revisá tu reserva/)).toBeDefined())
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
      await waitFor(() =>
        expect(screen.getByText('Error al confirmar el turno.')).toBeDefined(),
      )
    })

    it('does not navigate when booking fails', async () => {
      mockCreateAppointment.mockRejectedValueOnce(new Error('fallo'))
      await goToStep3WithSlot()
      fireEvent.click(screen.getByTestId('slot-block'))
      fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
      await waitFor(() => expect(screen.getByText(/Revisá tu reserva/)).toBeDefined())
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
      await waitFor(() => expect(screen.getByText('fallo')).toBeDefined())
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('disables the confirm button while the booking is in flight (no double submit)', async () => {
      mockCreateAppointment.mockImplementationOnce(() => new Promise(() => {}))
      await goToStep3WithSlot()
      fireEvent.click(screen.getByTestId('slot-block'))
      fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
      await waitFor(() => expect(screen.getByText(/Revisá tu reserva/)).toBeDefined())
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))

      const busy = await screen.findByRole('button', { name: 'Confirmando…' })
      expect(busy).toBeDisabled()
      fireEvent.click(busy)
      expect(mockCreateAppointment).toHaveBeenCalledTimes(1)
    })
  })
})
