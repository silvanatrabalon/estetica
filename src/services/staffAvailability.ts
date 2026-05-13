import { initSupabase } from '../lib/supabase'

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface StaffScheduleDay {
  id: string
  staffMemberId: string
  dayOfWeek: number
  isWorking: boolean
  startsAt: string | null
  endsAt: string | null
  createdAt: string
  updatedAt: string
}

export type StaffExceptionType = 'day_off' | 'custom_hours'

export interface StaffScheduleException {
  id: string
  staffMemberId: string
  exceptionDate: string
  exceptionType: StaffExceptionType
  startsAt: string | null
  endsAt: string | null
  reason: string | null
  createdAt: string
  updatedAt: string
}

export interface StaffScheduleDayInput {
  day_of_week: number
  is_working: boolean
  starts_at: string | null
  ends_at: string | null
}

export interface StaffExceptionInput {
  exceptionDate: string
  exceptionType: StaffExceptionType
  startsAt: string | null
  endsAt: string | null
  reason: string | null
}

// ──────────────────────────────────────────────────────────────────────────────
// Row → domain mappers
// ──────────────────────────────────────────────────────────────────────────────

interface StaffScheduleDayRow {
  id: string
  staff_member_id: string
  day_of_week: number
  is_working: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
}

interface StaffScheduleExceptionRow {
  id: string
  staff_member_id: string
  exception_date: string
  exception_type: StaffExceptionType
  starts_at: string | null
  ends_at: string | null
  reason: string | null
  created_at: string
  updated_at: string
}

function toStaffScheduleDay(row: StaffScheduleDayRow): StaffScheduleDay {
  return {
    id: row.id,
    staffMemberId: row.staff_member_id,
    dayOfWeek: row.day_of_week,
    isWorking: row.is_working,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toStaffScheduleException(row: StaffScheduleExceptionRow): StaffScheduleException {
  return {
    id: row.id,
    staffMemberId: row.staff_member_id,
    exceptionDate: row.exception_date,
    exceptionType: row.exception_type,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    reason: row.reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Service functions
// ──────────────────────────────────────────────────────────────────────────────

export async function getStaffWeeklySchedule(staffId: string): Promise<StaffScheduleDay[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase
    .from('staff_schedules')
    .select('*')
    .eq('staff_member_id', staffId)
    .order('day_of_week')

  if (error) {
    throw error
  }

  return ((data ?? []) as StaffScheduleDayRow[]).map(toStaffScheduleDay)
}

export async function setStaffWeeklySchedule(
  staffId: string,
  schedule: StaffScheduleDayInput[],
): Promise<StaffScheduleDay[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_set_staff_schedule', {
    p_staff_member_id: staffId,
    p_schedule: schedule,
  })

  if (error) {
    throw error
  }

  return ((data ?? []) as StaffScheduleDayRow[]).map(toStaffScheduleDay)
}

export async function listStaffExceptions(staffId: string): Promise<StaffScheduleException[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase
    .from('staff_schedule_exceptions')
    .select('*')
    .eq('staff_member_id', staffId)
    .order('exception_date')

  if (error) {
    throw error
  }

  return ((data ?? []) as StaffScheduleExceptionRow[]).map(toStaffScheduleException)
}

export async function addStaffException(
  staffId: string,
  exception: StaffExceptionInput,
): Promise<StaffScheduleException> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_upsert_staff_schedule_exception', {
    p_staff_member_id: staffId,
    p_exception_date: exception.exceptionDate,
    p_exception_type: exception.exceptionType,
    p_starts_at: exception.startsAt,
    p_ends_at: exception.endsAt,
    p_reason: exception.reason,
  })

  if (error) {
    throw error
  }

  const rows = (data ?? []) as StaffScheduleExceptionRow[]
  if (rows.length === 0) {
    throw new Error('No se pudo guardar la excepción.')
  }

  return toStaffScheduleException(rows[0])
}

export async function removeStaffException(
  staffId: string,
  exceptionDate: string,
): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase.rpc('admin_delete_staff_schedule_exception', {
    p_staff_member_id: staffId,
    p_exception_date: exceptionDate,
  })

  if (error) {
    throw error
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Staff self-service — current user manages their own availability
// ──────────────────────────────────────────────────────────────────────────────

export async function getMyStaffMemberId(): Promise<string | null> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('get_my_staff_member_id')

  if (error) {
    // Not found or not a staff member
    return null
  }

  return data as string | null
}

export async function setMyWeeklySchedule(
  schedule: StaffScheduleDayInput[],
): Promise<StaffScheduleDay[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('staff_set_my_schedule', {
    p_schedule: schedule,
  })

  if (error) {
    throw error
  }

  return ((data ?? []) as StaffScheduleDayRow[]).map(toStaffScheduleDay)
}

export async function addMyException(
  exception: StaffExceptionInput,
): Promise<StaffScheduleException> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('staff_upsert_my_exception', {
    p_exception_date: exception.exceptionDate,
    p_exception_type: exception.exceptionType,
    p_starts_at: exception.startsAt,
    p_ends_at: exception.endsAt,
    p_reason: exception.reason,
  })

  if (error) {
    throw error
  }

  const rows = (data ?? []) as StaffScheduleExceptionRow[]
  if (rows.length === 0) {
    throw new Error('No se pudo guardar la excepción.')
  }

  return toStaffScheduleException(rows[0])
}

export async function removeMyException(exceptionDate: string): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase.rpc('staff_delete_my_exception', {
    p_exception_date: exceptionDate,
  })

  if (error) {
    throw error
  }
}
