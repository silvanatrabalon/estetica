import { initSupabase } from '../lib/supabase'

export interface ServiceAvailableDate {
  serviceId: string
  availableDate: string
  createdAt: string
}

interface ServiceAvailableDateRow {
  service_id: string
  available_date: string
  created_at: string
}

function toServiceAvailableDate(row: ServiceAvailableDateRow): ServiceAvailableDate {
  return {
    serviceId: row.service_id,
    availableDate: row.available_date,
    createdAt: row.created_at,
  }
}

export async function listServiceAvailableDates(serviceId: string): Promise<ServiceAvailableDate[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_list_service_available_dates', {
    p_service_id: serviceId,
  })

  if (error) {
    throw error
  }

  return ((data ?? []) as ServiceAvailableDateRow[]).map(toServiceAvailableDate)
}

export async function addServiceAvailableDate(serviceId: string, date: string): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase.rpc('admin_add_service_available_date', {
    p_service_id: serviceId,
    p_date: date,
  })

  if (error) {
    throw error
  }
}

export async function removeServiceAvailableDate(serviceId: string, date: string): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase.rpc('admin_remove_service_available_date', {
    p_service_id: serviceId,
    p_date: date,
  })

  if (error) {
    throw error
  }
}
