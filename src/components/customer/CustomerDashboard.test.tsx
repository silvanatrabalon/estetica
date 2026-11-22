import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CustomerDashboard } from './CustomerDashboard'

const mockAgenda = vi.fn()
vi.mock('../../hooks/useMyAgenda', () => ({ useMyAgenda: (scope?: string) => mockAgenda(scope) }))

const TZ = 'America/Argentina/Buenos_Aires'
const apt = {
  id: 'a1',
  startsAt: '2026-11-25T13:00:00Z',
  endsAt: '2026-11-25T14:00:00Z',
  status: 'confirmed',
  serviceName: 'Manicura clásica',
  staffDisplayName: 'Camila',
  orgTimezone: TZ,
}
const card = { id: 'a1', startsAt: '2026-11-21T13:30:00Z', endsAt: '2026-11-21T14:30:00Z', status: 'confirmed', customerName: 'Ana', serviceName: 'Manicura clásica', staffDisplayName: 'Camila' }

const base = {
  items: [],
  featured: [],
  timezone: TZ,
  now: new Date('2026-11-21T13:18:00Z'),
  stats: { today: 0, upcoming: 0, month: 0, cancelledMonth: 0 },
  nextAppointment: null,
  loading: false,
  error: null,
}

function renderIt() {
  return render(
    <MemoryRouter>
      <CustomerDashboard />
    </MemoryRouter>,
  )
}

describe('CustomerDashboard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reads only the client\'s own appointments', () => {
    mockAgenda.mockReturnValue(base)
    renderIt()
    expect(mockAgenda).toHaveBeenCalledWith('customer')
  })

  it('has a + Reservar button and a link to all the appointments', () => {
    mockAgenda.mockReturnValue(base)
    renderIt()
    expect(screen.getByRole('link', { name: '+ Reservar' })).toHaveAttribute('href', '/booking')
    expect(screen.getByRole('link', { name: 'Ver todos mis turnos' })).toHaveAttribute('href', '/appointments')
  })

  it('shows today\'s appointment with its service and the professional, linking to its detail', () => {
    mockAgenda.mockReturnValue({ ...base, items: [card], featured: [card] })
    renderIt()
    expect(screen.getByRole('link', { name: 'Manicura clásica' })).toHaveAttribute('href', '/appointments/a1')
    expect(screen.getByText('con Camila')).toBeInTheDocument()
    expect(screen.queryByText('Ana')).toBeNull()
  })

  it('without appointments today, shows the next one that is to come', () => {
    mockAgenda.mockReturnValue({ ...base, nextAppointment: apt })
    renderIt()
    expect(screen.getByText('Hoy no tenés turnos.')).toBeInTheDocument()
    expect(screen.getByText('Tu próximo turno:')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Manicura clásica' })).toHaveAttribute('href', '/appointments/a1')
    expect(screen.getByText(/con Camila/)).toBeInTheDocument()
  })

  it('a client with no appointments at all is invited to book (edge case)', () => {
    mockAgenda.mockReturnValue(base)
    renderIt()
    expect(screen.getByText('Todavía no tenés turnos.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reservar turno' })).toHaveAttribute('href', '/booking')
  })

  it('shows the error when the appointments cannot be loaded (edge case)', () => {
    mockAgenda.mockReturnValue({ ...base, error: 'No pudimos cargar tus turnos.' })
    renderIt()
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar tus turnos.')
  })

  it('shows placeholders while loading (edge case)', () => {
    mockAgenda.mockReturnValue({ ...base, loading: true })
    renderIt()
    expect(screen.getByLabelText('Turnos de hoy')).toHaveAttribute('aria-busy', 'true')
  })
})
