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

vi.mock('../services/adminCategories', () => ({
  listCategories: () => Promise.resolve([]),
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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BookingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetBusinessSettings.mockResolvedValue({
      timezone: 'UTC',
      bookingMaxHorizonDays: 60,
      weeklyHours: [],
    })
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

      fireEvent.click(screen.getByText('Corte de cabello'))

      expect(screen.getByText(/Seleccioná una fecha/)).toBeDefined()
    })
  })

  describe('Step 2 — Date picker', () => {
    async function goToStep2() {
      mockSupabaseFrom.mockReturnValueOnce(
        buildQueryChain({ data: [mockServiceRow], error: null }),
      )
      renderPage()
      await waitFor(() => expect(screen.getByText('Corte de cabello')).toBeDefined())
      fireEvent.click(screen.getByText('Corte de cabello'))
    }

    it('shows date picker and back button', async () => {
      await goToStep2()
      expect(screen.getByText('← Volver')).toBeDefined()
      expect(document.querySelector('input[type="date"]')).not.toBeNull()
    })

    it('shows selected service name', async () => {
      await goToStep2()
      expect(screen.getByText('Corte de cabello')).toBeDefined()
    })

    it('goes back to step 1 on back button click', async () => {
      await goToStep2()
      fireEvent.click(screen.getByText('← Volver'))
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
      fireEvent.click(screen.getByText('Corte de cabello'))
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
      fireEvent.click(screen.getByText('Corte de cabello'))

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
    })

    it('renders duration in minutes', async () => {
      await goToStep4()
      expect(screen.getByText(/60 min/)).toBeDefined()
    })

    it('renders price formatted in pesos', async () => {
      await goToStep4()
      // 5000 cents = $50.00
      expect(screen.getByText(/50/)).toBeDefined()
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

    it('"\u2190 Volver" from step 4 returns to step 3', async () => {
      await goToStep4()

      const backButtons = screen.getAllByText('← Volver')
      fireEvent.click(backButtons[0])

      await waitFor(() =>
        expect(screen.getByText(/Turnos disponibles para/)).toBeDefined(),
      )
    })
  })
})
