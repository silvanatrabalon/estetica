import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthGuard } from '../components/routing/AuthGuard'
import { RoleGuard } from '../components/routing/RoleGuard'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'
import { AdminDashboardPage } from './AdminDashboardPage'
import * as adminDashboardService from '../services/adminDashboard'
import * as adminAppointmentsService from '../services/adminAppointments'
import * as businessSettingsService from '../services/businessSettings'
import type { AdminDashboardStats, StatsByRange } from '../services/adminDashboard'

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockStats: AdminDashboardStats = {
  todayCount: 5,
  weekCount: 20,
  upcomingCount: 11,
  monthCount: 60,
  pendingCount: 3,
  confirmedCount: 10,
  cancelledCount: 4,
  completedCount: 40,
  revenueCentsMonth: 200000,
}

const mockRangeStats: StatsByRange = {
  pendingCount: 2,
  confirmedCount: 6,
  cancelledCount: 1,
  completedCount: 1,
  totalCount: 10,
  revenueCents: 100000,
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(adminDashboardService, 'getStatsByRange').mockResolvedValue(mockRangeStats)
  vi.spyOn(businessSettingsService, 'getBusinessSettings').mockResolvedValue({
    organizationId: 'org-1',
    name: 'Test Org',
    slug: 'test-org',
    timezone: 'America/Argentina/Buenos_Aires',
    logoUrl: null,
    primaryColor: null,
    bookingHeaderText: null,
    bookingSubtitleText: null,
    bookingMinNoticeMinutes: 60,
    bookingMaxHorizonDays: 30,
    weeklyHours: [],
    closures: [],
    readiness: { isReady: true, missing: [] },
  })
  vi.spyOn(adminAppointmentsService, 'adminListAppointments').mockResolvedValue({
    rows: [],
    totalCount: 0,
  })
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderDashboard(role: 'admin' | 'staff' | null) {
  const session =
    role === 'admin'
      ? mockSessions.authenticatedAdmin
      : role === 'staff'
        ? mockSessions.authenticatedStaff
        : null

  const user = session?.user ?? null
  const roles = session ? [role!] : []

  return render(
    <MemoryRouter initialEntries={['/admin/dashboard']}>
      <TestUserProvider
        user={user}
        roles={roles}
        activeRole={role}
        isLoading={false}
      >
        <Routes>
          <Route path="/signin" element={<div>Sign in page</div>} />
          <Route path="/unauthorized" element={<div>Unauthorized page</div>} />

          <Route element={<AuthGuard />}>
            <Route element={<RoleGuard allowedRoles={['admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            </Route>
          </Route>
        </Routes>
      </TestUserProvider>
    </MemoryRouter>,
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AdminDashboardPage — routing', () => {
  it('redirects non-admin to /unauthorized', () => {
    vi.spyOn(adminDashboardService, 'getAdminDashboardStats').mockResolvedValue(mockStats)
    renderDashboard('staff')

    expect(screen.getByText('Unauthorized page')).toBeDefined()
  })

  it('redirects unauthenticated to /signin', () => {
    vi.spyOn(adminDashboardService, 'getAdminDashboardStats').mockResolvedValue(mockStats)
    renderDashboard(null)

    expect(screen.getByText('Sign in page')).toBeDefined()
  })

  it('renders dashboard for admin', async () => {
    vi.spyOn(adminDashboardService, 'getAdminDashboardStats').mockResolvedValue(mockStats)
    renderDashboard('admin')

    // The date is the page heading
    expect(await screen.findByRole('heading', { level: 1 })).toBeDefined()
    expect(await screen.findByRole('link', { name: '5 turnos hoy' })).toBeDefined()
  })
})

describe('AdminDashboardPage — total de hoy', () => {
  it('shows the day total as a compact pill that opens today\'s appointments', async () => {
    vi.spyOn(adminDashboardService, 'getAdminDashboardStats').mockResolvedValue(mockStats)
    renderDashboard('admin')
    const pill = await screen.findByRole('link', { name: '5 turnos hoy' })
    expect(pill).toHaveAttribute('href', '/admin/appointments?periodo=today')
    expect(pill.textContent).toContain('5')
  })

  it('uses the singular for one appointment (edge case)', async () => {
    vi.spyOn(adminDashboardService, 'getAdminDashboardStats').mockResolvedValue({ ...mockStats, todayCount: 1 })
    renderDashboard('admin')
    expect(await screen.findByRole('link', { name: '1 turno hoy' })).toBeDefined()
  })

  it('shows 0 when there is nothing today (edge case)', async () => {
    vi.spyOn(adminDashboardService, 'getAdminDashboardStats').mockResolvedValue({ ...mockStats, todayCount: 0 })
    renderDashboard('admin')
    expect(await screen.findByRole('link', { name: '0 turnos hoy' })).toBeDefined()
  })

  it('has no counter cards anymore', async () => {
    vi.spyOn(adminDashboardService, 'getAdminDashboardStats').mockResolvedValue(mockStats)
    renderDashboard('admin')
    await screen.findByRole('link', { name: '5 turnos hoy' })
    for (const label of ['Próximos turnos', 'Turnos este mes', 'Cancelados este mes', 'Turnos esta semana']) {
      expect(screen.queryByText(label)).toBeNull()
    }
    expect(screen.queryByTestId('stat-card-skeleton')).toBeNull()
  })
})

describe('AdminDashboardPage — content', () => {
  beforeEach(() => {
    vi.spyOn(adminDashboardService, 'getAdminDashboardStats').mockResolvedValue(mockStats)
  })

  it('no longer shows the removed pieces: title, live chip, two cards and the summary block', async () => {
    renderDashboard('admin')

    await screen.findByRole('link', { name: /turnos? hoy/ })
    expect(screen.queryByText('Panel de administración')).toBeNull()
    expect(screen.queryByText('En vivo')).toBeNull()
    expect(screen.queryByText('Confirmados + pendientes hoy')).toBeNull()
    expect(screen.queryByText('Ingresos estimados este mes')).toBeNull()
    expect(screen.queryByText('Resumen de turnos')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Último mes' })).toBeNull()
  })

  it('does not request the range analytics anymore (edge case)', async () => {
    const spy = vi.spyOn(adminDashboardService, 'getStatsByRange').mockResolvedValue(mockRangeStats)
    renderDashboard('admin')

    await screen.findByRole('link', { name: /turnos? hoy/ })
    expect(spy).not.toHaveBeenCalled()
  })

  it('shows today\'s date as the heading in Spanish (edge case)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-21T15:00:00Z'))
    renderDashboard('admin')

    const heading = await screen.findByRole('heading', { level: 1 })
    expect(heading.textContent).toMatch(/^Sábado, 21 de noviembre de 2026$/)
    vi.useRealTimers()
  })

})

describe('AdminDashboardPage — error state', () => {
  it('shows Spanish error message when stats fetch fails', async () => {
    vi.spyOn(adminDashboardService, 'getAdminDashboardStats').mockRejectedValue(
      new Error('RPC error'),
    )
    renderDashboard('admin')

    await waitFor(() => {
      expect(screen.getByText('Ocurrió un error al cargar las estadísticas.')).toBeDefined()
    })
  })
})

describe('AdminDashboardPage — loading state', () => {
  it('shows a placeholder total before stats load (edge case)', () => {
    vi.spyOn(adminDashboardService, 'getAdminDashboardStats').mockReturnValue(new Promise(() => {}))
    renderDashboard('admin')
    expect(screen.getByRole('link', { name: 'Turnos hoy' }).textContent).toContain('–')
  })
})

describe('AdminDashboardPage — today agenda', () => {
  const TODAY_ROW = {
    id: 'a1',
    startsAt: '2026-11-21T13:30:00Z', // 10:30 in Buenos Aires
    endsAt: '2026-11-21T14:30:00Z',
    status: 'confirmed',
    serviceId: 's1',
    serviceName: 'Semi permanentes',
    staffDisplayName: 'Sil',
    customerName: 'Camila Ríos',
    createdAt: '2026-11-01T00:00:00Z',
    totalCount: 1,
  }

  beforeEach(() => {
    vi.spyOn(adminDashboardService, 'getAdminDashboardStats').mockResolvedValue(mockStats)
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-21T13:18:00Z')) // 10:18 in Buenos Aires
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows what is on now or next, and no list of the whole day', async () => {
    vi.spyOn(adminAppointmentsService, 'adminListAppointments').mockResolvedValue({
      rows: [TODAY_ROW],
      totalCount: 1,
    })
    renderDashboard('admin')

    expect(await screen.findByRole('heading', { name: 'Siguiente turno de hoy' })).toBeDefined()
    expect(screen.getByText('en 12 min')).toBeDefined()
    expect(screen.getAllByText('Camila Ríos').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByRole('heading', { name: /^Hoy ·/ })).toBeNull()
    expect(screen.getByRole('link', { name: '5 turnos hoy' })).toHaveAttribute('href', '/admin/appointments?periodo=today')
  })

  it('tells the owner when there is nothing today (edge case)', async () => {
    renderDashboard('admin')
    expect(await screen.findByText('Hoy no tenés turnos.')).toBeDefined()
  })

  it('shows a clear error in the agenda without hiding the numbers (edge case)', async () => {
    vi.spyOn(adminAppointmentsService, 'adminListAppointments').mockRejectedValue(new Error('down'))
    renderDashboard('admin')

    expect(await screen.findByText(/No pudimos cargar los turnos de hoy/)).toBeDefined()
    expect(await screen.findByRole('link', { name: '5 turnos hoy' })).toBeDefined()
  })
})
