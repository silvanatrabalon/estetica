import { initSupabase } from '../lib/supabase'

export interface AdminAppointmentRow {
  id: string
  startsAt: string
  endsAt: string
  status: string
  serviceId: string
  serviceName: string
  staffDisplayName: string
  customerName: string
  createdAt: string
  totalCount: number
}

export interface AdminAppointmentFilters {
  statuses?: string[]
  dateFrom?: string
  dateTo?: string
  /** Only this professional's appointments. */
  staffMemberId?: string
  /** Text to look for in the client's name, email or phone (accents and case do not matter). */
  search?: string
  /** true: soonest first. Default: most recent first. */
  ascending?: boolean
}

export interface AdminAppointmentPage {
  rows: AdminAppointmentRow[]
  totalCount: number
}

interface AdminAppointmentRpcRow {
  id: string
  starts_at: string
  ends_at: string
  status: string
  service_id: string
  service_name: string
  staff_display_name: string
  customer_name: string
  created_at: string
  total_count: number
}

function toAdminAppointmentRow(row: AdminAppointmentRpcRow): AdminAppointmentRow {
  return {
    id: row.id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    serviceId: row.service_id,
    serviceName: row.service_name,
    staffDisplayName: row.staff_display_name,
    customerName: row.customer_name,
    createdAt: row.created_at,
    totalCount: row.total_count,
  }
}

export async function adminListAppointments(
  filters: AdminAppointmentFilters,
  page: number,
  pageSize?: number,
): Promise<AdminAppointmentPage> {
  const supabase = initSupabase()

  const { data, error } = await supabase.rpc('admin_list_appointments', {
    p_statuses: filters.statuses?.length ? filters.statuses : null,
    p_date_from: filters.dateFrom ? new Date(filters.dateFrom).toISOString() : null,
    p_date_to: filters.dateTo ? new Date(filters.dateTo).toISOString() : null,
    p_page: page,
    p_page_size: pageSize ?? null,
    p_staff_member_id: filters.staffMemberId || null,
    p_search: filters.search?.trim() || null,
    p_ascending: filters.ascending ?? false,
  })

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data as AdminAppointmentRpcRow[] | null) ?? []

  return {
    rows: rows.map(toAdminAppointmentRow),
    totalCount: rows[0]?.total_count ?? 0,
  }
}

// ── Danger zone ───────────────────────────────────────────────────────────────

export async function adminDeleteAllAppointments(): Promise<number> {
  const supabase = initSupabase()

  const { data, error } = await supabase.rpc('admin_delete_all_appointments')

  if (error) {
    throw new Error(error.message)
  }

  return Number(data)
}

// ── Detail + edit ─────────────────────────────────────────────────────────────

export interface AdminAppointmentDetail {
  id: string
  serviceId: string
  staffMemberId: string
  startsAt: string
  endsAt: string
  status: string
  notes: string | null
  createdAt: string
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  serviceName: string
  serviceDurationMinutes: number
  servicePriceCents: number
  staffDisplayName: string
  orgTimezone: string
}

export interface StaffOption {
  staffMemberId: string
  displayName: string
}

interface AdminAppointmentDetailRpcRow {
  id: string
  service_id: string
  staff_member_id: string
  starts_at: string
  ends_at: string
  status: string
  notes: string | null
  created_at: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  service_name: string
  service_duration_minutes: number
  service_price_cents: number
  staff_display_name: string
  org_timezone: string
}

export const NOTES_MAX_LENGTH = 500

const UPDATE_ERROR_MESSAGES: Record<string, string> = {
  APPOINTMENT_NOT_FOUND: 'No encontramos el turno.',
  APPOINTMENT_NOT_EDITABLE: 'Solo se pueden editar turnos pendientes o confirmados.',
  SERVICE_NOT_AVAILABLE: 'El servicio elegido ya no está disponible.',
  STAFF_NOT_AVAILABLE: 'El profesional elegido ya no está disponible.',
  STAFF_NOT_ASSIGNED_TO_SERVICE: 'Ese profesional no realiza el servicio elegido.',
  NOTES_TOO_LONG: `La nota no puede superar los ${NOTES_MAX_LENGTH} caracteres.`,
  APPOINTMENT_CONFLICT:
    'El profesional ya tiene otro turno en ese horario. Elegí otro profesional o reprogramá el turno.',
}

export function translateAdminUpdateError(message: string): string {
  for (const [code, text] of Object.entries(UPDATE_ERROR_MESSAGES)) {
    if (message.includes(code)) return text
  }
  if (message.includes('No autorizado')) return 'No tenés permiso para editar turnos.'
  return 'No pudimos guardar los cambios. Intentá de nuevo.'
}

function toAdminAppointmentDetail(row: AdminAppointmentDetailRpcRow): AdminAppointmentDetail {
  return {
    id: row.id,
    serviceId: row.service_id,
    staffMemberId: row.staff_member_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    serviceName: row.service_name,
    serviceDurationMinutes: row.service_duration_minutes,
    servicePriceCents: row.service_price_cents,
    staffDisplayName: row.staff_display_name,
    orgTimezone: row.org_timezone,
  }
}

export async function getAdminAppointment(id: string): Promise<AdminAppointmentDetail | null> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_get_appointment', { p_appointment_id: id })
  if (error) throw new Error(error.message)

  const row = ((data as AdminAppointmentDetailRpcRow[] | null) ?? [])[0]
  return row ? toAdminAppointmentDetail(row) : null
}

/** Detail of one of the caller's own appointments as a professional (admins can read any). */
export async function getStaffAppointment(id: string): Promise<AdminAppointmentDetail | null> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('staff_get_appointment', { p_appointment_id: id })
  if (error) throw new Error(error.message)

  const row = ((data as AdminAppointmentDetailRpcRow[] | null) ?? [])[0]
  return row ? toAdminAppointmentDetail(row) : null
}

export async function listStaffForService(serviceId: string): Promise<StaffOption[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_list_staff_for_service', {
    p_service_id: serviceId,
  })
  if (error) throw new Error(error.message)

  return ((data as { staff_member_id: string; display_name: string }[] | null) ?? []).map((r) => ({
    staffMemberId: r.staff_member_id,
    displayName: r.display_name,
  }))
}

export async function adminUpdateAppointment(input: {
  appointmentId: string
  serviceId: string
  staffMemberId: string
  notes: string
}): Promise<void> {
  const trimmed = input.notes.trim()
  if (trimmed.length > NOTES_MAX_LENGTH) {
    throw new Error(translateAdminUpdateError('NOTES_TOO_LONG'))
  }

  const supabase = initSupabase()
  const { error } = await supabase.rpc('admin_update_appointment', {
    p_appointment_id: input.appointmentId,
    p_service_id: input.serviceId,
    p_staff_member_id: input.staffMemberId,
    p_notes: trimmed === '' ? null : trimmed,
  })
  if (error) throw new Error(translateAdminUpdateError(error.message))
}
