import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAdminDashboardStats } from './useAdminDashboardStats'
import * as adminDashboardService from '../services/adminDashboard'
import type { AdminDashboardStats } from '../services/adminDashboard'

const mockStats: AdminDashboardStats = {
  todayCount: 3,
  weekCount: 15,
  monthCount: 42,
  pendingCount: 2,
  confirmedCount: 8,
  cancelledCount: 5,
  completedCount: 27,
  noShowCount: 3,
  revenueCentsMonth: 135000,
}

describe('useAdminDashboardStats', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('starts in loading state', () => {
    vi.spyOn(adminDashboardService, 'getAdminDashboardStats').mockReturnValue(
      new Promise(() => {}), // never resolves
    )

    const { result } = renderHook(() => useAdminDashboardStats())

    expect(result.current.loading).toBe(true)
    expect(result.current.stats).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('transitions to data state on success', async () => {
    vi.spyOn(adminDashboardService, 'getAdminDashboardStats').mockResolvedValue(mockStats)

    const { result } = renderHook(() => useAdminDashboardStats())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.stats).toEqual(mockStats)
    expect(result.current.error).toBeNull()
  })

  it('transitions to error state on failure', async () => {
    vi.spyOn(adminDashboardService, 'getAdminDashboardStats').mockRejectedValue(
      new Error('RPC error'),
    )

    const { result } = renderHook(() => useAdminDashboardStats())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.stats).toBeNull()
    expect(result.current.error).toBe('Ocurrió un error al cargar las estadísticas.')
  })
})
