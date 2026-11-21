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

    await waitFor(() => {
      expect(screen.getByText('Panel de administración')).toBeDefined()
    })
  })
})

describe('AdminDashboardPage — content', () => {
  beforeEach(() => {
    vi.spyOn(adminDashboardService, 'getAdminDashboardStats').mockResolvedValue(mockStats)
  })

  it('renders KPI card labels', async () => {
    renderDashboard('admin')

    await waitFor(() => {
      expect(screen.getByText('Turnos hoy')).toBeDefined()
      expect(screen.getByText('Turnos esta semana')).toBeDefined()
      expect(screen.getByText('Turnos este mes')).toBeDefined()
      expect(screen.getByText('Confirmados + pendientes hoy')).toBeDefined()
      expect(screen.getByText('Ingresos estimados este mes')).toBeDefined()
    })
  })

  it('renders the Cancelados KPI card and no longer renders "No presentado"', async () => {
    renderDashboard('admin')

    await waitFor(() => {
      expect(screen.getByText('Cancelados')).toBeDefined()
    })
    expect(screen.queryByText('No presentado')).toBeNull()
  })

  it('renders analytics table with status rows and total', async () => {
    renderDashboard('admin')

    await waitFor(() => {
      expect(screen.getByText('Confirmado')).toBeDefined()
      expect(screen.getByText('Pendiente')).toBeDefined()
      expect(screen.getByText('Cancelado')).toBeDefined()
      expect(screen.getByText('Completado')).toBeDefined()
      expect(screen.getByText('Total de turnos')).toBeDefined()
    })
    expect(screen.queryByText('No presentado')).toBeNull()
  })

  it('shows 0 total and 0% for every status when the range has no appointments (edge case)', async () => {
    vi.spyOn(adminDashboardService, 'getStatsByRange').mockResolvedValue({
      pendingCount: 0,
      confirmedCount: 0,
      cancelledCount: 0,
      completedCount: 0,
      totalCount: 0,
      revenueCents: 0,
    })
    renderDashboard('admin')

    await waitFor(() => {
      expect(screen.getAllByText('0%')).toHaveLength(4)
    })
  })

  it('requests analytics again when another range preset is selected', async () => {
    const spy = vi.spyOn(adminDashboardService, 'getStatsByRange').mockResolvedValue(mockRangeStats)
    renderDashboard('admin')

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1))
    fireEvent.click(screen.getByRole('button', { name: 'Hoy' }))

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2))
    const [from, to] = spy.mock.calls[1]
    expect(from).toBe(to)
  })

  it('shows the analytics error message when the range request fails (edge case)', async () => {
    vi.spyOn(adminDashboardService, 'getStatsByRange').mockRejectedValue(new Error('boom'))
    renderDashboard('admin')

    await waitFor(() => {
      expect(screen.getByText('Error al cargar las analíticas. Intentá nuevamente.')).toBeDefined()
    })
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
  it('shows loading skeletons before stats load', () => {
    vi.spyOn(adminDashboardService, 'getAdminDashboardStats').mockReturnValue(
      new Promise(() => {}),
    )
    renderDashboard('admin')

    const skeletons = screen.getAllByTestId('stat-card-skeleton')
    expect(skeletons.length).toBeGreaterThanOrEqual(5)
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

  it('shows the next appointment first, then the day', async () => {
    vi.spyOn(adminAppointmentsService, 'adminListAppointments').mockResolvedValue({
      rows: [TODAY_ROW],
      totalCount: 1,
    })
    renderDashboard('admin')

    expect(await screen.findByRole('heading', { name: 'Próximo turno' })).toBeDefined()
    expect(screen.getByText('en 12 min')).toBeDefined()
    expect(screen.getAllByText('Camila Ríos').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('heading', { name: 'Hoy · 1 turno' })).toBeDefined()
  })

  it('tells the owner when there is nothing today (edge case)', async () => {
    renderDashboard('admin')
    expect(await screen.findByText('Hoy no tenés turnos.')).toBeDefined()
  })

  it('shows a clear error in the agenda without hiding the numbers (edge case)', async () => {
    vi.spyOn(adminAppointmentsService, 'adminListAppointments').mockRejectedValue(new Error('down'))
    renderDashboard('admin')

    expect(await screen.findByText(/No pudimos cargar los turnos de hoy/)).toBeDefined()
    expect(screen.getByText('Turnos hoy')).toBeDefined()
  })
})
