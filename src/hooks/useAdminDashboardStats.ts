import { useEffect, useState } from 'react'
import { getAdminDashboardStats, type AdminDashboardStats } from '../services/adminDashboard'

export interface UseAdminDashboardStatsResult {
  stats: AdminDashboardStats | null
  loading: boolean
  error: string | null
}

export function useAdminDashboardStats(): UseAdminDashboardStatsResult {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    getAdminDashboardStats()
      .then((data) => {
        if (!cancelled) {
          setStats(data)
        }
      })
      .catch((err: unknown) => {
        console.error('[useAdminDashboardStats] error:', err)
        if (!cancelled) {
          setError('Ocurrió un error al cargar las estadísticas.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { stats, loading, error }
}
