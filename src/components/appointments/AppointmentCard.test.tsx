import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppointmentCard } from './AppointmentCard'
import type { AppointmentSummary } from '../../services/appointments'

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

function renderCard(overrides: Partial<AppointmentSummary> = {}, showRescheduleAction = false) {
  const apt = { ...baseApt, ...overrides }
  return render(
    <MemoryRouter>
      <AppointmentCard
        appointment={apt}
        showCustomerName={false}
        showRescheduleAction={showRescheduleAction}
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
})
