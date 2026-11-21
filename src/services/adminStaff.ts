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

/**
 * Creates a professional linked to an account. The professional takes the account's name;
 * `displayName` is only a last resort for accounts that have no name at all.
 */
export async function adminCreateStaffMember(
  profileUserId: string,
  displayName = '',
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

// ── Permissions: what may the professional edit on their own? ────────────────

export interface StaffAvailabilityPermissions {
  /** May edit their weekly schedule. */
  canEditSchedule: boolean
  /** May add/remove their own days off and special days. */
  canEditDaysOff: boolean
}

/** Map of staffMemberId -> permissions. */
export async function listStaffAvailabilityPermissions(): Promise<Record<string, StaffAvailabilityPermissions>> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_list_staff_availability_permissions')

  if (error) {
    throw error
  }

  const result: Record<string, StaffAvailabilityPermissions> = {}
  for (const row of (data ?? []) as Array<{
    staff_member_id: string
    can_edit_own_availability: boolean
    can_edit_own_days_off?: boolean
  }>) {
    result[row.staff_member_id] = {
      canEditSchedule: row.can_edit_own_availability,
      canEditDaysOff: row.can_edit_own_days_off ?? true,
    }
  }
  return result
}

export async function adminSetStaffAvailabilityPermission(staffId: string, allowed: boolean): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase.rpc('admin_set_staff_availability_permission', {
    p_staff_id: staffId,
    p_allowed: allowed,
  })

  if (error) {
    throw error
  }
}

export async function adminSetStaffDaysOffPermission(staffId: string, allowed: boolean): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase.rpc('admin_set_staff_days_off_permission', {
    p_staff_id: staffId,
    p_allowed: allowed,
  })

  if (error) {
    throw error
  }
}
