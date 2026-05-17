import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppointmentCard } from './AppointmentCard'
import type { AppointmentSummary } from '../../services/appointments'

// ── Mock cancelAppointment ────────────────────────────────────────────────────

const mockCancelAppointment = vi.hoisted(() => vi.fn())

vi.mock('../../services/appointments', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/appointments')>()
  return {
    ...actual,
    cancelAppointment: mockCancelAppointment,
  }
})

// ── Fixtures ─────────────────────────────────────────────────────────────────

const APT_ID = 'aaaabbbb-cccc-dddd-eeee-123456789001'

const baseApt: AppointmentSummary = {
  id: APT_ID,
  startsAt: '2099-06-01T14:00:00Z',
  endsAt: '2099-06-01T15:00:00Z',
  status: 'confirmed',
  createdAt: '2099-05-01T10:00:00Z',
  customerUserId: 'user-customer-123',
  serviceName: 'Corte de cabello',
  serviceDurationMinutes: 60,
  servicePriceCents: 5000,
  staffDisplayName: 'María López',
  orgName: 'Estética Moderna',
  orgTimezone: 'UTC',
  customerName: 'Juan Pérez',
}

function renderCard(
  overrides: Partial<AppointmentSummary> = {},
  showRescheduleAction = false,
  showCancelAction = false,
  onCancelSuccess?: (id: string) => void,
) {
  const apt = { ...baseApt, ...overrides }
  return render(
    <MemoryRouter>
      <AppointmentCard
        appointment={apt}
        showCustomerName={false}
        showRescheduleAction={showRescheduleAction}
        showCancelAction={showCancelAction}
        onCancelSuccess={onCancelSuccess}
      />
    </MemoryRouter>,
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AppointmentCard', () => {
  describe('card body link', () => {
    it('links to the booking confirmation page', () => {
      renderCard()
      const link = screen.getByRole('link', { name: /Corte de cabello/i })
      expect(link).toHaveAttribute('href', `/booking/confirmation/${APT_ID}`)
    })
  })

  describe('"Reprogramar" CTA', () => {
    it('is visible for confirmed appointment when showRescheduleAction=true', () => {
      renderCard({ status: 'confirmed' }, true)
      const link = screen.getByRole('link', { name: 'Reprogramar' })
      expect(link).toHaveAttribute('href', `/appointments/${APT_ID}/reschedule`)
    })

    it('is visible for pending appointment when showRescheduleAction=true', () => {
      renderCard({ status: 'pending' }, true)
      expect(screen.getByRole('link', { name: 'Reprogramar' })).toBeInTheDocument()
    })

    it('is hidden for cancelled appointment even when showRescheduleAction=true', () => {
      renderCard({ status: 'cancelled' }, true)
      expect(screen.queryByRole('link', { name: 'Reprogramar' })).not.toBeInTheDocument()
    })

    it('is hidden for completed appointment even when showRescheduleAction=true', () => {
      renderCard({ status: 'completed' }, true)
      expect(screen.queryByRole('link', { name: 'Reprogramar' })).not.toBeInTheDocument()
    })

    it('is hidden for no_show appointment even when showRescheduleAction=true', () => {
      renderCard({ status: 'no_show' }, true)
      expect(screen.queryByRole('link', { name: 'Reprogramar' })).not.toBeInTheDocument()
    })

    it('is hidden when showRescheduleAction=false even for confirmed appointment', () => {
      renderCard({ status: 'confirmed' }, false)
      expect(screen.queryByRole('link', { name: 'Reprogramar' })).not.toBeInTheDocument()
    })
  })

  describe('"Cancelar" CTA', () => {
    it('is not rendered when showCancelAction=false', () => {
      renderCard({ status: 'confirmed' }, false, false)
      expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
    })

    it('is not rendered for cancelled status even with showCancelAction=true', () => {
      renderCard({ status: 'cancelled' }, false, true)
      expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
    })

    it('is not rendered for completed status even with showCancelAction=true', () => {
      renderCard({ status: 'completed' }, false, true)
      expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
    })

    it('is not rendered for no_show status even with showCancelAction=true', () => {
      renderCard({ status: 'no_show' }, false, true)
      expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
    })

    it('is visible for confirmed appointment when showCancelAction=true', () => {
      renderCard({ status: 'confirmed' }, false, true)
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    })

    it('is visible for pending appointment when showCancelAction=true', () => {
      renderCard({ status: 'pending' }, false, true)
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    })

    it('opens dialog when Cancelar is clicked', () => {
      renderCard({ status: 'confirmed' }, false, true)
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('¿Cancelar este turno?')).toBeInTheDocument()
      expect(screen.getByText('Esta acción no se puede deshacer.')).toBeInTheDocument()
    })

    it('Volver closes dialog without calling service', () => {
      renderCard({ status: 'confirmed' }, false, true)
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Volver' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(mockCancelAppointment).not.toHaveBeenCalled()
    })

    it('Sí cancelar calls cancelAppointment and calls onCancelSuccess on success', async () => {
      const onCancelSuccess = vi.fn()
      mockCancelAppointment.mockResolvedValueOnce({
        id: APT_ID,
        serviceId: 'svc-1',
        staffMemberId: 'staff-1',
        startsAt: '2099-06-01T14:00:00Z',
        endsAt: '2099-06-01T15:00:00Z',
        status: 'cancelled',
        updatedAt: '2026-05-16T10:00:00Z',
      })

      renderCard({ status: 'confirmed' }, false, true, onCancelSuccess)
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
      fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar' }))

      await waitFor(() => {
        expect(mockCancelAppointment).toHaveBeenCalledWith({ appointmentId: APT_ID })
        expect(onCancelSuccess).toHaveBeenCalledWith(APT_ID)
      })
    })

    it('shows Spanish error message in dialog when cancelAppointment throws', async () => {
      mockCancelAppointment.mockRejectedValueOnce(
        new Error('No tenés permiso para cancelar este turno.'),
      )

      renderCard({ status: 'confirmed' }, false, true)
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
      fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar' }))

      await waitFor(() => {
        expect(screen.getByText('No tenés permiso para cancelar este turno.')).toBeInTheDocument()
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })
  })
})
