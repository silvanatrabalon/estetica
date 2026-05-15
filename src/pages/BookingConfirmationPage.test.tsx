import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { BookingConfirmationPage } from './BookingConfirmationPage'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'
import type { AppointmentDetail } from '../services/appointments'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockGetAppointment = vi.fn()

vi.mock('../services/appointments', () => ({
  getAppointment: (...args: unknown[]) => mockGetAppointment(...args),
}))

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

// ── Fixtures ─────────────────────────────────────────────────────────────────

const APPOINTMENT_ID = 'aaaabbbb-cccc-dddd-eeee-123456789012'

const mockDetail: AppointmentDetail = {
  id: APPOINTMENT_ID,
  startsAt: '2025-06-10T14:00:00Z',
  endsAt: '2025-06-10T15:00:00Z',
  status: 'confirmed',
  createdAt: '2025-06-09T10:00:00Z',
  customerUserId: 'user-customer-123',
  serviceName: 'Corte de cabello',
  serviceDurationMinutes: 60,
  servicePriceCents: 5000,
  staffDisplayName: 'María López',
  orgName: 'Estética Moderna',
  orgTimezone: 'America/Argentina/Buenos_Aires',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPage(appointmentId = APPOINTMENT_ID) {
  return render(
    <TestUserProvider {...mockSessions.authenticatedCustomer}>
      <MemoryRouter
        initialEntries={[`/booking/confirmation/${appointmentId}`]}
      >
        <Routes>
          <Route
            path="/booking/confirmation/:appointmentId"
            element={<BookingConfirmationPage />}
          />
        </Routes>
      </MemoryRouter>
    </TestUserProvider>,
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BookingConfirmationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('renders spinner and loading text while fetching', () => {
      // Never resolves during this test
      mockGetAppointment.mockReturnValue(new Promise(() => {}))
      renderPage()

      expect(screen.getByText('Cargando tu turno...')).toBeInTheDocument()
    })
  })

  describe('success state', () => {
    beforeEach(() => {
      mockGetAppointment.mockResolvedValue(mockDetail)
    })

    it('renders service name', async () => {
      renderPage()
      await waitFor(() =>
        expect(screen.getByText('Corte de cabello')).toBeInTheDocument(),
      )
    })

    it('renders staff display name', async () => {
      renderPage()
      await waitFor(() =>
        expect(screen.getByText('María López')).toBeInTheDocument(),
      )
    })

    it('renders org name', async () => {
      renderPage()
      await waitFor(() =>
        expect(screen.getByText('Estética Moderna')).toBeInTheDocument(),
      )
    })

    it('renders "Confirmado" status badge', async () => {
      renderPage()
      await waitFor(() =>
        expect(screen.getByText('Confirmado')).toBeInTheDocument(),
      )
    })

    it('renders booking reference as last 8 chars of UUID uppercased', async () => {
      renderPage()
      // Last 8 chars of APPOINTMENT_ID = '89012' → wait, let's compute:
      // APPOINTMENT_ID = 'aaaabbbb-cccc-dddd-eeee-123456789012'
      // .slice(-8) = '56789012' → uppercase = '56789012'
      await waitFor(() =>
        expect(screen.getByText('56789012')).toBeInTheDocument(),
      )
    })

    it('renders formatted time using formatSlotTime', async () => {
      renderPage()
      // 2025-06-10T14:00:00Z in America/Argentina/Buenos_Aires = 11:00 a.m.
      await waitFor(() => {
        const timeEl = screen.getByText(/11:00/i)
        expect(timeEl).toBeInTheDocument()
      })
    })

    it('calls getAppointment with the appointmentId from route param', async () => {
      renderPage()
      await waitFor(() => {
        expect(mockGetAppointment).toHaveBeenCalledWith(APPOINTMENT_ID)
      })
    })

    it('"Ver mis turnos" link points to /appointments', async () => {
      renderPage()
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /ver mis turnos/i })
        expect(link).toHaveAttribute('href', '/appointments')
      })
    })

    it('"Hacer otra reserva" link points to /booking', async () => {
      renderPage()
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /hacer otra reserva/i })
        expect(link).toHaveAttribute('href', '/booking')
      })
    })
  })

  describe('not-found state', () => {
    it('renders not-found message when RPC returns null', async () => {
      mockGetAppointment.mockResolvedValue(null)
      renderPage()

      await waitFor(() =>
        expect(
          screen.getByText(
            /No encontramos tu turno\. Verificá que el enlace sea correcto\./i,
          ),
        ).toBeInTheDocument(),
      )
    })
  })

  describe('error state', () => {
    it('renders error message when RPC throws', async () => {
      mockGetAppointment.mockRejectedValue(new Error('RPC error'))
      renderPage()

      await waitFor(() =>
        expect(
          screen.getByText(
            /Ocurrió un error al cargar tu turno\. Intentá de nuevo\./i,
          ),
        ).toBeInTheDocument(),
      )
    })
  })

  describe('refreshable — reads from route param', () => {
    it('passes appointmentId from route to getAppointment, not from state', async () => {
      const otherId = 'ffffffff-ffff-ffff-ffff-abcdef012345'
      mockGetAppointment.mockResolvedValue({ ...mockDetail, id: otherId })
      renderPage(otherId)

      await waitFor(() => {
        expect(mockGetAppointment).toHaveBeenCalledWith(otherId)
      })
    })
  })

  describe('navigation via userEvent', () => {
    it('"Ver mis turnos" is navigable', async () => {
      mockGetAppointment.mockResolvedValue(mockDetail)
      renderPage()

      const link = await screen.findByRole('link', { name: /ver mis turnos/i })
      expect(link).toBeInTheDocument()
      // Verify href attribute (MemoryRouter handles actual navigation)
      expect(link).toHaveAttribute('href', '/appointments')
    })
  })
})
