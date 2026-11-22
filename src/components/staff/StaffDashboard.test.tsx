import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { StaffDashboard } from './StaffDashboard'

const mockAgenda = vi.fn()
const mockUseUser = vi.fn()
const mockNavigate = vi.fn()
vi.mock('../../hooks/useUser', () => ({ useUser: () => mockUseUser() }))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})
vi.mock('../../hooks/useMyAgenda', () => ({ useMyAgenda: () => mockAgenda() }))

const base = {
  items: [],
  next: null,
  timezone: 'America/Argentina/Buenos_Aires',
  now: new Date('2026-11-21T13:00:00Z'),
  stats: { today: 2, upcoming: 5, month: 9, cancelledMonth: 1 },
  loading: false,
  error: null,
}

describe('StaffDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseUser.mockReturnValue({ roles: ['staff'], setActiveRole: vi.fn() })
  })

  it('shows the four counters, each linking to the agenda', () => {
    mockAgenda.mockReturnValue(base)
    render(
      <MemoryRouter>
        <StaffDashboard />
      </MemoryRouter>,
    )
    for (const label of ['Mis turnos hoy', 'Próximos turnos', 'Este mes', 'Cancelados este mes']) {
      expect(screen.getByRole('link', { name: new RegExp(label) })).toHaveAttribute('href', '/staff/appointments')
    }
    expect(screen.getByText('9')).toBeInTheDocument()
  })

  it('links the next appointment to its staff detail and hides the professional name', () => {
    mockAgenda.mockReturnValue({
      ...base,
      items: [],
      next: {
        id: 'a1',
        startsAt: '2026-11-21T14:00:00Z',
        endsAt: '2026-11-21T15:00:00Z',
        status: 'confirmed',
        customerName: 'Ana Pérez',
        serviceName: 'Belleza de pies',
        staffDisplayName: 'Sil',
      },
    })
    render(
      <MemoryRouter>
        <StaffDashboard />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Ana Pérez' })).toHaveAttribute('href', '/staff/appointments/a1')
    expect(screen.queryByText(/con Sil/)).toBeNull()
  })

  it('shows an empty state when there are no appointments today (edge case)', () => {
    mockAgenda.mockReturnValue({ ...base, stats: { today: 0, upcoming: 0, month: 0, cancelledMonth: 0 } })
    render(
      <MemoryRouter>
        <StaffDashboard />
      </MemoryRouter>,
    )
    expect(screen.getByText('Hoy no tenés turnos.')).toBeInTheDocument()
  })

  it('shows the error without breaking the counters (edge case)', () => {
    mockAgenda.mockReturnValue({ ...base, error: 'No pudimos cargar tus turnos. Probá de nuevo en unos minutos.' })
    render(
      <MemoryRouter>
        <StaffDashboard />
      </MemoryRouter>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar tus turnos')
  })

  it('offers the way to the public site', () => {
    mockAgenda.mockReturnValue(base)
    render(
      <MemoryRouter>
        <StaffDashboard />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Ir al sitio web' })).toHaveAttribute('href', '/')
    expect(screen.queryByText(/página principal/i)).toBeNull()
  })

  it('a professional who is not a customer is told to ask the admin (edge case)', () => {
    mockAgenda.mockReturnValue(base)
    render(
      <MemoryRouter>
        <StaffDashboard />
      </MemoryRouter>,
    )
    expect(screen.getByText(/pedile a tu administrador que te haga cliente/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reservar turno' })).toBeNull()
  })

  it('a professional who is also a customer switches to the customer role to book', () => {
    const setActiveRole = vi.fn()
    mockUseUser.mockReturnValue({ roles: ['staff', 'customer'], setActiveRole })
    mockAgenda.mockReturnValue(base)
    render(
      <MemoryRouter>
        <StaffDashboard />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Reservar turno' }))
    expect(setActiveRole).toHaveBeenCalledWith('customer')
    expect(mockNavigate).toHaveBeenCalledWith('/booking')
    expect(screen.queryByText(/pedile a tu administrador/)).toBeNull()
  })
})
