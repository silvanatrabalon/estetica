import { initSupabase } from '../lib/supabase'

export interface StaffService {
  serviceId: string
  name: string
  durationMinutes: number
  priceCents: number
  imageUrl: string | null
  isActive: boolean
  createdAt: string
}

interface StaffServiceRow {
  service_id: string
  name: string
  duration_minutes: number
  price_cents: number
  image_url: string | null
  is_active: boolean
  created_at: string
}

function toStaffService(row: StaffServiceRow): StaffService {
  return {
    serviceId: row.service_id,
    name: row.name,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
    imageUrl: row.image_url,
    isActive: row.is_active,
    createdAt: row.created_at,
  }
}

export async function listStaffServices(staffMemberId: string): Promise<StaffService[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_list_staff_services', {
    p_staff_member_id: staffMemberId,
  })

  if (error) throw error

  return ((data ?? []) as StaffServiceRow[]).map(toStaffService)
}

export async function listAssignableServices(staffMemberId: string): Promise<StaffService[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_list_assignable_services', {
    p_staff_member_id: staffMemberId,
  })

  if (error) throw error

  return ((data ?? []) as StaffServiceRow[]).map(toStaffService)
}

export async function assignServiceToStaff(staffMemberId: string, serviceId: string): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase.rpc('admin_assign_service_to_staff', {
    p_staff_member_id: staffMemberId,
    p_service_id: serviceId,
  })

  if (error) throw error
}

export async function unassignServiceFromStaff(staffMemberId: string, serviceId: string): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase.rpc('admin_unassign_service_from_staff', {
    p_staff_member_id: staffMemberId,
    p_service_id: serviceId,
  })

  if (error) throw error
}
