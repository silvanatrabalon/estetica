import { initSupabase } from '../lib/supabase'
import type { AdminManagedRole } from './adminUsers'

export interface AdminStaffMember {
  id: string
  organizationId: string
  profileUserId: string | null
  displayName: string
  isActive: boolean
  createdAt: string
  fullName: string | null
  role: AdminManagedRole
}

interface AdminStaffMemberRow {
  id: string
  organization_id: string
  profile_user_id: string | null
  display_name: string
  is_active: boolean
  created_at: string
  full_name: string | null
  role: AdminManagedRole
}

function toAdminStaffMember(row: AdminStaffMemberRow): AdminStaffMember {
  return {
    id: row.id,
    organizationId: row.organization_id,
    profileUserId: row.profile_user_id,
    displayName: row.display_name,
    isActive: row.is_active,
    createdAt: row.created_at,
    fullName: row.full_name,
    role: row.role,
  }
}

export async function listAdminStaffMembers(): Promise<AdminStaffMember[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_list_staff_members')

  if (error) {
    throw error
  }

  return ((data ?? []) as AdminStaffMemberRow[]).map(toAdminStaffMember)
}

export async function adminCreateStaffMember(
  profileUserId: string,
  displayName: string,
): Promise<AdminStaffMember> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_create_staff_member', {
    p_profile_user_id: profileUserId,
    p_display_name: displayName,
  })

  if (error) {
    throw error
  }

  const rows = (data ?? []) as AdminStaffMemberRow[]
  if (rows.length === 0) {
    throw new Error('No se pudo crear el profesional.')
  }

  return toAdminStaffMember(rows[0])
}

export async function adminUpdateStaffMember(
  staffId: string,
  displayName: string,
): Promise<AdminStaffMember> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_update_staff_member', {
    p_staff_id: staffId,
    p_display_name: displayName,
  })

  if (error) {
    throw error
  }

  const rows = (data ?? []) as AdminStaffMemberRow[]
  if (rows.length === 0) {
    throw new Error('No se pudo actualizar el profesional.')
  }

  return toAdminStaffMember(rows[0])
}

export async function adminSetStaffActive(staffId: string, isActive: boolean): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase.rpc('admin_set_staff_active', {
    p_staff_id: staffId,
    p_is_active: isActive,
  })

  if (error) {
    throw error
  }
}
