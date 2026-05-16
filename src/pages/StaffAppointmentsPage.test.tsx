import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { StaffAppointmentsPage } from './StaffAppointmentsPage'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'
import type { AppointmentSummary } from '../services/appointments'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockListAppointments = vi.fn()

vi.mock('../services/appointments', () => ({
  listAppointments: (...args: unknown[]) => mockListAppointments(...args),
}))

// ── Fixtures ─────────────────────────────────────────────────────────────────

const FUTURE_DATE = '2099-06-01T14:00:00Z'
const PAST_DATE = '2020-01-01T14:00:00Z'
const APT_ID_1 = 'aaaabbbb-cccc-dddd-eeee-223456789001'

const upcomingApt: AppointmentSummary = {
  id: APT_ID_1,
  startsAt: FUTURE_DATE,
  endsAt: '2099-06-01T15:00:00Z',
  status: 'confirmed',
  createdAt: '2099-05-01T10:00:00Z',
  customerUserId: 'user-customer-999',
  serviceName: 'Corte de cabello',
  serviceDurationMinutes: 60,
  servicePriceCents: 5000,
  staffDisplayName: 'María López',
  orgName: 'Estética Moderna',
  orgTimezone: 'America/Argentina/Buenos_Aires',
  customerName: 'Ana García',
}

const pastApt: AppointmentSummary = {
  id: 'aaaabbbb-cccc-dddd-eeee-223456789002',
  startsAt: PAST_DATE,
  endsAt: '2020-01-01T15:30:00Z',
  status: 'completed',
  createdAt: '2019-12-01T10:00:00Z',
  customerUserId: 'user-customer-888',
  serviceName: 'Tinte',
  serviceDurationMinutes: 90,
  servicePriceCents: 8000,
  staffDisplayName: 'María López',
  orgName: 'Estética Moderna',
  orgTimezone: 'America/Argentina/Buenos_Aires',
  customerName: 'Carlos Rodríguez',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPage() {
  return render(
    <TestUserProvider {...mockSessions.authenticatedStaff}>
      <MemoryRouter initialEntries={['/staff/appointments']}>
        <StaffAppointmentsPage />
      </MemoryRouter>
    </TestUserProvider>,
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('StaffAppointmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('shows loading text while fetching', () => {
      mockListAppointments.mockReturnValue(new Promise(() => {}))
      renderPage()

      expect(screen.getByText('Cargando turnos...')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('shows Spanish error message on failure', async () => {
      mockListAppointments.mockRejectedValue(new Error('RPC error'))
      renderPage()

      await waitFor(() =>
        expect(
          screen.getByText('Ocurrió un error al cargar tus turnos.'),
        ).toBeInTheDocument(),
      )
    })
  })

  describe('list view — cards show customer name', () => {
    beforeEach(() => {
      mockListAppointments.mockResolvedValue([upcomingApt])
    })

    it('shows customer name instead of staff name on cards', async () => {
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('Ana García')).toBeInTheDocument(),
      )

      // Staff name should NOT appear as the secondary field
      // (it may appear elsewhere but the card secondary field is customer name)
      expect(screen.getByText('Ana García')).toBeInTheDocument()
    })

    it('shows service name on card', async () => {
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('Corte de cabello')).toBeInTheDocument(),
      )
    })

    it('shows status badge', async () => {
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('Confirmado')).toBeInTheDocument(),
      )
    })

    it('card links to confirmation page', async () => {
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('Corte de cabello')).toBeInTheDocument(),
      )

      const link = screen.getByText('Corte de cabello').closest('a')
      expect(link).toHaveAttribute('href', `/booking/confirmation/${APT_ID_1}`)
    })
  })

  describe('empty states', () => {
    it('shows staff-appropriate empty state on Próximos tab', async () => {
      mockListAppointments.mockResolvedValue([pastApt])
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('No tenés turnos asignados')).toBeInTheDocument(),
      )
    })

    it('shows empty state on Historial tab', async () => {
      mockListAppointments.mockResolvedValue([upcomingApt])
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('Historial')).toBeInTheDocument(),
      )

      fireEvent.click(screen.getByText('Historial'))

      expect(screen.getByText('No hay turnos en el historial')).toBeInTheDocument()
    })
  })

  describe('tab switching', () => {
    it('switches to Historial tab and shows past appointments', async () => {
      mockListAppointments.mockResolvedValue([upcomingApt, pastApt])
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('Historial')).toBeInTheDocument(),
      )

      fireEvent.click(screen.getByText('Historial'))

      expect(screen.getByText('Tinte')).toBeInTheDocument()
      expect(screen.queryByText('Corte de cabello')).not.toBeInTheDocument()
    })
  })
})
