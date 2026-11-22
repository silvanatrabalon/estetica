import { beforeEach, describe, expect, it, vi } from 'vitest'
import { pickOption } from '../hooks/__test-utils__/select'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
const mockGetAvailableDays = vi.fn()

vi.mock('../services/availability', () => ({
  getAvailableSlots: (...args: unknown[]) => mockGetAvailableSlots(...args),
  getAvailableDays: (...args: unknown[]) => mockGetAvailableDays(...args),
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

const mockValidateCoupon = vi.fn()

vi.mock('../services/coupons', () => ({
  validateCoupon: (...args: unknown[]) => mockValidateCoupon(...args),
}))

const mockListBookingClients = vi.fn()

vi.mock('../services/bookingClients', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/bookingClients')>()
  return { ...actual, listBookingClients: (...args: unknown[]) => mockListBookingClients(...args) }
})

const mockGetLandingConfig = vi.fn()

vi.mock('../services/landing', () => ({
  getLandingConfig: (...args: unknown[]) => mockGetLandingConfig(...args),
}))

const mockListCategories = vi.fn()

vi.mock('../services/adminCategories', () => ({
  listCategories: (...args: unknown[]) => mockListCategories(...args),
}))

const mockListActivePromos = vi.fn().mockResolvedValue([])

vi.mock('../services/promos', () => ({
  listActivePromos: (...args: unknown[]) => mockListActivePromos(...args),
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

const todayKey = () => new Date().toISOString().slice(0, 10)

/** Clicks the first bookable day in the calendar. */
async function pickDay() {
  const day = await screen.findByRole('button', { name: /horarios? libres?/ })
  fireEvent.click(day)
}

function currentStep(): string | null {
  const nav = screen.getByRole('navigation', { name: 'Pasos de la reserva' })
  return nav.querySelector('[aria-current="step"]')?.textContent?.replace(/^\d+/, '') ?? null
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
    mockGetAvailableDays.mockResolvedValue([{ day: todayKey(), slotCount: 3 }])
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

      expect(currentStep()).toBe('Fecha')
      expect(screen.queryByText(/Seleccioná una fecha para/)).toBeNull()
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
      expect(screen.getByRole('grid')).toBeDefined()
    })

    it('does not repeat the instruction line above the calendar', async () => {
      await goToStep2()
      expect(screen.queryByText(/Seleccioná una fecha para/)).toBeNull()
    })

    it('goes back to step 1 on back button click', async () => {
      await goToStep2()
      fireEvent.click(screen.getByRole('button', { name: 'Volver al paso anterior' }))
      await waitFor(() => expect(currentStep()).toBe('Servicio'))
    })

    it('advances to step 3 after selecting a date', async () => {
      mockGetAvailableSlots.mockResolvedValueOnce([])
      await goToStep2()

      await pickDay()

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
      await pickDay()
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

  describe('No title or subtitle above the steps', () => {
    const baseSettings = { timezone: 'UTC', bookingMaxHorizonDays: 60, weeklyHours: [] }

    it('does not show the configured title or subtitle (it repeated the business name)', async () => {
      mockGetBusinessSettings.mockResolvedValue({
        ...baseSettings,
        bookingHeaderText: 'Estética So Beauty',
        bookingSubtitleText: 'Elegí tu tratamiento favorito',
      })
      mockSupabaseFrom.mockReturnValueOnce(buildQueryChain({ data: [], error: null }))
      renderPage()

      await waitFor(() => expect(mockGetBusinessSettings).toHaveBeenCalled())
      expect(screen.queryByText('Estética So Beauty')).toBeNull()
      expect(screen.queryByText('Elegí tu tratamiento favorito')).toBeNull()
      expect(screen.queryByRole('heading')).toBeNull()
    })

    it('does not show the default heading or the "Elegí el servicio…" line either (edge case)', async () => {
      mockGetBusinessSettings.mockResolvedValue({ ...baseSettings, bookingHeaderText: null, bookingSubtitleText: '   ' })
      mockSupabaseFrom.mockReturnValueOnce(buildQueryChain({ data: [], error: null }))
      renderPage()

      await waitFor(() => expect(mockGetBusinessSettings).toHaveBeenCalled())
      expect(screen.queryByText('Reservar turno')).toBeNull()
      expect(screen.queryByText('Elegí el servicio que querés reservar.')).toBeNull()
    })

    it('works when business settings fail to load (edge case)', async () => {
      mockGetBusinessSettings.mockRejectedValue(new Error('down'))
      mockSupabaseFrom.mockReturnValueOnce(buildQueryChain({ data: [], error: null }))
      renderPage()

      await waitFor(() => expect(mockGetBusinessSettings).toHaveBeenCalled())
      expect(screen.getByRole('navigation', { name: 'Pasos de la reserva' })).toBeInTheDocument()
    })
  })

  describe('Spanish copy', () => {
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

      await pickDay()

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
      expect(screen.getAllByText('Servicio').length).toBe(2) // the step and the review row
    })

    it('renders duration in minutes', async () => {
      await goToStep4()
      expect(screen.getByText(/60 min/)).toBeDefined()
    })

    it('renders price formatted in pesos', async () => {
      await goToStep4()
      expect(screen.getByText(/te enviamos un email con los datos/)).toBeDefined()
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
      await pickDay()
      await waitFor(() => expect(screen.getByTestId('slot-block')).toBeInTheDocument())
    }

    it('days without free slots cannot be picked and the page says so (edge case)', async () => {
      mockGetAvailableDays.mockResolvedValue([])
      mockSupabaseFrom.mockReturnValueOnce(
        buildQueryChain({ data: [mockServiceRow], error: null }),
      )
      renderPage()
      await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())
      await selectService()

      expect(await screen.findByText(/No hay días disponibles este mes/)).toBeDefined()
      expect(screen.queryByRole('button', { name: /horarios? libres?/ })).toBeNull()
      expect(mockGetAvailableSlots).not.toHaveBeenCalled()
    })

    it('only asks for days inside the booking window', async () => {
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

      await waitFor(() => expect(mockGetAvailableDays).toHaveBeenCalled())
      await waitFor(() => {
        const [, from, to] = mockGetAvailableDays.mock.calls.at(-1)!
        expect(from).toBe(todayKey())
        const max = new Date()
        max.setUTCDate(max.getUTCDate() + 7)
        expect(to <= max.toISOString().slice(0, 10)).toBe(true)
      })
    })

    it('back from step 3 returns to the date picker and keeps service', async () => {
      await goToStep3WithSlot()
      fireEvent.click(screen.getByRole('button', { name: 'Volver al paso anterior' }))
      expect(currentStep()).toBe('Fecha')
    })

    it('back to step 1 clears the service and shows the list again', async () => {
      await goToStep3WithSlot()
      fireEvent.click(screen.getByRole('button', { name: 'Volver al paso anterior' }))
      fireEvent.click(screen.getByRole('button', { name: 'Volver al paso anterior' }))
      expect(currentStep()).toBe('Servicio')
      expect(screen.getByText('Corte de cabello')).toBeDefined()
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

describe('BookingPage — step by step menu and phone category filter', () => {
  const otherRow = { ...mockServiceRow, id: 'svc-2', name: 'Manicura', category_id: 'cat-2' }
  const hairRow = { ...mockServiceRow, category_id: 'cat-1' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('the stepper is there from the first step, with Servicio as the current one', async () => {
    mockSupabaseFrom.mockReturnValueOnce(buildQueryChain({ data: [mockServiceRow], error: null }))
    renderPage()
    await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())
    expect(currentStep()).toBe('Servicio')
    expect(screen.queryByRole('button', { name: 'Volver al paso anterior' })).toBeNull()
  })

  it('moves along the steps and keeps them in view, with the back arrow from step 2', async () => {
    mockSupabaseFrom.mockReturnValueOnce(buildQueryChain({ data: [mockServiceRow], error: null }))
    renderPage()
    await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())
    await selectService()
    expect(currentStep()).toBe('Fecha')
    expect(screen.getByRole('button', { name: 'Volver al paso anterior' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Volver a Servicio' })).toBeInTheDocument()
  })

  it('pressing Servicio in the stepper goes back to the list and clears the choice', async () => {
    mockSupabaseFrom.mockReturnValueOnce(buildQueryChain({ data: [mockServiceRow], error: null }))
    mockGetAvailableSlots.mockResolvedValue([mockSlot])
    renderPage()
    await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())
    await selectService()
    await pickDay()
    await waitFor(() => expect(screen.getByTestId('slot-block')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Volver a Servicio' }))
    expect(currentStep()).toBe('Servicio')
    expect(screen.queryByTestId('slot-block')).toBeNull()
    expect(screen.getByText('Corte de cabello')).toBeInTheDocument()
  })

  it('pressing Fecha from the time step returns to the date picker keeping the service (edge case)', async () => {
    mockSupabaseFrom.mockReturnValueOnce(buildQueryChain({ data: [mockServiceRow], error: null }))
    mockGetAvailableSlots.mockResolvedValue([mockSlot])
    renderPage()
    await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())
    await selectService()
    await pickDay()
    await waitFor(() => expect(screen.getByTestId('slot-block')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Volver a Fecha' }))
    expect(currentStep()).toBe('Fecha')
    expect(screen.getByRole('grid')).toBeDefined()
  })

  it('on phones the categories are one button with a drop-down; chips remain for larger screens', async () => {
    mockListCategories.mockResolvedValue([
      { id: 'cat-1', name: 'Peluquería' },
      { id: 'cat-2', name: 'Uñas' },
    ])
    mockSupabaseFrom.mockReturnValueOnce(buildQueryChain({ data: [hairRow, otherRow], error: null }))
    renderPage()
    const trigger = await screen.findByRole('button', { name: 'Filtrar por categoría' })
    expect(trigger.parentElement?.parentElement?.className).toContain('sm:hidden')
    expect(trigger.textContent).toContain('Todas las categorías')
    expect(screen.getByRole('button', { name: 'Todos' }).parentElement?.className).toContain('hidden')
    expect(screen.getByRole('button', { name: 'Todos' }).parentElement?.className).toContain('sm:flex')
  })

  it('choosing a category in the drop-down filters the services and shows it on the button', async () => {
    mockListCategories.mockResolvedValue([
      { id: 'cat-1', name: 'Peluquería' },
      { id: 'cat-2', name: 'Uñas' },
    ])
    mockSupabaseFrom.mockReturnValueOnce(buildQueryChain({ data: [hairRow, otherRow], error: null }))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Filtrar por categoría' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Uñas' }))
    expect(screen.queryByText('Corte de cabello')).toBeNull()
    expect(screen.getByText('Manicura')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filtrar por categoría' }).textContent).toContain('Uñas')
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar por categoría' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Todas las categorías' }))
    expect(screen.getByText('Corte de cabello')).toBeInTheDocument()
  })

  it('the drop-down lists only categories that have services (edge case)', async () => {
    mockListCategories.mockResolvedValue([
      { id: 'cat-1', name: 'Peluquería' },
      { id: 'cat-empty', name: 'Vacía' },
    ])
    mockSupabaseFrom.mockReturnValueOnce(buildQueryChain({ data: [hairRow], error: null }))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Filtrar por categoría' }))
    expect(screen.getByRole('menuitemradio', { name: 'Peluquería' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitemradio', { name: 'Vacía' })).toBeNull()
  })

  it('with no categories there is no filter at all (edge case)', async () => {
    mockListCategories.mockResolvedValue([])
    mockSupabaseFrom.mockReturnValueOnce(buildQueryChain({ data: [mockServiceRow], error: null }))
    renderPage()
    await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())
    expect(screen.queryByRole('button', { name: 'Filtrar por categoría' })).toBeNull()
  })
})

describe('BookingPage — coupon', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetBusinessSettings.mockResolvedValue({ timezone: 'UTC', bookingMaxHorizonDays: 60, weeklyHours: [] })
    mockListCategories.mockResolvedValue([])
    mockGetLandingConfig.mockResolvedValue({
      primaryColor: '#f3e8ff', businessName: 'Test', tagline: null, logoUrl: null, heroImageUrl: null, carouselImages: [],
    })
    mockGetAvailableDays.mockResolvedValue([{ day: todayKey(), slotCount: 3 }])
    mockGetAvailableSlots.mockResolvedValue([mockSlot])
  })

  async function goToReview() {
    mockSupabaseFrom.mockReturnValueOnce(buildQueryChain({ data: [mockServiceRow], error: null }))
    renderPage()
    await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())
    await selectService()
    await pickDay()
    await waitFor(() => expect(screen.getByTestId('slot-block')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('slot-block'))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await waitFor(() => expect(screen.getByText(/Revisá tu reserva/)).toBeDefined())
  }

  async function applyCode(code: string) {
    fireEvent.change(screen.getByLabelText('¿Tenés un cupón?'), { target: { value: code } })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
  }

  it('applies a valid coupon and shows the discount and the new total', async () => {
    mockValidateCoupon.mockResolvedValue({ discountCents: 500, finalPriceCents: 4500 })
    await goToReview()
    await applyCode('verano10')

    expect(await screen.findByText(/aplicado/)).toBeDefined()
    expect(mockValidateCoupon).toHaveBeenCalledWith('svc-1', 'VERANO10')
    expect(screen.getByText('-$5.00')).toBeDefined()
    expect(screen.getByText('$45.00')).toBeDefined()
  })

  it('books with the coupon code', async () => {
    mockValidateCoupon.mockResolvedValue({ discountCents: 500, finalPriceCents: 4500 })
    mockCreateAppointment.mockResolvedValue({ id: 'apt-1' })
    await goToReview()
    await applyCode('VERANO10')
    await screen.findByText(/aplicado/)
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    await waitFor(() =>
      expect(mockCreateAppointment).toHaveBeenCalledWith(expect.objectContaining({ couponCode: 'VERANO10' })),
    )
  })

  it('books without a coupon when none was applied', async () => {
    mockCreateAppointment.mockResolvedValue({ id: 'apt-1' })
    await goToReview()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    await waitFor(() =>
      expect(mockCreateAppointment).toHaveBeenCalledWith(expect.objectContaining({ couponCode: undefined })),
    )
  })

  it('shows the reason when the coupon cannot be used and keeps the full price (edge case)', async () => {
    mockValidateCoupon.mockRejectedValue(new Error('Ya usaste este cupón.'))
    await goToReview()
    await applyCode('USADO')
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya usaste este cupón.')
    expect(screen.queryByText(/aplicado/)).toBeNull()
    expect(screen.getByText('$50.00')).toBeDefined()
  })

  it('asks for a code when the field is empty without calling the server (edge case)', async () => {
    await goToReview()
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(await screen.findByText('Escribí el código del cupón.')).toBeDefined()
    expect(mockValidateCoupon).not.toHaveBeenCalled()
  })

  it('a coupon can be removed (edge case)', async () => {
    mockValidateCoupon.mockResolvedValue({ discountCents: 500, finalPriceCents: 4500 })
    await goToReview()
    await applyCode('VERANO10')
    await screen.findByText(/aplicado/)
    fireEvent.click(screen.getByRole('button', { name: 'Quitar' }))
    expect(screen.queryByText(/aplicado/)).toBeNull()
    expect(screen.getByLabelText('¿Tenés un cupón?')).toBeDefined()
  })
})

describe('BookingPage — booking for someone else (admin and staff)', () => {
  function renderAs(role: 'staff' | 'admin' | 'customer') {
    const session = {
      staff: mockSessions.authenticatedStaff,
      admin: mockSessions.authenticatedAdmin,
      customer: mockSessions.authenticatedCustomer,
    }[role]
    return render(
      <MemoryRouter>
        <TestUserProvider user={session.user} roles={[role]} activeRole={role} isLoading={false}>
          <BookingPage />
        </TestUserProvider>
      </MemoryRouter>,
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetBusinessSettings.mockResolvedValue({ timezone: 'UTC', bookingMaxHorizonDays: 60, weeklyHours: [] })
    mockListCategories.mockResolvedValue([])
    mockGetLandingConfig.mockResolvedValue({
      primaryColor: '#f3e8ff', businessName: 'Test', tagline: null, logoUrl: null, heroImageUrl: null, carouselImages: [],
    })
    mockGetAvailableDays.mockResolvedValue([{ day: todayKey(), slotCount: 3 }])
    mockGetAvailableSlots.mockResolvedValue([mockSlot])
    mockListBookingClients.mockResolvedValue([
      { kind: 'account', userId: 'client-1', name: 'Ana Pérez', email: 'ana@mail.com', phone: null, isActive: true },
      { kind: 'guest', userId: null, name: 'Rosa Gómez', email: 'rosa@mail.com', phone: '1155', isActive: true },
    ])
    mockCreateAppointment.mockResolvedValue({ id: 'apt-1' })
  })

  async function goToReview(role: 'staff' | 'admin' | 'customer') {
    mockSupabaseFrom.mockReturnValueOnce(buildQueryChain({ data: [mockServiceRow], error: null }))
    renderAs(role)
    await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())
    await selectService()
    await pickDay()
    await waitFor(() => expect(screen.getByTestId('slot-block')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('slot-block'))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await waitFor(() => expect(screen.getByText(/Revisá tu reserva/)).toBeDefined())
  }

  it('a client never sees the "who is it for" choice and never loads the client list', async () => {
    await goToReview('customer')
    expect(screen.queryByRole('radiogroup', { name: '¿Para quién es la reserva?' })).toBeNull()
    expect(mockListBookingClients).not.toHaveBeenCalled()
  })

  it.each(['staff', 'admin'] as const)('%s sees the choice, defaulting to "Para mí"', async (role) => {
    await goToReview(role)
    expect(screen.getByRole('radio', { name: 'Para mí' })).toHaveAttribute('aria-checked', 'true')
    expect(mockListBookingClients).toHaveBeenCalled()
  })

  it('booking for oneself sends no customer (the user is the client)', async () => {
    await goToReview('staff')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    await waitFor(() => expect(mockCreateAppointment).toHaveBeenCalled())
    const args = mockCreateAppointment.mock.calls[0][0]
    expect(args.customerUserId).toBeUndefined()
    expect(args.guest).toBeUndefined()
  })

  it('books for an existing client account', async () => {
    await goToReview('admin')
    fireEvent.click(screen.getByRole('radio', { name: 'Para un cliente' }))
    await pickOption('Cliente', 'Ana Pérez (ana@mail.com)')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    await waitFor(() =>
      expect(mockCreateAppointment).toHaveBeenCalledWith(expect.objectContaining({ customerUserId: 'client-1' })),
    )
  })

  it('books for a person without an account', async () => {
    await goToReview('staff')
    fireEvent.click(screen.getByRole('radio', { name: 'Otra persona' }))
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Rosa Gómez' } })
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'rosa@mail.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    await waitFor(() =>
      expect(mockCreateAppointment).toHaveBeenCalledWith(
        expect.objectContaining({ guest: { name: 'Rosa Gómez', phone: '', email: 'rosa@mail.com' } }),
      ),
    )
  })

  it('picking a person without account from the list books for them as "Otra persona"', async () => {
    await goToReview('admin')
    fireEvent.click(screen.getByRole('radio', { name: 'Para un cliente' }))
    await pickOption('Cliente', 'Rosa Gómez (rosa@mail.com) · sin cuenta')
    expect((screen.getByLabelText('Nombre') as HTMLInputElement).value).toBe('Rosa Gómez')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    await waitFor(() =>
      expect(mockCreateAppointment).toHaveBeenCalledWith(
        expect.objectContaining({ guest: { name: 'Rosa Gómez', phone: '1155', email: 'rosa@mail.com' } }),
      ),
    )
  })

  it('does not book without choosing the client or without a name (edge cases)', async () => {
    await goToReview('staff')
    fireEvent.click(screen.getByRole('radio', { name: 'Para un cliente' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    expect(await screen.findByText('Elegí al cliente para la reserva.')).toBeDefined()
    fireEvent.click(screen.getByRole('radio', { name: 'Otra persona' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    expect(await screen.findByText(/Escribí el nombre de la persona/)).toBeDefined()
    expect(mockCreateAppointment).not.toHaveBeenCalled()
  })

  it('the coupon box only appears when booking for oneself (edge case)', async () => {
    await goToReview('staff')
    expect(screen.getByLabelText('¿Tenés un cupón?')).toBeDefined()
    fireEvent.click(screen.getByRole('radio', { name: 'Para un cliente' }))
    expect(screen.queryByLabelText('¿Tenés un cupón?')).toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: 'Para mí' }))
    expect(screen.getByLabelText('¿Tenés un cupón?')).toBeDefined()
  })

  it('switching away from "Para mí" drops an applied coupon (edge case)', async () => {
    mockValidateCoupon.mockResolvedValue({ discountCents: 500, finalPriceCents: 4500 })
    await goToReview('staff')
    fireEvent.change(screen.getByLabelText('¿Tenés un cupón?'), { target: { value: 'VERANO10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    await screen.findByText(/aplicado/)
    fireEvent.click(screen.getByRole('radio', { name: 'Otra persona' }))
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Rosa' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    await waitFor(() => expect(mockCreateAppointment).toHaveBeenCalled())
    expect(mockCreateAppointment.mock.calls[0][0].couponCode).toBeUndefined()
  })

  it('says who gets the notification when it is not for oneself', async () => {
    await goToReview('staff')
    expect(screen.getByText(/te enviamos un email con los datos/)).toBeDefined()
    fireEvent.click(screen.getByRole('radio', { name: 'Otra persona' }))
    expect(screen.getByText(/avisamos por email a la persona/)).toBeDefined()
  })
})

describe('BookingPage — promo', () => {
  const promo = {
    serviceId: 'svc-1',
    promoId: 'promo-1',
    name: 'Semana de manos',
    description: 'Todo con descuento',
    discountType: 'percent' as const,
    discountValue: 20,
    discountCents: 1000,
    finalPriceCents: 4000,
    endsOn: '2026-12-31',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockListActivePromos.mockResolvedValue([])
    mockGetBusinessSettings.mockResolvedValue({ timezone: 'UTC', bookingMaxHorizonDays: 60, weeklyHours: [] })
    mockListCategories.mockResolvedValue([])
    mockGetLandingConfig.mockResolvedValue({
      primaryColor: '#f3e8ff', businessName: 'Test', tagline: null, logoUrl: null, heroImageUrl: null, carouselImages: [],
    })
    mockGetAvailableDays.mockResolvedValue([{ day: todayKey(), slotCount: 3 }])
    mockGetAvailableSlots.mockResolvedValue([mockSlot])
  })

  async function load() {
    mockSupabaseFrom.mockReturnValueOnce(buildQueryChain({ data: [mockServiceRow], error: null }))
    renderPage()
    await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())
  }

  it('marks the service in promo with a badge and the new price', async () => {
    mockListActivePromos.mockResolvedValue([promo])
    await load()
    expect(await screen.findByText('PROMO 20% OFF')).toBeDefined()
    expect(screen.getByText(/\$\s?40/)).toBeDefined()
  })

  it('shows no promo badge when there are no promos (edge case)', async () => {
    await load()
    expect(screen.queryByText(/^PROMO/)).toBeNull()
  })

  it('still lists the services when promos fail to load (edge case)', async () => {
    mockListActivePromos.mockRejectedValue(new Error('boom'))
    await load()
    expect(screen.queryByText(/^PROMO/)).toBeNull()
  })

  it('the review shows the promo discount and total, and hides the coupon box', async () => {
    mockListActivePromos.mockResolvedValue([promo])
    await load()
    await screen.findByText('PROMO 20% OFF')
    await selectService()
    await pickDay()
    await waitFor(() => expect(screen.getByTestId('slot-block')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('slot-block'))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await waitFor(() => expect(screen.getByText(/Revisá tu reserva/)).toBeDefined())
    expect(screen.getByText('Promo Semana de manos')).toBeDefined()
    expect(screen.getByText('-$10.00')).toBeDefined()
    expect(screen.getByText('$40.00')).toBeDefined()
    expect(screen.queryByLabelText('¿Tenés un cupón?')).toBeNull()
    expect(screen.getByText(/no se suma con cupones/)).toBeDefined()
  })

  it('the Promos filter shows only the services in promo', async () => {
    mockListActivePromos.mockResolvedValue([promo])
    mockSupabaseFrom.mockReturnValueOnce(
      buildQueryChain({ data: [mockServiceRow, { ...mockServiceRow, id: 'svc-2', name: 'Masaje' }], error: null }),
    )
    renderPage()
    await screen.findByText('PROMO 20% OFF')
    expect(screen.getByText('Masaje')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Promos' }))
    expect(screen.queryByText('Masaje')).toBeNull()
    expect(screen.getByText('Corte de cabello')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Todos' }))
    expect(screen.getByText('Masaje')).toBeDefined()
  })

  it('has no Promos filter when nothing is in promo (edge case)', async () => {
    await load()
    expect(screen.queryByRole('button', { name: 'Promos' })).toBeNull()
  })

  it('the review explains that the promo does not stack with coupons', async () => {
    mockListActivePromos.mockResolvedValue([promo])
    mockListBookingClients.mockResolvedValue([])
    await load()
    await screen.findByText('PROMO 20% OFF')
    await selectService()
    await pickDay()
    await waitFor(() => expect(screen.getByTestId('slot-block')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('slot-block'))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await screen.findByText(/Revisá tu reserva/)
    expect(screen.getByText(/no se suma con cupones/)).toBeDefined()
  })
})
