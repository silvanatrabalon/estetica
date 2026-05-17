import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ReschedulePage } from './ReschedulePage'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'
import type { AppointmentDetail } from '../services/appointments'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockGetAppointment = vi.fn()
const mockRescheduleAppointment = vi.fn()

vi.mock('../services/appointments', () => ({
  getAppointment: (...args: unknown[]) => mockGetAppointment(...args),
  rescheduleAppointment: (...args: unknown[]) => mockRescheduleAppointment(...args),
}))

const mockGetBusinessSettings = vi.fn()

vi.mock('../services/businessSettings', () => ({
  getBusinessSettings: (...args: unknown[]) => mockGetBusinessSettings(...args),
}))

const mockGetAvailableSlots = vi.fn()

vi.mock('../services/availability', () => ({
  getAvailableSlots: (...args: unknown[]) => mockGetAvailableSlots(...args),
}))

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

// ── Fixtures ─────────────────────────────────────────────────────────────────

const APPOINTMENT_ID = 'aaaabbbb-cccc-dddd-eeee-123456789012'
const SERVICE_ID = 'svc-001'

const mockDetail: AppointmentDetail = {
  id: APPOINTMENT_ID,
  serviceId: SERVICE_ID,
  staffMemberId: 'staff-001',
  startsAt: '2099-06-10T14:00:00Z',
  endsAt: '2099-06-10T15:00:00Z',
  status: 'confirmed',
  createdAt: '2099-06-09T10:00:00Z',
  customerUserId: 'user-customer-123',
  serviceName: 'Corte de cabello',
  serviceDurationMinutes: 60,
  servicePriceCents: 5000,
  staffDisplayName: 'María López',
  orgName: 'Estética Moderna',
  orgTimezone: 'America/Argentina/Buenos_Aires',
}

const mockSlot = { starts_at: '2099-06-15T10:00:00Z', ends_at: '2099-06-15T11:00:00Z' }

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPage(appointmentId = APPOINTMENT_ID) {
  return render(
    <TestUserProvider {...mockSessions.authenticatedCustomer}>
      <MemoryRouter initialEntries={[`/appointments/${appointmentId}/reschedule`]}>
        <Routes>
          <Route
            path="/appointments/:id/reschedule"
            element={<ReschedulePage />}
          />
          <Route path="/booking/confirmation/:id" element={<div>Confirmación</div>} />
        </Routes>
      </MemoryRouter>
    </TestUserProvider>,
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ReschedulePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetBusinessSettings.mockResolvedValue({
      timezone: 'UTC',
      bookingMaxHorizonDays: 60,
    })
    mockGetAvailableSlots.mockResolvedValue([])
  })

  describe('loading state', () => {
    it('renders Spanish loading text while fetching appointment', () => {
      mockGetAppointment.mockReturnValue(new Promise(() => {}))
      renderPage()

      expect(screen.getByText('Cargando turno...')).toBeInTheDocument()
    })
  })

  describe('not-found state', () => {
    it('renders Spanish not-found message when appointment is null', async () => {
      mockGetAppointment.mockResolvedValue(null)
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('No encontramos este turno.')).toBeInTheDocument(),
      )
    })
  })

  describe('error state', () => {
    it('renders Spanish error message when getAppointment throws', async () => {
      mockGetAppointment.mockRejectedValue(new Error('Network error'))
      renderPage()

      await waitFor(() =>
        expect(
          screen.getByText('Ocurrió un error al cargar el turno.'),
        ).toBeInTheDocument(),
      )
    })
  })

  describe('slot picker step', () => {
    beforeEach(() => {
      mockGetAppointment.mockResolvedValue(mockDetail)
    })

    it('shows the service name after loading', async () => {
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('Corte de cabello')).toBeInTheDocument(),
      )
    })

    it('shows a date input for selecting a new date', async () => {
      renderPage()

      await waitFor(() =>
        expect(screen.getByLabelText('Fecha')).toBeInTheDocument(),
      )
    })

    it('shows available slots after a date is selected', async () => {
      mockGetAvailableSlots.mockResolvedValue([mockSlot])
      renderPage()

      await waitFor(() =>
        expect(screen.getByLabelText('Fecha')).toBeInTheDocument(),
      )

      fireEvent.change(screen.getByLabelText('Fecha'), {
        target: { value: '2099-06-15' },
      })

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /10:00/ })).toBeInTheDocument(),
      )
    })
  })

  describe('confirm step', () => {
    beforeEach(() => {
      mockGetAppointment.mockResolvedValue(mockDetail)
      mockGetAvailableSlots.mockResolvedValue([mockSlot])
    })

    it('navigates to picker step via back button', async () => {
      renderPage()

      await waitFor(() => screen.getByLabelText('Fecha'))

      fireEvent.change(screen.getByLabelText('Fecha'), {
        target: { value: '2099-06-15' },
      })

      await waitFor(() => screen.getByRole('button', { name: /10:00/ }))

      fireEvent.click(screen.getByRole('button', { name: /10:00/ }))

      await waitFor(() =>
        expect(screen.getByText('Confirmar reprogramación')).toBeInTheDocument(),
      )

      fireEvent.click(screen.getByText('← Volver'))

      await waitFor(() =>
        expect(screen.getByLabelText('Fecha')).toBeInTheDocument(),
      )
    })

    it('calls rescheduleAppointment and navigates on success', async () => {
      mockRescheduleAppointment.mockResolvedValue({
        id: APPOINTMENT_ID,
        serviceId: SERVICE_ID,
        staffMemberId: 'staff-001',
        startsAt: mockSlot.starts_at,
        endsAt: mockSlot.ends_at,
        status: 'confirmed',
        updatedAt: '2099-06-14T08:00:00Z',
      })

      renderPage()

      await waitFor(() => screen.getByLabelText('Fecha'))

      fireEvent.change(screen.getByLabelText('Fecha'), {
        target: { value: '2099-06-15' },
      })

      await waitFor(() => screen.getByRole('button', { name: /10:00/ }))

      fireEvent.click(screen.getByRole('button', { name: /10:00/ }))

      await waitFor(() =>
        expect(screen.getByText('Confirmar reprogramación')).toBeInTheDocument(),
      )

      fireEvent.click(screen.getByText('Confirmar reprogramación'))

      await waitFor(() =>
        expect(mockRescheduleAppointment).toHaveBeenCalledWith({
          appointmentId: APPOINTMENT_ID,
          newStartsAt: mockSlot.starts_at,
        }),
      )

      expect(mockNavigate).toHaveBeenCalledWith(
        `/booking/confirmation/${APPOINTMENT_ID}`,
      )
    })

    it('shows conflict error inline and "Elegir otro turno" CTA on failure', async () => {
      mockRescheduleAppointment.mockRejectedValue(
        new Error('El horario seleccionado ya no está disponible. Por favor, elegí otro turno.'),
      )

      renderPage()

      await waitFor(() => screen.getByLabelText('Fecha'))

      fireEvent.change(screen.getByLabelText('Fecha'), {
        target: { value: '2099-06-15' },
      })

      await waitFor(() => screen.getByRole('button', { name: /10:00/ }))

      fireEvent.click(screen.getByRole('button', { name: /10:00/ }))

      await waitFor(() =>
        expect(screen.getByText('Confirmar reprogramación')).toBeInTheDocument(),
      )

      fireEvent.click(screen.getByText('Confirmar reprogramación'))

      await waitFor(() =>
        expect(
          screen.getByText(
            'El horario seleccionado ya no está disponible. Por favor, elegí otro turno.',
          ),
        ).toBeInTheDocument(),
      )

      expect(screen.getByText('Elegir otro turno')).toBeInTheDocument()
    })

    it('"Elegir otro turno" CTA resets to picker step', async () => {
      mockRescheduleAppointment.mockRejectedValue(
        new Error('El horario seleccionado ya no está disponible. Por favor, elegí otro turno.'),
      )

      renderPage()

      await waitFor(() => screen.getByLabelText('Fecha'))

      fireEvent.change(screen.getByLabelText('Fecha'), {
        target: { value: '2099-06-15' },
      })

      await waitFor(() => screen.getByRole('button', { name: /10:00/ }))

      fireEvent.click(screen.getByRole('button', { name: /10:00/ }))

      await waitFor(() =>
        expect(screen.getByText('Confirmar reprogramación')).toBeInTheDocument(),
      )

      fireEvent.click(screen.getByText('Confirmar reprogramación'))

      await waitFor(() =>
        expect(screen.getByText('Elegir otro turno')).toBeInTheDocument(),
      )

      fireEvent.click(screen.getByText('Elegir otro turno'))

      await waitFor(() =>
        expect(screen.getByLabelText('Fecha')).toBeInTheDocument(),
      )
    })

    it('shows policy window error inline', async () => {
      mockRescheduleAppointment.mockRejectedValue(
        new Error('Este horario está fuera del plazo mínimo permitido para reprogramar.'),
      )

      renderPage()

      await waitFor(() => screen.getByLabelText('Fecha'))

      fireEvent.change(screen.getByLabelText('Fecha'), {
        target: { value: '2099-06-15' },
      })

      await waitFor(() => screen.getByRole('button', { name: /10:00/ }))

      fireEvent.click(screen.getByRole('button', { name: /10:00/ }))

      await waitFor(() =>
        expect(screen.getByText('Confirmar reprogramación')).toBeInTheDocument(),
      )

      fireEvent.click(screen.getByText('Confirmar reprogramación'))

      await waitFor(() =>
        expect(
          screen.getByText(
            'Este horario está fuera del plazo mínimo permitido para reprogramar.',
          ),
        ).toBeInTheDocument(),
      )
    })
  })
})
