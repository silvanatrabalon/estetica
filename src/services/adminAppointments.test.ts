import { beforeEach, describe, expect, it, vi } from 'vitest'
import { adminListAppointments } from './adminAppointments'

// ── Mock Supabase ────────────────────────────────────────────────────────────

const mockRpc = vi.fn()

vi.mock('../lib/supabase', () => ({
  initSupabase: () => ({
    rpc: mockRpc,
  }),
}))

// ── Fixtures ─────────────────────────────────────────────────────────────────

const mockRow = {
  id: 'appt-uuid-1',
  starts_at: '2026-06-10T14:00:00Z',
  ends_at: '2026-06-10T15:00:00Z',
  status: 'confirmed',
  service_name: 'Corte de cabello',
  staff_display_name: 'María López',
  customer_name: 'Juan Pérez',
  created_at: '2026-05-01T10:00:00Z',
  total_count: 5,
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('adminListAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('camelCase mapping', () => {
    it('maps RPC snake_case response to AdminAppointmentPage with correct camelCase fields', async () => {
      mockRpc.mockResolvedValueOnce({ data: [mockRow], error: null })

      const result = await adminListAppointments({}, 1)

      expect(result.rows).toHaveLength(1)
      expect(result.rows[0]).toEqual({
        id: 'appt-uuid-1',
        startsAt: '2026-06-10T14:00:00Z',
        endsAt: '2026-06-10T15:00:00Z',
        status: 'confirmed',
        serviceName: 'Corte de cabello',
        staffDisplayName: 'María López',
        customerName: 'Juan Pérez',
        createdAt: '2026-05-01T10:00:00Z',
        totalCount: 5,
      })
    })
  })

  describe('totalCount derivation', () => {
    it('derives totalCount from rows[0].total_count when rows are non-empty', async () => {
      mockRpc.mockResolvedValueOnce({ data: [mockRow], error: null })

      const result = await adminListAppointments({}, 1)

      expect(result.totalCount).toBe(5)
    })

    it('returns totalCount of 0 when response is empty', async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null })

      const result = await adminListAppointments({}, 1)

      expect(result.totalCount).toBe(0)
      expect(result.rows).toHaveLength(0)
    })

    it('returns totalCount of 0 when data is null', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: null })

      const result = await adminListAppointments({}, 1)

      expect(result.totalCount).toBe(0)
    })
  })

  describe('filter param passing', () => {
    it('passes statuses as p_statuses when provided', async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null })

      await adminListAppointments({ statuses: ['cancelled', 'pending'] }, 1)

      expect(mockRpc).toHaveBeenCalledWith(
        'admin_list_appointments',
        expect.objectContaining({ p_statuses: ['cancelled', 'pending'] }),
      )
    })

    it('passes null for p_statuses when statuses is empty', async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null })

      await adminListAppointments({ statuses: [] }, 1)

      expect(mockRpc).toHaveBeenCalledWith(
        'admin_list_appointments',
        expect.objectContaining({ p_statuses: null }),
      )
    })

    it('passes null for p_statuses when statuses is not provided', async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null })

      await adminListAppointments({}, 1)

      expect(mockRpc).toHaveBeenCalledWith(
        'admin_list_appointments',
        expect.objectContaining({ p_statuses: null }),
      )
    })

    it('passes dateFrom as ISO string when provided', async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null })

      await adminListAppointments({ dateFrom: '2026-06-01' }, 1)

      const call = mockRpc.mock.calls[0][1]
      expect(call.p_date_from).toBeTruthy()
      expect(typeof call.p_date_from).toBe('string')
    })

    it('passes null for p_date_from when dateFrom is not provided', async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null })

      await adminListAppointments({}, 1)

      expect(mockRpc).toHaveBeenCalledWith(
        'admin_list_appointments',
        expect.objectContaining({ p_date_from: null }),
      )
    })

    it('passes dateTo as ISO string when provided', async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null })

      await adminListAppointments({ dateTo: '2026-06-30' }, 1)

      const call = mockRpc.mock.calls[0][1]
      expect(call.p_date_to).toBeTruthy()
      expect(typeof call.p_date_to).toBe('string')
    })

    it('passes null for p_date_to when dateTo is not provided', async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null })

      await adminListAppointments({}, 1)

      expect(mockRpc).toHaveBeenCalledWith(
        'admin_list_appointments',
        expect.objectContaining({ p_date_to: null }),
      )
    })

    it('passes page as p_page', async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null })

      await adminListAppointments({}, 3)

      expect(mockRpc).toHaveBeenCalledWith(
        'admin_list_appointments',
        expect.objectContaining({ p_page: 3 }),
      )
    })

    it('passes pageSize as p_page_size when provided', async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null })

      await adminListAppointments({}, 1, 10)

      expect(mockRpc).toHaveBeenCalledWith(
        'admin_list_appointments',
        expect.objectContaining({ p_page_size: 10 }),
      )
    })

    it('passes null for p_page_size when pageSize is not provided', async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null })

      await adminListAppointments({}, 1)

      expect(mockRpc).toHaveBeenCalledWith(
        'admin_list_appointments',
        expect.objectContaining({ p_page_size: null }),
      )
    })
  })

  describe('error handling', () => {
    it('throws an error when RPC returns an error', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'ADMIN_NOT_AUTHORIZED' } })

      await expect(adminListAppointments({}, 1)).rejects.toThrow('ADMIN_NOT_AUTHORIZED')
    })
  })
})
