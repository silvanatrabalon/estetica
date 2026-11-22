import { initSupabase } from '../lib/supabase'
import { normalizePhone, normalizeProfileName } from '../lib/profile'

export type AdminManagedRole = 'customer' | 'staff' | 'admin'

export interface AdminManagedUser {
  userId: string
  email: string | null
  createdAt: string
  lastSignInAt: string | null
  name: string
  phone: string | null
  roles: AdminManagedRole[]
  isActive: boolean
}

export interface AdminUserAnalytics {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  customerUsers: number
  staffUsers: number
  adminUsers: number
  recentSignups30Days: number
}

interface AdminListUserRow {
  user_id: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
  full_name: string | null
  phone: string | null
  roles: AdminManagedRole[]
  is_active: boolean
}

interface AdminAnalyticsRow {
  total_users: number
  active_users: number
  inactive_users: number
  customer_users: number
  staff_users: number
  admin_users: number
  recent_signups_30_days: number
}

interface AdminUserRoleRow {
  user_id: string
  role: AdminManagedRole
  is_active: boolean
}

function toAdminManagedUser(row: AdminListUserRow): AdminManagedUser {
  return {
    userId: row.user_id,
    email: row.email,
    createdAt: row.created_at,
    lastSignInAt: row.last_sign_in_at,
    name: row.full_name?.trim() ?? '',
    phone: row.phone,
    roles: row.roles ?? [],
    isActive: row.is_active,
  }
}

function toAdminAnalytics(row: AdminAnalyticsRow): AdminUserAnalytics {
  return {
    totalUsers: row.total_users,
    activeUsers: row.active_users,
    inactiveUsers: row.inactive_users,
    customerUsers: row.customer_users,
    staffUsers: row.staff_users,
    adminUsers: row.admin_users,
    recentSignups30Days: row.recent_signups_30_days,
  }
}

export async function listAdminUsers(): Promise<AdminManagedUser[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_list_users')

  if (error) {
    throw error
  }

  return ((data ?? []) as AdminListUserRow[]).map(toAdminManagedUser)
}

export async function getAdminUserAnalytics(): Promise<AdminUserAnalytics> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_user_analytics')

  if (error) {
    throw error
  }

  const row = ((data ?? [])[0] ?? {
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
    customer_users: 0,
    staff_users: 0,
    admin_users: 0,
    recent_signups_30_days: 0,
  }) as AdminAnalyticsRow

  return toAdminAnalytics(row)
}

export async function adminUpdateUserRole(userId: string, role: AdminManagedRole): Promise<AdminUserRoleRow> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_update_user_role', {
    target_user_id: userId,
    target_role: role,
  })

  if (error) {
    throw error
  }

  return data as AdminUserRoleRow
}

export async function adminUpdateUserProfile(
  userId: string,
  input: { name: string; phone: string },
): Promise<Pick<AdminManagedUser, 'userId' | 'name' | 'phone'>> {
  const supabase = initSupabase()
  const payload = {
    full_name: normalizeProfileName(input.name),
    phone: normalizePhone(input.phone),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        ...payload,
      },
      { onConflict: 'user_id' },
    )
    .select('user_id, full_name, phone')
    .single<{ user_id: string; full_name: string | null; phone: string | null }>()

  if (error) {
    throw error
  }

  return {
    userId: data.user_id,
    name: data.full_name?.trim() ?? '',
    phone: data.phone,
  }
}

export async function getCurrentUserActivationStatus(): Promise<boolean> {
  const supabase = initSupabase()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    return false
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('is_active')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle<{ is_active: boolean | null }>()

  if (error) {
    throw error
  }

  return data?.is_active ?? true
}

export async function adminAssignUserRole(userId: string, role: AdminManagedRole): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase.rpc('admin_assign_user_role', {
    target_user_id: userId,
    target_role: role,
  })

  if (error) {
    throw error
  }
}

export async function adminRevokeUserRole(userId: string, role: AdminManagedRole): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase.rpc('admin_revoke_user_role', {
    target_user_id: userId,
    target_role: role,
  })

  if (error) {
    throw error
  }
}

// ── Invitations: add a user before they sign in ──────────────────────────────

export interface UserInvitation {
  id: string
  email: string
  name: string | null
  roles: AdminManagedRole[]
  createdAt: string
}

export type InviteResult =
  | { status: 'invited'; invitationId: string }
  | { status: 'exists'; userId: string }

const INVITE_ERRORS: Record<string, string> = {
  INVITE_EMAIL_INVALID: 'El email no parece válido.',
  INVITE_NAME_INVALID: 'El nombre no puede superar los 80 caracteres.',
  INVITE_ROLES_REQUIRED: 'Elegí al menos un rol.',
  INVITE_ALREADY_PENDING: 'Ya hay una invitación pendiente para ese email.',
  INVITE_NOT_FOUND: 'No encontramos esa invitación.',
}

/** Spanish message for the invitation errors coming from the database. */
export function translateInviteError(message: string): string {
  for (const [code, text] of Object.entries(INVITE_ERRORS)) {
    if (message.includes(code)) return text
  }
  return 'No pudimos guardar la invitación. Intentá de nuevo.'
}

/**
 * Saves an invitation: when the person signs in for the first time with this email they get the
 * given roles. If the email already has an account nothing is created and `exists` is returned.
 */
export async function adminInviteUser(
  email: string,
  name: string,
  roles: AdminManagedRole[],
): Promise<InviteResult> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_invite_user', {
    p_email: email,
    p_full_name: name.trim() || null,
    p_roles: roles,
  })

  if (error) {
    throw new Error(translateInviteError(error.message))
  }

  const row = ((data ?? []) as Array<{ status: string; user_id: string | null; invitation_id: string | null }>)[0]
  if (row?.status === 'exists' && row.user_id) {
    return { status: 'exists', userId: row.user_id }
  }
  if (row?.status === 'invited' && row.invitation_id) {
    return { status: 'invited', invitationId: row.invitation_id }
  }
  throw new Error(translateInviteError(''))
}

export async function adminListUserInvitations(): Promise<UserInvitation[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_list_user_invitations')

  if (error) {
    throw new Error(translateInviteError(error.message))
  }

  return ((data ?? []) as Array<{
    id: string
    email: string
    full_name: string | null
    roles: AdminManagedRole[]
    created_at: string
  }>).map((row) => ({
    id: row.id,
    email: row.email,
    name: row.full_name,
    roles: row.roles,
    createdAt: row.created_at,
  }))
}

export async function adminDeleteUserInvitation(id: string): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase.rpc('admin_delete_user_invitation', { p_id: id })

  if (error) {
    throw new Error(translateInviteError(error.message))
  }
}
