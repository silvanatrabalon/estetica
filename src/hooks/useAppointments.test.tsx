import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAppointments } from './useAppointments'
import type { AppointmentSummary } from '../services/appointments'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockListAppointments = vi.fn()

vi.mock('../services/appointments', () => ({
  listAppointments: (...args: unknown[]) => mockListAppointments(...args),
}))

// ── Fixtures ─────────────────────────────────────────────────────────────────

const mockAppointment: AppointmentSummary = {
  id: 'aaaabbbb-cccc-dddd-eeee-123456789001',
  startsAt: '2099-06-01T14:00:00Z',
  endsAt: '2099-06-01T15:00:00Z',
  status: 'confirmed',
  createdAt: '2099-05-01T10:00:00Z',
  customerUserId: 'user-customer-123',
  serviceName: 'Corte de cabello',
  serviceDurationMinutes: 60,
  servicePriceCents: 5000,
  staffDisplayName: 'María López',
  orgName: 'Estética Moderna',
  orgTimezone: 'America/Argentina/Buenos_Aires',
  customerName: 'Juan Pérez',
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns loading=true initially while fetching', () => {
    // Never resolves during this test
    mockListAppointments.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useAppointments())

    expect(result.current.loading).toBe(true)
    expect(result.current.appointments).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('returns appointments and loading=false on success', async () => {
    mockListAppointments.mockResolvedValue([mockAppointment])

    const { result } = renderHook(() => useAppointments())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.appointments).toEqual([mockAppointment])
    expect(result.current.error).toBeNull()
  })

  it('returns empty array and loading=false when no appointments exist', async () => {
    mockListAppointments.mockResolvedValue([])

    const { result } = renderHook(() => useAppointments())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.appointments).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('returns error message and loading=false on failure', async () => {
    mockListAppointments.mockRejectedValue(new Error('RPC failure'))

    const { result } = renderHook(() => useAppointments())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.appointments).toEqual([])
    expect(result.current.error).toBe('Ocurrió un error al cargar tus turnos.')
  })
})
