import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { DayView } from './DayView'
import type { AppointmentSummary } from '../../services/appointments'

function makeApt(overrides: Partial<AppointmentSummary> = {}): AppointmentSummary {
  return {
    id: 'apt-1',
    startsAt: '2026-05-11T09:00:00Z',
    endsAt: '2026-05-11T10:30:00Z',
    status: 'confirmed',
    createdAt: '2026-05-01T00:00:00Z',
    customerUserId: 'user-1',
    serviceId: 'svc-1',
    serviceName: 'Corte',
    serviceDurationMinutes: 90,
    servicePriceCents: 2000,
    staffDisplayName: 'Ana',
    orgName: 'Salon',
    orgTimezone: 'UTC',
    customerName: 'Juan',
    ...overrides,
  }
}

function renderDayView(
  appointments: AppointmentSummary[] = [],
  props: Partial<React.ComponentProps<typeof DayView>> = {},
) {
  return render(
    <MemoryRouter>
      <DayView
        appointments={appointments}
        orgTimezone="UTC"
        openTime="09:00"
        closeTime="20:00"
        selectedDate={new Date('2026-05-11T00:00:00Z')}
        onDayChange={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  )
}

describe('DayView', () => {
  it('renders empty state when no appointments match the selected date', () => {
    renderDayView([])
    expect(screen.getByTestId('day-view-empty')).toHaveTextContent('Sin turnos para este día')
  })

  it('renders loading state', () => {
    renderDayView([], { loading: true })
    expect(screen.getByText('Cargando turnos...')).toBeInTheDocument()
    expect(screen.queryByTestId('day-view-column')).not.toBeInTheDocument()
  })

  it('renders error state', () => {
    renderDayView([], { error: 'Error de red' })
    expect(screen.getByText('Error de red')).toBeInTheDocument()
    expect(screen.queryByTestId('day-view-column')).not.toBeInTheDocument()
  })

  it('block at open time has top = 0', () => {
    // Appointment starts exactly at openTime 09:00 UTC
    const apt = makeApt({ startsAt: '2026-05-11T09:00:00Z', endsAt: '2026-05-11T10:30:00Z' })
    renderDayView([apt])
    const block = screen.getByTestId('day-view-block')
    expect(block.style.top).toBe('0px')
  })

  it('block height is proportional to appointment duration', () => {
    // 90-minute appointment → 180px at 2px/min
    const apt = makeApt({ startsAt: '2026-05-11T09:00:00Z', endsAt: '2026-05-11T10:30:00Z' })
    renderDayView([apt])
    const block = screen.getByTestId('day-view-block')
    expect(block.style.height).toBe('180px')
  })

  it('appointment spanning past close time still renders', () => {
    // starts at 19:30, ends at 20:30 (past close time 20:00)
    const apt = makeApt({ startsAt: '2026-05-11T19:30:00Z', endsAt: '2026-05-11T20:30:00Z' })
    renderDayView([apt])
    expect(screen.getByTestId('day-view-block')).toBeInTheDocument()
  })

  it('only shows appointments matching the selected date', () => {
    const todayApt = makeApt({
      id: 'apt-today',
      startsAt: '2026-05-11T10:00:00Z',
      endsAt: '2026-05-11T10:30:00Z',
    })
    const tomorrowApt = makeApt({
      id: 'apt-tomorrow',
      startsAt: '2026-05-12T10:00:00Z',
      endsAt: '2026-05-12T10:30:00Z',
    })
    renderDayView([todayApt, tomorrowApt])
    const blocks = screen.getAllByTestId('day-view-block')
    expect(blocks).toHaveLength(1)
  })

  it('shows service name in block', () => {
    const apt = makeApt({ serviceName: 'Tinte' })
    renderDayView([apt])
    expect(screen.getByText('Tinte')).toBeInTheDocument()
  })

  it('renders navigation buttons', () => {
    renderDayView([])
    expect(screen.getByLabelText('Día anterior')).toBeInTheDocument()
    expect(screen.getByLabelText('Día siguiente')).toBeInTheDocument()
  })

  it('shows "Hoy" button when selected date is not today', () => {
    // selectedDate is explicitly in the past so it is not today
    const pastDate = new Date('2020-01-15T00:00:00Z')
    renderDayView([], { selectedDate: pastDate })
    expect(screen.getByText('Hoy')).toBeInTheDocument()
  })
})
