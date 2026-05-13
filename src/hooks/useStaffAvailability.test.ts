import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStaffAvailability } from './useStaffAvailability'
import * as staffAvailabilityService from '../services/staffAvailability'
import type {
  StaffScheduleDay,
  StaffScheduleException,
  StaffExceptionInput,
  StaffScheduleDayInput,
} from '../services/staffAvailability'

vi.mock('../services/staffAvailability')

const mockSchedule: StaffScheduleDay[] = [
  {
    id: 'sched-1',
    staffMemberId: 'staff-1',
    dayOfWeek: 1,
    isWorking: true,
    startsAt: '09:00',
    endsAt: '17:00',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

const mockException: StaffScheduleException = {
  id: 'exc-1',
  staffMemberId: 'staff-1',
  exceptionDate: '2025-12-25',
  exceptionType: 'day_off',
  startsAt: null,
  endsAt: null,
  reason: 'Navidad',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('useStaffAvailability', () => {
  beforeEach(() => {
    vi.mocked(staffAvailabilityService.getStaffWeeklySchedule).mockResolvedValue(mockSchedule)
    vi.mocked(staffAvailabilityService.listStaffExceptions).mockResolvedValue([mockException])
    vi.mocked(staffAvailabilityService.setStaffWeeklySchedule).mockResolvedValue(mockSchedule)
    vi.mocked(staffAvailabilityService.addStaffException).mockResolvedValue(mockException)
    vi.mocked(staffAvailabilityService.removeStaffException).mockResolvedValue(undefined)
  })

  it('loads schedule and exceptions on mount', async () => {
    const { result } = renderHook(() => useStaffAvailability('staff-1'))

    expect(result.current.isLoading).toBe(true)

    await act(async () => {})

    expect(result.current.isLoading).toBe(false)
    expect(result.current.schedule).toEqual(mockSchedule)
    expect(result.current.exceptions).toEqual([mockException])
  })

  it('sets error message when load fails', async () => {
    vi.mocked(staffAvailabilityService.getStaffWeeklySchedule).mockRejectedValue(
      new Error('network error'),
    )

    const { result } = renderHook(() => useStaffAvailability('staff-1'))
    await act(async () => {})

    expect(result.current.errorMessage).toBe(
      'No pudimos cargar la disponibilidad. Intentá de nuevo.',
    )
  })

  it('saveSchedule updates schedule and sets success message', async () => {
    const { result } = renderHook(() => useStaffAvailability('staff-1'))
    await act(async () => {})

    const newDays: StaffScheduleDayInput[] = [
      { day_of_week: 1, is_working: true, starts_at: '10:00', ends_at: '18:00' },
    ]

    await act(async () => {
      await result.current.saveSchedule(newDays)
    })

    expect(result.current.successMessage).toBe('Horario guardado correctamente.')
    expect(result.current.isDirty).toBe(false)
    expect(staffAvailabilityService.setStaffWeeklySchedule).toHaveBeenCalledWith('staff-1', newDays)
  })

  it('saveSchedule sets error message on failure', async () => {
    vi.mocked(staffAvailabilityService.setStaffWeeklySchedule).mockRejectedValue(
      new Error('rpc error'),
    )

    const { result } = renderHook(() => useStaffAvailability('staff-1'))
    await act(async () => {})

    await act(async () => {
      await result.current.saveSchedule([])
    })

    expect(result.current.errorMessage).toBe('No pudimos guardar el horario. Intenta de nuevo.')
  })

  it('addException adds to exceptions list and sets success message', async () => {
    const { result } = renderHook(() => useStaffAvailability('staff-1'))
    await act(async () => {})

    const newException: StaffExceptionInput = {
      exceptionDate: '2025-12-25',
      exceptionType: 'day_off',
      startsAt: null,
      endsAt: null,
      reason: null,
    }

    await act(async () => {
      await result.current.addException(newException)
    })

    expect(result.current.successMessage).toBe('Excepción guardada correctamente.')
  })

  it('removeException removes from exceptions list and sets success message', async () => {
    const { result } = renderHook(() => useStaffAvailability('staff-1'))
    await act(async () => {})

    await act(async () => {
      await result.current.removeException('2025-12-25')
    })

    expect(result.current.successMessage).toBe('Excepción eliminada correctamente.')
    expect(staffAvailabilityService.removeStaffException).toHaveBeenCalledWith(
      'staff-1',
      '2025-12-25',
    )
  })

  it('isDirty starts false and can be set', async () => {
    const { result } = renderHook(() => useStaffAvailability('staff-1'))
    await act(async () => {})

    expect(result.current.isDirty).toBe(false)

    act(() => {
      result.current.setIsDirty(true)
    })

    expect(result.current.isDirty).toBe(true)
  })
})
