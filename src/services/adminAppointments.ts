import { initSupabase } from '../lib/supabase'

export interface AdminAppointmentRow {
  id: string
  startsAt: string
  endsAt: string
  status: string
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
