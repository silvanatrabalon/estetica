import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AdminAppointmentsPage } from './AdminAppointmentsPage'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockAdminListAppointments = vi.fn()
const mockGetBusinessSettings = vi.fn()

vi.mock('../services/adminAppointments', () => ({
  adminListAppointments: (...args: unknown[]) => mockAdminListAppointments(...args),
}))

vi.mock('../services/businessSettings', () => ({
  getBusinessSettings: (...args: unknown[]) => mockGetBusinessSettings(...args),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'appt-1',
    startsAt: '2026-06-10T14:00:00Z',
    endsAt: '2026-06-10T15:00:00Z',
    status: 'confirmed',
    serviceName: 'Corte de cabello',
    staffDisplayName: 'María López',
    customerName: 'Juan Pérez',
    createdAt: '2026-05-01T10:00:00Z',
    totalCount: 1,
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <TestUserProvider
        user={mockSessions.authenticatedAdmin.user}
        roles={['admin']}
        activeRole="admin"
        isLoading={false}
      >
        <AdminAppointmentsPage />
      </TestUserProvider>
    </MemoryRouter>,
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AdminAppointmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetBusinessSettings.mockResolvedValue({ timezone: 'UTC' })
  })

  describe('loading state', () => {
    it('shows Spanish loading text', async () => {
      mockAdminListAppointments.mockReturnValue(new Promise(() => {})) // never resolves
      renderPage()
      expect(screen.getByText('Cargando turnos...')).toBeDefined()
    })
  })

  describe('error state', () => {
    it('shows Spanish error text when service throws', async () => {
      mockAdminListAppointments.mockRejectedValue(new Error('ADMIN_NOT_AUTHORIZED'))
      renderPage()
      await waitFor(() => {
        expect(screen.getByText('Ocurrió un error al cargar los turnos.')).toBeDefined()
      })
    })
  })

  describe('empty state', () => {
    it('shows Spanish empty text when no rows', async () => {
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
      renderPage()
      await waitFor(() => {
        expect(
          screen.getByText('No hay turnos que coincidan con los filtros.'),
        ).toBeDefined()
      })
    })
  })

  describe('table rendering', () => {
    it('renders rows with correct column values', async () => {
      mockAdminListAppointments.mockResolvedValue({
        rows: [makeRow()],
        totalCount: 1,
      })
      renderPage()
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeDefined()
        expect(screen.getByText('Corte de cabello')).toBeDefined()
        expect(screen.getByText('María López')).toBeDefined()
        // Status badge — "Confirmado" also appears in the filter chip, so use getAllByText
        expect(screen.getAllByText('Confirmado').length).toBeGreaterThanOrEqual(2)
      })
    })

    it('renders column headers', async () => {
      mockAdminListAppointments.mockResolvedValue({ rows: [makeRow()], totalCount: 1 })
      renderPage()
      await waitFor(() => {
        expect(screen.getByText('Cliente')).toBeDefined()
        expect(screen.getByText('Servicio')).toBeDefined()
        expect(screen.getByText('Profesional')).toBeDefined()
        expect(screen.getByText('Fecha/hora')).toBeDefined()
        expect(screen.getByText('Estado')).toBeDefined()
      })
    })
  })

  describe('status filter chips', () => {
    it('clicking a status chip calls service with updated statuses and resets to page 1', async () => {
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Cancelado')).toBeDefined()
      })

      // Clear mock calls so far (initial load)
      mockAdminListAppointments.mockClear()
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })

      const chip = screen.getByRole('button', { name: 'Cancelado' })
      fireEvent.click(chip)

      await waitFor(() => {
        expect(mockAdminListAppointments).toHaveBeenCalledWith(
          expect.objectContaining({ statuses: ['cancelled'] }),
          1, // page reset to 1
          PAGE_SIZE,
        )
      })
    })
  })

  describe('date range inputs', () => {
    it('changing Desde input calls service with updated dateFrom and resets to page 1', async () => {
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
      renderPage()

      await waitFor(() => {
        expect(screen.getByLabelText('Desde')).toBeDefined()
      })

      mockAdminListAppointments.mockClear()
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })

      const desdeInput = screen.getByLabelText('Desde')
      fireEvent.change(desdeInput, { target: { value: '2026-06-01' } })

      await waitFor(() => {
        expect(mockAdminListAppointments).toHaveBeenCalledWith(
          expect.objectContaining({ dateFrom: '2026-06-01' }),
          1,
          PAGE_SIZE,
        )
      })
    })

    it('changing Hasta input calls service with updated dateTo and resets to page 1', async () => {
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
      renderPage()

      await waitFor(() => {
        expect(screen.getByLabelText('Hasta')).toBeDefined()
      })

      mockAdminListAppointments.mockClear()
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })

      const hastaInput = screen.getByLabelText('Hasta')
      fireEvent.change(hastaInput, { target: { value: '2026-06-30' } })

      await waitFor(() => {
        expect(mockAdminListAppointments).toHaveBeenCalledWith(
          expect.objectContaining({ dateTo: '2026-06-30' }),
          1,
          PAGE_SIZE,
        )
      })
    })
  })

  describe('pagination', () => {
    it('previous button is disabled on page 1', async () => {
      mockAdminListAppointments.mockResolvedValue({ rows: [makeRow()], totalCount: 1 })
      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Anterior' })).toBeDefined()
      })

      const prev = screen.getByRole('button', { name: 'Anterior' })
      expect(prev).toHaveProperty('disabled', true)
    })

    it('next button is disabled when on last page', async () => {
      mockAdminListAppointments.mockResolvedValue({
        rows: [makeRow({ totalCount: 1 })],
        totalCount: 1,
      })
      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDefined()
      })

      const next = screen.getByRole('button', { name: 'Siguiente' })
      expect(next).toHaveProperty('disabled', true)
    })

    it('clicking next page calls service with incremented page', async () => {
      // 51 items → 2 pages with PAGE_SIZE=50; next should be enabled
      const rows = Array.from({ length: 50 }, (_, i) =>
        makeRow({ id: `appt-${i}`, totalCount: 51 }),
      )
      mockAdminListAppointments.mockResolvedValue({ rows, totalCount: 51 })
      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDefined()
      })

      mockAdminListAppointments.mockClear()
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 51 })

      const next = screen.getByRole('button', { name: 'Siguiente' })
      expect(next).toHaveProperty('disabled', false)
      fireEvent.click(next)

      await waitFor(() => {
        expect(mockAdminListAppointments).toHaveBeenCalledWith(
          expect.anything(),
          2,
          PAGE_SIZE,
        )
      })
    })
  })
})
