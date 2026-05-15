import { useEffect, useState } from 'react'
import { initSupabase } from '../lib/supabase'
import type { Service } from '../services/adminServices'

export interface UseActiveServicesResult {
  services: Service[]
  loading: boolean
  error: string | null
}

/**
 * Fetches all active services (is_active = true) for the organization.
 */
export function useActiveServices(): UseActiveServicesResult {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const supabase = initSupabase()

    setLoading(true)
    setError(null)

    supabase
      .from('services')
      .select(
        'id, organization_id, name, duration_minutes, price_cents, image_url, is_active, max_concurrent_bookings, created_at',
      )
      .eq('is_active', true)
      .order('name')
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        if (fetchError) {
          setError('No pudimos cargar los servicios. Intentá de nuevo.')
          return
        }
        setServices(
          (data ?? []).map((row) => ({
            id: row.id,
            organizationId: row.organization_id,
            name: row.name,
            durationMinutes: row.duration_minutes,
            priceCents: row.price_cents,
            imageUrl: row.image_url ?? null,
            isActive: row.is_active,
            maxConcurrentBookings: row.max_concurrent_bookings ?? null,
            createdAt: row.created_at,
          })),
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { services, loading, error }
}
