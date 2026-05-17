import { beforeEach, describe, expect, it, vi } from 'vitest'
import { rescheduleAppointment } from './appointments'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockRpc = vi.fn()

vi.mock('../lib/supabase', () => ({
  initSupabase: () => ({
    rpc: (...args: unknown[]) => mockRpc(...args),
  }),
}))

// ── Fixtures ─────────────────────────────────────────────────────────────────

const APT_ID = 'aaaabbbb-cccc-dddd-eeee-123456789012'
const NEW_STARTS_AT = '2099-07-01T10:00:00Z'

const mockRow = {
  id: APT_ID,
  service_id: 'svc-001',
  staff_member_id: 'staff-001',
  starts_at: NEW_STARTS_AT,
  ends_at: '2099-07-01T11:00:00Z',
  status: 'confirmed',
  updated_at: '2099-06-14T08:00:00Z',
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('rescheduleAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('successful reschedule', () => {
    it('maps RPC response to RescheduledAppointment (camelCase)', async () => {
      mockRpc.mockResolvedValue({ data: [mockRow], error: null })

      const result = await rescheduleAppointment({
        appointmentId: APT_ID,
        newStartsAt: NEW_STARTS_AT,
      })

      expect(result).toEqual({
        id: APT_ID,
        serviceId: 'svc-001',
        staffMemberId: 'staff-001',
        startsAt: NEW_STARTS_AT,
        endsAt: '2099-07-01T11:00:00Z',
        status: 'confirmed',
        updatedAt: '2099-06-14T08:00:00Z',
      })
    })

    it('calls the reschedule_appointment RPC with correct params', async () => {
      mockRpc.mockResolvedValue({ data: [mockRow], error: null })

      await rescheduleAppointment({
        appointmentId: APT_ID,
        newStartsAt: NEW_STARTS_AT,
      })

      expect(mockRpc).toHaveBeenCalledWith('reschedule_appointment', {
        p_appointment_id: APT_ID,
        p_new_starts_at: NEW_STARTS_AT,
      })
    })
  })

  describe('error translation', () => {
    it('translates 23P01 (exclusion constraint) to Spanish conflict message', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { code: '23P01', message: 'conflicting key value violates exclusion constraint' },
      })

      await expect(
        rescheduleAppointment({ appointmentId: APT_ID, newStartsAt: NEW_STARTS_AT }),
      ).rejects.toThrow('El horario seleccionado ya no está disponible. Por favor, elegí otro turno.')
    })

    it('translates P0001:RESCHEDULE_OUTSIDE_POLICY_WINDOW to Spanish policy message', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { code: 'P0001', message: 'RESCHEDULE_OUTSIDE_POLICY_WINDOW' },
      })

      await expect(
        rescheduleAppointment({ appointmentId: APT_ID, newStartsAt: NEW_STARTS_AT }),
      ).rejects.toThrow(
        'Este horario está fuera del plazo mínimo permitido para reprogramar.',
      )
    })

    it('translates P0001:RESCHEDULE_INVALID_STATUS to Spanish status message', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { code: 'P0001', message: 'RESCHEDULE_INVALID_STATUS' },
      })

      await expect(
        rescheduleAppointment({ appointmentId: APT_ID, newStartsAt: NEW_STARTS_AT }),
      ).rejects.toThrow(
        'Este turno no puede reprogramarse porque ya fue cancelado o completado.',
      )
    })

    it('translates P0001:RESCHEDULE_NOT_AUTHORIZED to Spanish auth message', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { code: 'P0001', message: 'RESCHEDULE_NOT_AUTHORIZED' },
      })

      await expect(
        rescheduleAppointment({ appointmentId: APT_ID, newStartsAt: NEW_STARTS_AT }),
      ).rejects.toThrow('No tenés permiso para reprogramar este turno.')
    })

    it('falls back to generic Spanish error for unknown error codes', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { code: 'UNKNOWN', message: 'Something went wrong' },
      })

      await expect(
        rescheduleAppointment({ appointmentId: APT_ID, newStartsAt: NEW_STARTS_AT }),
      ).rejects.toThrow('Error al reprogramar el turno.')
    })
  })
})
