import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AdminCalendarPage } from './AdminCalendarPage'

const mockAdminListAppointments = vi.hoisted(() => vi.fn())
vi.mock('../services/adminAppointments', () => ({
  adminListAppointments: (...args: unknown[]) => mockAdminListAppointments(...args),
}))

const mockGetBusinessSettings = vi.hoisted(() => vi.fn())
vi.mock('../services/businessSettings', () => ({
  getBusinessSettings: (...args: unknown[]) => mockGetBusinessSettings(...args),
}))

// Stub TimeAxisWeeklyCalendar to avoid DnD complexity in integration test
vi.mock('../components/appointments/TimeAxisWeeklyCalendar', () => ({
  TimeAxisWeeklyCalendar: ({
    appointments,
    orgTimezone,
  }: {
    appointments: unknown[]
    orgTimezone: string
  }) => (
    <div data-testid="time-axis-weekly-calendar" data-timezone={orgTimezone}>
      {appointments.length === 0 ? 'sin-turnos' : `${appointments.length} turnos`}
    </div>
  ),
}))

// Stub DayView to avoid rendering complexity in integration test
vi.mock('../components/appointments/DayView', () => ({
  DayView: ({
    selectedDate,
    onDayChange,
  }: {
    selectedDate: Date
    onDayChange: (d: Date) => void
  }) => (
    <div data-testid="day-view" data-date={selectedDate.toISOString()}>
      <button
        aria-label="Día anterior"
        onClick={() => onDayChange(new Date(selectedDate.getTime() - 86400000))}
      >
        ‹
      </button>
      <button aria-label="Hoy" onClick={() => onDayChange(new Date())}>
        Hoy
      </button>
      <button
        aria-label="Día siguiente"
        onClick={() => onDayChange(new Date(selectedDate.getTime() + 86400000))}
      >
        ›
      </button>
    </div>
  ),
}))

const defaultBusinessSettings = {
  organizationId: 'org-1',
  name: 'Test Salon',
  slug: 'test-salon',
  timezone: 'America/Argentina/Buenos_Aires',
  logoUrl: null,
  primaryColor: null,
  bookingHeaderText: null,
  bookingSubtitleText: null,
  bookingMinNoticeMinutes: 60,
  bookingMaxHorizonDays: 60,
  weeklyHours: [],
  closures: [],
  readiness: { isReady: false, missing: [] },
}

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
    mockGetBusinessSettings.mockResolvedValue(defaultBusinessSettings)
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

  it('shows empty state when no appointments in week view', async () => {
    mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
    renderPage()
    await screen.findByText('No hay turnos esta semana.')
  })

  it('renders TimeAxisWeeklyCalendar with appointments', async () => {
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
    await screen.findByTestId('time-axis-weekly-calendar')
    expect(screen.getByText('1 turnos')).toBeInTheDocument()
  })

  it('shows error state on fetch failure', async () => {
    mockAdminListAppointments.mockRejectedValue(new Error('DB Error'))
    renderPage()
    await screen.findByText('Ocurrió un error al cargar el calendario.')
  })

  it('view toggle switches between Semana and Día', async () => {
    mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
    renderPage()
    // Default is week view — wait for initial load
    await screen.findByTestId('time-axis-weekly-calendar')
    expect(screen.queryByTestId('day-view')).not.toBeInTheDocument()

    // Switch to day view
    fireEvent.click(screen.getByTestId('view-toggle-day'))
    expect(screen.getByTestId('day-view')).toBeInTheDocument()
    expect(screen.queryByTestId('time-axis-weekly-calendar')).not.toBeInTheDocument()

    // Switch back to week view — switching triggers a new fetch, so await again
    fireEvent.click(screen.getByTestId('view-toggle-week'))
    await screen.findByTestId('time-axis-weekly-calendar')
    expect(screen.queryByTestId('day-view')).not.toBeInTheDocument()
  })

  it('resolves org timezone from business settings', async () => {
    mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
    mockGetBusinessSettings.mockResolvedValue({
      ...defaultBusinessSettings,
      timezone: 'America/New_York',
    })
    renderPage()
    const calendar = await screen.findByTestId('time-axis-weekly-calendar')
    expect(calendar).toHaveAttribute('data-timezone', 'America/New_York')
  })

  it('day view shows DayView component when Día is selected', async () => {
    mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
    renderPage()
    await screen.findByTestId('time-axis-weekly-calendar')

    fireEvent.click(screen.getByTestId('view-toggle-day'))
    expect(screen.getByTestId('day-view')).toBeInTheDocument()
  })
})
