import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AdminCalendarPage } from './AdminCalendarPage'

const mockAdminListAppointments = vi.hoisted(() => vi.fn())
vi.mock('../services/adminAppointments', () => ({
  adminListAppointments: (...args: unknown[]) => mockAdminListAppointments(...args),
}))

// Stub WeeklyCalendar to avoid DnD complexity in integration test
vi.mock('../components/appointments/WeeklyCalendar', () => ({
  WeeklyCalendar: ({ appointments }: { appointments: unknown[] }) => (
    <div data-testid="weekly-calendar">
      {appointments.length === 0 ? 'sin-turnos' : `${appointments.length} turnos`}
    </div>
  ),
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminCalendarPage />
    </MemoryRouter>,
  )
}

describe('AdminCalendarPage', () => {
  beforeEach(() => {
    mockAdminListAppointments.mockReset()
  })

  it('shows loading state initially', () => {
    mockAdminListAppointments.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText('Cargando turnos...')).toBeInTheDocument()
  })

  it('shows page title', async () => {
    mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
    renderPage()
    expect(screen.getByText('Calendario')).toBeInTheDocument()
  })

  it('shows empty state when no appointments', async () => {
    mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
    renderPage()
    await screen.findByText('No hay turnos esta semana.')
  })

  it('renders WeeklyCalendar with appointments', async () => {
    const row = {
      id: 'apt-1',
      startsAt: '2026-05-11T10:00:00Z',
      endsAt: '2026-05-11T10:30:00Z',
      status: 'confirmed',
      serviceId: 'svc-1',
      serviceName: 'Corte',
      staffDisplayName: 'Ana',
      customerName: 'Juan',
      createdAt: '2026-05-01T00:00:00Z',
      totalCount: 1,
    }
    mockAdminListAppointments.mockResolvedValue({ rows: [row], totalCount: 1 })
    renderPage()
    await screen.findByTestId('weekly-calendar')
    expect(screen.getByText('1 turnos')).toBeInTheDocument()
  })

  it('shows error state on fetch failure', async () => {
    mockAdminListAppointments.mockRejectedValue(new Error('DB Error'))
    renderPage()
    await screen.findByText('Ocurrió un error al cargar el calendario.')
  })
})
