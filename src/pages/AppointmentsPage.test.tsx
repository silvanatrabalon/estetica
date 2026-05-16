import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppointmentsPage } from './AppointmentsPage'
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
const APT_ID_1 = 'aaaabbbb-cccc-dddd-eeee-123456789001'
const APT_ID_2 = 'aaaabbbb-cccc-dddd-eeee-123456789002'

const upcomingApt: AppointmentSummary = {
  id: APT_ID_1,
  startsAt: FUTURE_DATE,
  endsAt: '2099-06-01T15:00:00Z',
  status: 'confirmed',
  createdAt: '2099-05-01T10:00:00Z',
  customerUserId: 'user-customer-123',
  serviceName: 'Corte de cabello',
  serviceDurationMinutes: 60,
  servicePriceCents: 5000,
  staffDisplayName: 'María López',
  orgName: 'Estética Moderna',
  orgTimezone: 'America/Argentina/Buenos_Aires',
  customerName: 'Juan Pérez',
}

const pastApt: AppointmentSummary = {
  id: APT_ID_2,
  startsAt: PAST_DATE,
  endsAt: '2020-01-01T15:00:00Z',
  status: 'completed',
  createdAt: '2019-12-01T10:00:00Z',
  customerUserId: 'user-customer-123',
  serviceName: 'Tinte',
  serviceDurationMinutes: 90,
  servicePriceCents: 8000,
  staffDisplayName: 'Carlos Rodríguez',
  orgName: 'Estética Moderna',
  orgTimezone: 'America/Argentina/Buenos_Aires',
  customerName: 'Juan Pérez',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPage() {
  return render(
    <TestUserProvider {...mockSessions.authenticatedCustomer}>
      <MemoryRouter initialEntries={['/appointments']}>
        <AppointmentsPage />
      </MemoryRouter>
    </TestUserProvider>,
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AppointmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('shows loading text while fetching', () => {
      mockListAppointments.mockReturnValue(new Promise(() => {}))
      renderPage()

      expect(screen.getByText('Cargando tus turnos...')).toBeInTheDocument()
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

  describe('list view — Próximos tab', () => {
    beforeEach(() => {
      mockListAppointments.mockResolvedValue([upcomingApt, pastApt])
    })

    it('shows the Próximos tab by default', async () => {
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('Corte de cabello')).toBeInTheDocument(),
      )
      expect(screen.queryByText('Tinte')).not.toBeInTheDocument()
    })

    it('shows appointment service name', async () => {
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('Corte de cabello')).toBeInTheDocument(),
      )
    })

    it('shows status badge "Confirmado"', async () => {
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('Confirmado')).toBeInTheDocument(),
      )
    })

    it('shows staff display name as secondary field', async () => {
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('María López')).toBeInTheDocument(),
      )
    })

    it('shows booking reference (last 8 chars of id uppercased)', async () => {
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('#56789001')).toBeInTheDocument(),
      )
    })

    it('appointment card links to confirmation page', async () => {
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('Corte de cabello')).toBeInTheDocument(),
      )

      const link = screen
        .getByText('Corte de cabello')
        .closest('a')
      expect(link).toHaveAttribute('href', `/booking/confirmation/${APT_ID_1}`)
    })
  })

  describe('list view — tab switching', () => {
    beforeEach(() => {
      mockListAppointments.mockResolvedValue([upcomingApt, pastApt])
    })

    it('switches to Historial tab and shows past appointments', async () => {
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('Historial')).toBeInTheDocument(),
      )

      fireEvent.click(screen.getByText('Historial'))

      expect(screen.getByText('Tinte')).toBeInTheDocument()
      expect(screen.queryByText('Corte de cabello')).not.toBeInTheDocument()
    })

    it('shows "Completado" badge on Historial tab', async () => {
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('Historial')).toBeInTheDocument(),
      )

      fireEvent.click(screen.getByText('Historial'))

      expect(screen.getByText('Completado')).toBeInTheDocument()
    })
  })

  describe('empty states', () => {
    it('shows Spanish empty state on Próximos tab when no upcoming appointments', async () => {
      mockListAppointments.mockResolvedValue([pastApt])
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('No tenés turnos próximos')).toBeInTheDocument(),
      )
    })

    it('shows Spanish empty state on Historial tab when no past appointments', async () => {
      mockListAppointments.mockResolvedValue([upcomingApt])
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('Historial')).toBeInTheDocument(),
      )

      fireEvent.click(screen.getByText('Historial'))

      expect(screen.getByText('No hay turnos en tu historial')).toBeInTheDocument()
    })
  })

  describe('Lista ↔ Calendario toggle', () => {
    beforeEach(() => {
      mockListAppointments.mockResolvedValue([upcomingApt])
    })

    it('renders Lista view by default', async () => {
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('Próximos')).toBeInTheDocument(),
      )
    })

    it('switches to Calendario view when toggle clicked', async () => {
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('Calendario')).toBeInTheDocument(),
      )

      fireEvent.click(screen.getByText('Calendario'))

      // Calendar sub-toggle visible
      expect(screen.getByText('Semanal')).toBeInTheDocument()
      expect(screen.getByText('Mensual')).toBeInTheDocument()
    })

    it('shows monthly calendar when Mensual is selected', async () => {
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('Calendario')).toBeInTheDocument(),
      )

      fireEvent.click(screen.getByText('Calendario'))
      fireEvent.click(screen.getByText('Mensual'))

      // Month navigation arrows should be present
      expect(screen.getByLabelText('Mes anterior')).toBeInTheDocument()
      expect(screen.getByLabelText('Mes siguiente')).toBeInTheDocument()
    })

    it('shows weekly calendar navigation by default in calendar mode', async () => {
      renderPage()

      await waitFor(() =>
        expect(screen.getByText('Calendario')).toBeInTheDocument(),
      )

      fireEvent.click(screen.getByText('Calendario'))

      expect(screen.getByLabelText('Semana anterior')).toBeInTheDocument()
      expect(screen.getByLabelText('Semana siguiente')).toBeInTheDocument()
    })
  })
})
