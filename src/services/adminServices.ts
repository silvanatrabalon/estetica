import { initSupabase } from '../lib/supabase'

export interface Service {
  id: string
  organizationId: string
  name: string
  durationMinutes: number
  priceCents: number
  imageUrl: string | null
  isActive: boolean
  maxConcurrentBookings: number | null
  createdAt: string
}

interface ServiceRow {
  id: string
  organization_id: string
  name: string
  duration_minutes: number
  price_cents: number
  image_url: string | null
  is_active: boolean
  max_concurrent_bookings: number | null
  created_at: string
}

function toService(row: ServiceRow): Service {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
    imageUrl: row.image_url,
    isActive: row.is_active,
    maxConcurrentBookings: row.max_concurrent_bookings ?? null,
    createdAt: row.created_at,
  }
}

export async function listServices(): Promise<Service[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_list_services')

  if (error) {
    throw error
  }

  return ((data ?? []) as ServiceRow[]).map(toService)
}

export async function createService(params: {
  name: string
  durationMinutes: number
  priceCents: number
  imageUrl: string | null
  maxConcurrentBookings?: number | null
}): Promise<Service> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_create_service', {
    p_name: params.name,
    p_duration_minutes: params.durationMinutes,
    p_price_cents: params.priceCents,
    p_image_url: params.imageUrl,
    p_max_concurrent_bookings: params.maxConcurrentBookings ?? null,
  })

  if (error) {
    throw error
  }

  const rows = (data ?? []) as ServiceRow[]
  if (rows.length === 0) {
    throw new Error('No se pudo crear el servicio.')
  }

  return toService(rows[0])
}

export async function updateService(params: {
  serviceId: string
  name: string
  durationMinutes: number
  priceCents: number
  imageUrl: string | null
  maxConcurrentBookings?: number | null
}): Promise<Service> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_update_service', {
    p_service_id: params.serviceId,
    p_name: params.name,
    p_duration_minutes: params.durationMinutes,
    p_price_cents: params.priceCents,
    p_image_url: params.imageUrl,
    p_max_concurrent_bookings: params.maxConcurrentBookings ?? null,
  })

  if (error) {
    throw error
  }

  const rows = (data ?? []) as ServiceRow[]
  if (rows.length === 0) {
    throw new Error('No se pudo actualizar el servicio.')
  }

  return toService(rows[0])
}

export async function setServiceActive(serviceId: string, isActive: boolean): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase.rpc('admin_set_service_active', {
    p_service_id: serviceId,
    p_is_active: isActive,
  })

  if (error) {
    throw error
  }
}
