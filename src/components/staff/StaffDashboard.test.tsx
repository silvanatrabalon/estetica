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
  featured: [],
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

  it('shows the day total as a pill linking to the day\'s Turnos, and no counter cards', () => {
    mockAgenda.mockReturnValue(base)
    render(
      <MemoryRouter>
        <StaffDashboard />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: '2 turnos hoy' })).toHaveAttribute('href', '/staff/appointments?periodo=today')
    for (const label of ['Próximos turnos', 'Este mes', 'Cancelados este mes', 'Mis turnos hoy']) {
      expect(screen.queryByText(label)).toBeNull()
    }
  })

  it('uses the singular and shows 0 when there are none (edge case)', () => {
    mockAgenda.mockReturnValue({ ...base, stats: { ...base.stats, today: 1 } })
    const { unmount } = render(<MemoryRouter><StaffDashboard /></MemoryRouter>)
    expect(screen.getByRole('link', { name: '1 turno hoy' })).toBeInTheDocument()
    unmount()
    mockAgenda.mockReturnValue({ ...base, stats: { ...base.stats, today: 0 } })
    render(<MemoryRouter><StaffDashboard /></MemoryRouter>)
    expect(screen.getByRole('link', { name: '0 turnos hoy' })).toBeInTheDocument()
  })

  it('links the next appointment to its staff detail and hides the professional name', () => {
    mockAgenda.mockReturnValue({
      ...base,
      items: [],
      featured: [{
        id: 'a1',
        startsAt: '2026-11-21T14:00:00Z',
        endsAt: '2026-11-21T15:00:00Z',
        status: 'confirmed',
        customerName: 'Ana Pérez',
        serviceName: 'Belleza de pies',
        staffDisplayName: 'Sil',
      }],
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

  it('has no booking section or public-site link, like the admin Inicio (edge case)', () => {
    for (const roles of [['staff'], ['staff', 'customer']]) {
      mockUseUser.mockReturnValue({ roles, setActiveRole: vi.fn() })
      mockAgenda.mockReturnValue(base)
      const { unmount } = render(
        <MemoryRouter>
          <StaffDashboard />
        </MemoryRouter>,
      )
      expect(screen.queryByText(/pedile a tu administrador/)).toBeNull()
      expect(screen.queryByRole('button', { name: 'Reservar turno' })).toBeNull()
      expect(screen.queryByRole('link', { name: 'Ir al sitio web' })).toBeNull()
      unmount()
    }
  })
})
