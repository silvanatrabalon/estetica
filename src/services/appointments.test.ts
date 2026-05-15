import { describe, expect, it, vi } from 'vitest'
import { createAppointment, isConflictError } from './appointments'

// ── Mock Supabase ────────────────────────────────────────────────────────────

const mockRpc = vi.fn()

vi.mock('../lib/supabase', () => ({
  initSupabase: () => ({
    rpc: mockRpc,
  }),
}))

// ── Fixtures ─────────────────────────────────────────────────────────────────

const mockAppointmentRow = {
  id: 'appt-1',
  service_id: 'svc-1',
  staff_member_id: 'staff-1',
  starts_at: '2026-06-10T14:00:00Z',
  ends_at: '2026-06-10T15:00:00Z',
  status: 'confirmed',
  created_at: '2026-05-15T10:00:00Z',
}

// ── Tests: createAppointment ─────────────────────────────────────────────────

describe('createAppointment', () => {
  it('maps RPC response to NewAppointment (camelCase)', async () => {
    mockRpc.mockResolvedValueOnce({ data: [mockAppointmentRow], error: null })

    const result = await createAppointment({
      serviceId: 'svc-1',
      startsAt: '2026-06-10T14:00:00Z',
    })

    expect(result).toEqual({
      id: 'appt-1',
      serviceId: 'svc-1',
      staffMemberId: 'staff-1',
      startsAt: '2026-06-10T14:00:00Z',
      endsAt: '2026-06-10T15:00:00Z',
      status: 'confirmed',
      createdAt: '2026-05-15T10:00:00Z',
    })
  })

  it('calls rpc with correct parameter names', async () => {
    mockRpc.mockResolvedValueOnce({ data: [mockAppointmentRow], error: null })

    await createAppointment({ serviceId: 'svc-1', startsAt: '2026-06-10T14:00:00Z' })

    expect(mockRpc).toHaveBeenCalledWith('create_appointment', {
      p_service_id: 'svc-1',
      p_starts_at: '2026-06-10T14:00:00Z',
    })
  })

  it('throws Spanish message for 23P01 exclusion violation', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { code: '23P01', message: 'exclusion' } })

    await expect(
      createAppointment({ serviceId: 'svc-1', startsAt: '2026-06-10T14:00:00Z' }),
    ).rejects.toThrow(
      'El horario seleccionado ya no está disponible. Por favor, seleccioná otro turno.',
    )
  })

  it('throws Spanish message for BOOKING_NO_STAFF_AVAILABLE', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { code: 'P0001', message: 'BOOKING_NO_STAFF_AVAILABLE' },
    })

    await expect(
      createAppointment({ serviceId: 'svc-1', startsAt: '2026-06-10T14:00:00Z' }),
    ).rejects.toThrow(
      'El horario seleccionado ya no está disponible. Por favor, seleccioná otro turno.',
    )
  })

  it('throws Spanish message for BOOKING_CAPACITY_EXCEEDED', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { code: 'P0001', message: 'BOOKING_CAPACITY_EXCEEDED' },
    })

    await expect(
      createAppointment({ serviceId: 'svc-1', startsAt: '2026-06-10T14:00:00Z' }),
    ).rejects.toThrow(
      'El turno seleccionado ya no tiene disponibilidad. Por favor, elegí otro.',
    )
  })

  it('throws Spanish message for BOOKING_OUTSIDE_POLICY_WINDOW', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { code: 'P0001', message: 'BOOKING_OUTSIDE_POLICY_WINDOW' },
    })

    await expect(
      createAppointment({ serviceId: 'svc-1', startsAt: '2026-06-10T14:00:00Z' }),
    ).rejects.toThrow('Este horario ya no está dentro del rango de reservas permitido.')
  })

  it('throws Spanish message for BOOKING_SERVICE_NOT_FOUND', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { code: 'P0001', message: 'BOOKING_SERVICE_NOT_FOUND' },
    })

    await expect(
      createAppointment({ serviceId: 'svc-1', startsAt: '2026-06-10T14:00:00Z' }),
    ).rejects.toThrow('El servicio seleccionado no está disponible.')
  })

  it('throws generic message for unrecognized errors', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { code: '42501', message: 'permission denied' },
    })

    await expect(
      createAppointment({ serviceId: 'svc-1', startsAt: '2026-06-10T14:00:00Z' }),
    ).rejects.toThrow('Error al crear el turno.')
  })
})

// ── Tests: isConflictError ───────────────────────────────────────────────────

describe('isConflictError', () => {
  it('returns true for 23P01 exclusion violation', () => {
    expect(isConflictError({ code: '23P01', message: 'exclusion' })).toBe(true)
  })

  it('returns true for 23505 unique violation', () => {
    expect(isConflictError({ code: '23505', message: 'unique' })).toBe(true)
  })

  it('returns true for P0001 BOOKING_NO_STAFF_AVAILABLE', () => {
    expect(isConflictError({ code: 'P0001', message: 'BOOKING_NO_STAFF_AVAILABLE' })).toBe(true)
  })

  it('returns true for P0001 BOOKING_CAPACITY_EXCEEDED', () => {
    expect(isConflictError({ code: 'P0001', message: 'BOOKING_CAPACITY_EXCEEDED' })).toBe(true)
  })

  it('returns true for P0001 BOOKING_OUTSIDE_POLICY_WINDOW', () => {
    expect(isConflictError({ code: 'P0001', message: 'BOOKING_OUTSIDE_POLICY_WINDOW' })).toBe(true)
  })

  it('returns true for P0001 BOOKING_SERVICE_NOT_FOUND', () => {
    expect(isConflictError({ code: 'P0001', message: 'BOOKING_SERVICE_NOT_FOUND' })).toBe(true)
  })

  it('returns false for unrelated error codes', () => {
    expect(isConflictError({ code: '42501', message: 'permission denied' })).toBe(false)
  })

  it('returns false for null', () => {
    expect(isConflictError(null)).toBe(false)
  })

  it('returns false for a plain string', () => {
    expect(isConflictError('some error')).toBe(false)
  })
})
