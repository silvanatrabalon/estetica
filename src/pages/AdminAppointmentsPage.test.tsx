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

function renderPage(url = '/admin/appointments') {
  return render(
    <MemoryRouter initialEntries={[url]}>
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
        expect(screen.getByText('Corte de cabello · María López')).toBeDefined()
        // Status badge — "Confirmado" also appears in the filter chip, so use getAllByText
        expect(screen.getByText('Confirmado')).toBeDefined()
      })
    })

    it('each card links to the appointment detail', async () => {
      mockAdminListAppointments.mockResolvedValue({ rows: [makeRow()], totalCount: 1 })
      renderPage()
      const link = await screen.findByRole('link', { name: /Juan Pérez/ })
      expect(link.getAttribute('href')).toBe('/admin/appointments/' + makeRow().id)
    })
  })

  describe('status filter', () => {
    async function pickStatus(label: string) {
      fireEvent.click(await screen.findByRole('button', { name: 'Filtrar por estado' }))
      fireEvent.click(screen.getByRole('menuitemradio', { name: new RegExp(label) }))
    }

    it('selecting a status calls service with updated statuses and resets to page 1', async () => {
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
      renderPage()
      await screen.findByRole('button', { name: 'Filtrar por estado' })
      mockAdminListAppointments.mockClear()
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })

      await pickStatus('Cancelado')

      await waitFor(() => {
        expect(mockAdminListAppointments).toHaveBeenCalledWith(
          expect.objectContaining({ statuses: ['cancelled'] }),
          1,
          PAGE_SIZE,
        )
      })
    })

    it('selecting "Todos los estados" clears the status filter (edge case)', async () => {
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
      renderPage()

      await pickStatus('Confirmado')
      await waitFor(() => {
        expect(mockAdminListAppointments).toHaveBeenLastCalledWith(
          expect.objectContaining({ statuses: ['confirmed'] }),
          1,
          PAGE_SIZE,
        )
      })

      await pickStatus('Todos los estados')
      await waitFor(() => {
        expect(mockAdminListAppointments).toHaveBeenLastCalledWith(
          expect.objectContaining({ statuses: undefined }),
          1,
          PAGE_SIZE,
        )
      })
    })

    it('does not offer "Pendiente" (edge case)', async () => {
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
      renderPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Filtrar por estado' }))
      expect(screen.queryByRole('menuitemradio', { name: 'Pendiente' })).toBeNull()
    })

    it('still renders an existing pending appointment (edge case)', async () => {
      mockAdminListAppointments.mockResolvedValue({ rows: [makeRow({ status: 'pending' })], totalCount: 1 })
      renderPage()
      expect(await screen.findByText('Pendiente')).toBeDefined()
    })

    it('does not offer the removed "No asistió" option (edge case)', async () => {
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
      renderPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Filtrar por estado' }))
      expect(screen.queryByRole('menuitemradio', { name: 'No asistió' })).toBeNull()
    })
  })

  describe('period filter', () => {
    it('starts on "Hoy" with all statuses by default', async () => {
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
      renderPage()
      await waitFor(() => expect(mockAdminListAppointments).toHaveBeenCalled())
      const filters = mockAdminListAppointments.mock.calls[0][0]
      expect(new Date(filters.dateTo).getTime() - new Date(filters.dateFrom).getTime()).toBe(86399999)
      expect(filters.statuses).toBeUndefined()
      expect(screen.getByRole('button', { name: 'Filtrar por período' }).textContent).toContain('Hoy')
    })

    it('reads period and status from the URL (coming from Inicio)', async () => {
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
      renderPage('/admin/appointments?periodo=month&estado=cancelled')
      await waitFor(() => expect(mockAdminListAppointments).toHaveBeenCalled())
      const filters = mockAdminListAppointments.mock.calls[0][0]
      expect(filters.statuses).toEqual(['cancelled'])
      expect(new Date(filters.dateTo).getTime() - new Date(filters.dateFrom).getTime()).toBeGreaterThan(27 * 86400000)
      expect(screen.getByRole('button', { name: 'Filtrar por período' }).textContent).toContain('Este mes')
    })

    it('"periodo=all" shows everything without bounds', async () => {
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
      renderPage('/admin/appointments?periodo=all')
      await waitFor(() => expect(mockAdminListAppointments).toHaveBeenCalled())
      expect(mockAdminListAppointments.mock.calls[0][0].dateFrom).toBeUndefined()
    })

    it('ignores invalid URL values and falls back to defaults (edge case)', async () => {
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
      renderPage('/admin/appointments?periodo=zzz&estado=hacked')
      await waitFor(() => expect(mockAdminListAppointments).toHaveBeenCalled())
      const filters = mockAdminListAppointments.mock.calls[0][0]
      expect(filters.statuses).toBeUndefined()
      expect(filters.dateFrom).toBeDefined()
      expect(screen.getByRole('button', { name: 'Filtrar por período' }).textContent).toContain('Hoy')
    })

    it('choosing "Esta semana" sends a 7-day range and resets to page 1', async () => {
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
      renderPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Filtrar por período' }))
      mockAdminListAppointments.mockClear()
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
      fireEvent.click(screen.getByRole('menuitemradio', { name: 'Esta semana' }))

      await waitFor(() => expect(mockAdminListAppointments).toHaveBeenCalled())
      const [filters, page] = mockAdminListAppointments.mock.calls[0]
      expect(page).toBe(1)
      const from = new Date(filters.dateFrom).getTime()
      const to = new Date(filters.dateTo).getTime()
      expect(to - from).toBeGreaterThan(6 * 86400000)
      expect(to - from).toBeLessThan(8 * 86400000)
    })

    it('choosing "Todos" again removes the bounds (edge case)', async () => {
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
      renderPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Filtrar por período' }))
      fireEvent.click(screen.getByRole('menuitemradio', { name: 'Este mes' }))
      fireEvent.click(await screen.findByRole('button', { name: 'Filtrar por período' }))
      fireEvent.click(screen.getByRole('menuitemradio', { name: 'Todos' }))
      await waitFor(() => {
        const filters = mockAdminListAppointments.mock.calls.at(-1)![0]
        expect(filters.dateFrom).toBeUndefined()
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
