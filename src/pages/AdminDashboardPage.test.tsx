import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthGuard } from '../components/routing/AuthGuard'
import { RoleGuard } from '../components/routing/RoleGuard'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'
import { AdminDashboardPage } from './AdminDashboardPage'
import * as adminDashboardService from '../services/adminDashboard'
import * as adminAppointmentsService from '../services/adminAppointments'
import * as businessSettingsService from '../services/businessSettings'
import type { AdminDashboardStats } from '../services/adminDashboard'

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockStats: AdminDashboardStats = {
  todayCount: 5,
  weekCount: 20,
  monthCount: 60,
  pendingCount: 3,
  confirmedCount: 10,
  cancelledCount: 4,
  completedCount: 40,
  noShowCount: 3,
  revenueCentsMonth: 200000,
}

beforeEach(() => {
  vi.restoreAllMocks()
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

  it('renders quick-access cards with correct links', async () => {
    renderDashboard('admin')

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Turnos' })).toBeDefined()
      expect(screen.getByRole('link', { name: 'Calendario' })).toBeDefined()
      expect(screen.getByRole('link', { name: 'Profesionales' })).toBeDefined()
      expect(screen.getByRole('link', { name: 'Servicios' })).toBeDefined()
    })
  })

  it('renders "Ver todos los turnos" CTA linking to /admin/appointments', async () => {
    renderDashboard('admin')

    await waitFor(() => {
      const cta = screen.getByRole('link', { name: 'Ver todos los turnos' })
      expect(cta).toBeDefined()
      expect(cta.getAttribute('href')).toBe('/admin/appointments')
    })
  })

  it('renders "No hay turnos para hoy." when today list is empty', async () => {
    renderDashboard('admin')

    await waitFor(() => {
      expect(screen.getByText('No hay turnos para hoy.')).toBeDefined()
    })
  })

  it('renders analytics table with status rows', async () => {
    renderDashboard('admin')

    await waitFor(() => {
      expect(screen.getByText('Confirmado')).toBeDefined()
      expect(screen.getByText('Pendiente')).toBeDefined()
      expect(screen.getByText('Cancelado')).toBeDefined()
      expect(screen.getByText('Completado')).toBeDefined()
      expect(screen.getByText('No presentado')).toBeDefined()
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
