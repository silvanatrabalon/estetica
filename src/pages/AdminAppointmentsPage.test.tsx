import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AdminAppointmentsPage } from './AdminAppointmentsPage'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockAdminListAppointments = vi.fn()
const mockGetBusinessSettings = vi.fn()

const mockStaffListAppointments = vi.fn()
vi.mock('../services/adminAppointments', () => ({
  adminListAppointments: (...args: unknown[]) => mockAdminListAppointments(...args),
  staffListAppointments: (...args: unknown[]) => mockStaffListAppointments(...args),
}))

const mockListStaff = vi.fn()
vi.mock('../services/adminStaff', () => ({
  listAdminStaffMembers: (...a: unknown[]) => mockListStaff(...a),
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

function renderStaffPage(url = '/staff/appointments') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <TestUserProvider
        user={mockSessions.authenticatedStaff.user}
        roles={['staff']}
        activeRole="staff"
        isLoading={false}
      >
        <AdminAppointmentsPage mode="staff" />
      </TestUserProvider>
    </MemoryRouter>,
  )
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
    mockListStaff.mockResolvedValue([])
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

  describe('professional filter', () => {
    const staff = [
      { id: 'sm-1', displayName: 'Sil' },
      { id: 'sm-2', displayName: 'Marta' },
    ]

    beforeEach(() => {
      mockListStaff.mockResolvedValue(staff)
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
    })

    it('lists the professionals and filters by the chosen one, back to page 1', async () => {
      renderPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Filtrar por profesional' }))
      expect(screen.getByRole('menuitemradio', { name: 'Todos los profesionales' })).toBeDefined()
      mockAdminListAppointments.mockClear()
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
      fireEvent.click(screen.getByRole('menuitemradio', { name: 'Marta' }))

      await waitFor(() =>
        expect(mockAdminListAppointments).toHaveBeenCalledWith(
          expect.objectContaining({ staffMemberId: 'sm-2' }),
          1,
          PAGE_SIZE,
        ),
      )
      expect(screen.getByRole('button', { name: 'Filtrar por profesional' }).textContent).toContain('Marta')
    })

    it('starts without a professional filter', async () => {
      renderPage()
      await waitFor(() => expect(mockAdminListAppointments).toHaveBeenCalled())
      expect(mockAdminListAppointments.mock.calls[0][0].staffMemberId).toBeUndefined()
    })

    it('"Todos los profesionales" clears the filter (edge case)', async () => {
      renderPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Filtrar por profesional' }))
      fireEvent.click(screen.getByRole('menuitemradio', { name: 'Sil' }))
      await waitFor(() =>
        expect(mockAdminListAppointments).toHaveBeenLastCalledWith(expect.objectContaining({ staffMemberId: 'sm-1' }), 1, PAGE_SIZE),
      )
      fireEvent.click(screen.getByRole('button', { name: 'Filtrar por profesional' }))
      fireEvent.click(screen.getByRole('menuitemradio', { name: 'Todos los profesionales' }))
      await waitFor(() =>
        expect(mockAdminListAppointments).toHaveBeenLastCalledWith(expect.objectContaining({ staffMemberId: undefined }), 1, PAGE_SIZE),
      )
    })

    it('combines with the other filters (edge case)', async () => {
      renderPage('/admin/appointments?periodo=month&estado=cancelled')
      fireEvent.click(await screen.findByRole('button', { name: 'Filtrar por profesional' }))
      fireEvent.click(screen.getByRole('menuitemradio', { name: 'Sil' }))
      await waitFor(() =>
        expect(mockAdminListAppointments).toHaveBeenLastCalledWith(
          expect.objectContaining({ staffMemberId: 'sm-1', statuses: ['cancelled'] }),
          1,
          PAGE_SIZE,
        ),
      )
    })

    it('hides the filter when there are no professionals or they cannot be loaded (edge case)', async () => {
      mockListStaff.mockRejectedValue(new Error('down'))
      renderPage()
      await screen.findByRole('button', { name: 'Filtrar por período' })
      expect(screen.queryByRole('button', { name: 'Filtrar por profesional' })).toBeNull()
    })
  })

  describe('search by client', () => {
    beforeEach(() => {
      mockListStaff.mockResolvedValue([])
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
    })

    it('has a search box and starts without a search', async () => {
      renderPage()
      expect(await screen.findByLabelText('Buscar cliente')).toBeDefined()
      await waitFor(() => expect(mockAdminListAppointments).toHaveBeenCalled())
      expect(mockAdminListAppointments.mock.calls[0][0].search).toBeUndefined()
    })

    it('searches what was typed, trimmed, and goes back to page 1', async () => {
      renderPage()
      const box = await screen.findByLabelText('Buscar cliente')
      mockAdminListAppointments.mockClear()
      fireEvent.change(box, { target: { value: '  sofia ' } })

      await waitFor(
        () =>
          expect(mockAdminListAppointments).toHaveBeenLastCalledWith(
            expect.objectContaining({ search: 'sofia' }),
            1,
            PAGE_SIZE,
          ),
        { timeout: 2000 },
      )
    })

    it('waits for a pause in typing before asking the server (edge case)', async () => {
      renderPage()
      const box = await screen.findByLabelText('Buscar cliente')
      await waitFor(() => expect(mockAdminListAppointments).toHaveBeenCalled())
      mockAdminListAppointments.mockClear()

      fireEvent.change(box, { target: { value: 's' } })
      fireEvent.change(box, { target: { value: 'so' } })
      fireEvent.change(box, { target: { value: 'sof' } })
      await new Promise((r) => setTimeout(r, 100))
      expect(mockAdminListAppointments).not.toHaveBeenCalled()

      await waitFor(() => expect(mockAdminListAppointments).toHaveBeenCalledTimes(1), { timeout: 2000 })
      expect(mockAdminListAppointments.mock.calls[0][0].search).toBe('sof')
    })

    it('clearing the box lists everything again', async () => {
      renderPage()
      const box = await screen.findByLabelText('Buscar cliente')
      fireEvent.change(box, { target: { value: 'laura' } })
      await waitFor(() => expect(mockAdminListAppointments).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'laura' }), 1, PAGE_SIZE), { timeout: 2000 })
      fireEvent.change(box, { target: { value: '' } })
      await waitFor(
        () => expect(mockAdminListAppointments).toHaveBeenLastCalledWith(expect.objectContaining({ search: undefined }), 1, PAGE_SIZE),
        { timeout: 2000 },
      )
    })

    it('a blank search is the same as no search (edge case)', async () => {
      renderPage()
      const box = await screen.findByLabelText('Buscar cliente')
      await waitFor(() => expect(mockAdminListAppointments).toHaveBeenCalled())
      mockAdminListAppointments.mockClear()
      fireEvent.change(box, { target: { value: '   ' } })
      await new Promise((r) => setTimeout(r, 500))
      expect(mockAdminListAppointments).not.toHaveBeenCalled()
    })

    it('says what was searched when nothing matches (edge case)', async () => {
      renderPage()
      fireEvent.change(await screen.findByLabelText('Buscar cliente'), { target: { value: 'zzz' } })
      expect(await screen.findByText(/No encontramos turnos para “zzz”/, undefined, { timeout: 2000 })).toBeDefined()
    })

    it('combines with the period and the professional (edge case)', async () => {
      mockListStaff.mockResolvedValue([{ id: 'sm-1', displayName: 'Sil' }])
      renderPage('/admin/appointments?periodo=past')
      fireEvent.click(await screen.findByRole('button', { name: 'Filtrar por profesional' }))
      fireEvent.click(screen.getByRole('menuitemradio', { name: 'Sil' }))
      fireEvent.change(screen.getByLabelText('Buscar cliente'), { target: { value: 'ana' } })
      await waitFor(
        () =>
          expect(mockAdminListAppointments).toHaveBeenLastCalledWith(
            expect.objectContaining({ staffMemberId: 'sm-1', search: 'ana' }),
            1,
            PAGE_SIZE,
          ),
        { timeout: 2000 },
      )
      expect(mockAdminListAppointments.mock.calls.at(-1)![0].dateTo).toBeDefined()
    })
  })

  describe('Próximos and Historial', () => {
    beforeEach(() => {
      mockListStaff.mockResolvedValue([])
      mockAdminListAppointments.mockResolvedValue({ rows: [], totalCount: 0 })
    })

    it('offers Próximos and Historial in the period menu', async () => {
      renderPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Filtrar por período' }))
      expect(screen.getByRole('menuitemradio', { name: 'Próximos' })).toBeDefined()
      expect(screen.getByRole('menuitemradio', { name: 'Historial' })).toBeDefined()
    })

    it('Historial asks for everything up to now, most recent first', async () => {
      renderPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Filtrar por período' }))
      fireEvent.click(screen.getByRole('menuitemradio', { name: 'Historial' }))
      await waitFor(() => {
        const filters = mockAdminListAppointments.mock.calls.at(-1)![0]
        expect(filters.dateFrom).toBeUndefined()
        expect(new Date(filters.dateTo).getTime()).toBeLessThanOrEqual(Date.now() + 1000)
        expect(filters.ascending).toBe(false)
      })
      expect(screen.getByRole('button', { name: 'Filtrar por período' }).textContent).toContain('Historial')
    })

    it('Próximos asks from now on, soonest first', async () => {
      renderPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Filtrar por período' }))
      fireEvent.click(screen.getByRole('menuitemradio', { name: 'Próximos' }))
      await waitFor(() => {
        const filters = mockAdminListAppointments.mock.calls.at(-1)![0]
        expect(filters.dateTo).toBeUndefined()
        expect(new Date(filters.dateFrom).getTime()).toBeGreaterThan(Date.now() - 5000)
        expect(filters.ascending).toBe(true)
      })
    })

    it('can be opened from a link with ?periodo=past (edge case)', async () => {
      renderPage('/admin/appointments?periodo=past')
      await waitFor(() => expect(mockAdminListAppointments).toHaveBeenCalled())
      expect(mockAdminListAppointments.mock.calls[0][0].dateTo).toBeDefined()
      expect(screen.getByRole('button', { name: 'Filtrar por período' }).textContent).toContain('Historial')
    })
  })
})

describe('AdminAppointmentsPage — staff mode (own appointments only)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetBusinessSettings.mockResolvedValue({ timezone: 'UTC' })
    mockStaffListAppointments.mockResolvedValue({ rows: [makeRow()], totalCount: 1 })
    mockListStaff.mockResolvedValue([{ id: 'sm-1', displayName: 'Sil' }])
  })

  it('loads from the staff list, not the admin list, with the same title and filters', async () => {
    renderStaffPage()
    expect(await screen.findByRole('heading', { name: 'Turnos' })).toBeInTheDocument()
    await waitFor(() => expect(mockStaffListAppointments).toHaveBeenCalled())
    expect(mockAdminListAppointments).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Buscar cliente')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filtrar por período' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filtrar por estado' })).toBeInTheDocument()
  })

  it('has no professional filter and never asks for the professionals (edge case)', async () => {
    renderStaffPage()
    await screen.findByText('Juan Pérez')
    expect(screen.queryByRole('button', { name: 'Filtrar por profesional' })).toBeNull()
    expect(mockListStaff).not.toHaveBeenCalled()
    expect(mockStaffListAppointments.mock.calls[0][0].staffMemberId).toBeUndefined()
  })

  it('cards link to the staff detail and do not repeat the professional', async () => {
    renderStaffPage()
    const link = (await screen.findByText('Juan Pérez')).closest('a')!
    expect(link).toHaveAttribute('href', '/staff/appointments/appt-1')
    expect(link.textContent).toContain('Corte de cabello')
    expect(link.textContent).not.toContain('María López')
  })

  it('search, Historial and ?periodo= work the same way (edge case)', async () => {
    renderStaffPage('/staff/appointments?periodo=past')
    await waitFor(() => expect(mockStaffListAppointments).toHaveBeenCalled())
    expect(mockStaffListAppointments.mock.calls[0][0].dateTo).toBeDefined()
    fireEvent.change(screen.getByLabelText('Buscar cliente'), { target: { value: 'ana' } })
    await waitFor(
      () => expect(mockStaffListAppointments).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'ana' }), 1, PAGE_SIZE),
      { timeout: 2000 },
    )
  })

  it('shows the error state when the staff list fails (edge case)', async () => {
    mockStaffListAppointments.mockRejectedValue(new Error('STAFF_NOT_AUTHORIZED'))
    renderStaffPage()
    expect(await screen.findByText('Ocurrió un error al cargar los turnos.')).toBeInTheDocument()
  })
})
