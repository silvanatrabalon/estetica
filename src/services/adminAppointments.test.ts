import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  adminListAppointments,
  adminUpdateAppointment,
  getAdminAppointment,
  staffListAppointments,
  translateAdminUpdateError,
} from './adminAppointments'

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

describe('adminListAppointments professional filter', () => {
  beforeEach(() => mockRpc.mockReset())

  it('sends the professional id, or null for everyone', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })
    await adminListAppointments({ staffMemberId: 'sm-1' }, 1, 50)
    expect(mockRpc).toHaveBeenLastCalledWith('admin_list_appointments', expect.objectContaining({ p_staff_member_id: 'sm-1' }))
    await adminListAppointments({}, 1, 50)
    expect(mockRpc).toHaveBeenLastCalledWith('admin_list_appointments', expect.objectContaining({ p_staff_member_id: null }))
  })
})

describe('adminListAppointments search and order', () => {
  beforeEach(() => mockRpc.mockReset())

  it('sends the trimmed search and the order', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })
    await adminListAppointments({ search: '  sofía ', ascending: true }, 1, 50)
    expect(mockRpc).toHaveBeenLastCalledWith(
      'admin_list_appointments',
      expect.objectContaining({ p_search: 'sofía', p_ascending: true }),
    )
  })

  it('defaults to no search and most recent first (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })
    await adminListAppointments({ search: '   ' }, 1, 50)
    expect(mockRpc).toHaveBeenLastCalledWith(
      'admin_list_appointments',
      expect.objectContaining({ p_search: null, p_ascending: false }),
    )
  })
})

describe('staffListAppointments', () => {
  beforeEach(() => mockRpc.mockReset())

  it('calls staff_list_appointments with the filters and no professional id', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })
    await staffListAppointments({ search: ' ana ', ascending: true, statuses: ['confirmed'] }, 2, 50)
    expect(mockRpc).toHaveBeenCalledWith('staff_list_appointments', {
      p_statuses: ['confirmed'],
      p_date_from: null,
      p_date_to: null,
      p_page: 2,
      p_page_size: 50,
      p_search: 'ana',
      p_ascending: true,
    })
  })

  it('maps rows and the total, and is empty without rows (edge case)', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [{ id: 'a', starts_at: 's', ends_at: 'e', status: 'confirmed', service_id: 'sv', service_name: 'Corte', staff_display_name: 'Sil', customer_name: 'Ana', created_at: 'c', total_count: 7 }],
      error: null,
    })
    expect(await staffListAppointments({}, 1)).toMatchObject({ totalCount: 7, rows: [{ id: 'a', customerName: 'Ana' }] })
    mockRpc.mockResolvedValueOnce({ data: null, error: null })
    expect(await staffListAppointments({}, 1)).toEqual({ rows: [], totalCount: 0 })
  })

  it('throws the server message on error, e.g. an account without a professional profile (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'STAFF_NOT_AUTHORIZED' } })
    await expect(staffListAppointments({}, 1)).rejects.toThrow('STAFF_NOT_AUTHORIZED')
  })
})

describe('admin appointment edit services', () => {
  beforeEach(() => mockRpc.mockReset())

  const input = { appointmentId: 'a', serviceId: 's', staffMemberId: 'm', notes: '  hola  ' }

  it('recorta la nota y manda null si queda vacía', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await adminUpdateAppointment(input)
    expect(mockRpc).toHaveBeenLastCalledWith('admin_update_appointment', expect.objectContaining({ p_notes: 'hola' }))
    await adminUpdateAppointment({ ...input, notes: '   ' })
    expect(mockRpc).toHaveBeenLastCalledWith('admin_update_appointment', expect.objectContaining({ p_notes: null }))
  })

  it('rechaza notas de más de 500 caracteres sin llamar al backend', async () => {
    await expect(adminUpdateAppointment({ ...input, notes: 'x'.repeat(501) })).rejects.toThrow('500')
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('acepta una nota de exactamente 500 caracteres', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await expect(adminUpdateAppointment({ ...input, notes: 'x'.repeat(500) })).resolves.toBeUndefined()
  })

  it('traduce el conflicto de horario', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'APPOINTMENT_CONFLICT' } })
    await expect(adminUpdateAppointment(input)).rejects.toThrow('otro turno')
  })

  it('traduce códigos conocidos y usa un mensaje genérico para el resto', () => {
    expect(translateAdminUpdateError('APPOINTMENT_NOT_EDITABLE')).toContain('pendientes o confirmados')
    expect(translateAdminUpdateError('STAFF_NOT_ASSIGNED_TO_SERVICE')).toContain('no realiza')
    expect(translateAdminUpdateError('algo raro')).toContain('Intentá de nuevo')
  })

  it('getAdminAppointment devuelve null si no hay fila', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })
    expect(await getAdminAppointment('x')).toBeNull()
  })
})
