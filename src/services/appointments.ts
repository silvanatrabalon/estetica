import { initSupabase } from '../lib/supabase'
import { translateCouponError } from '../lib/coupons'

export interface AppointmentSummary {
  id: string
  startsAt: string
  endsAt: string
  status: string
  createdAt: string
  customerUserId: string
  serviceId: string
  serviceName: string
  serviceDurationMinutes: number
  servicePriceCents: number
  staffDisplayName: string
  orgName: string
  orgTimezone: string
  customerName: string | null
}

interface AppointmentSummaryRow {
  id: string
  starts_at: string
  ends_at: string
  status: string
  created_at: string
  customer_user_id: string
  service_id: string
  service_name: string
  service_duration_minutes: number
  service_price_cents: number
  staff_display_name: string
  org_name: string
  org_timezone: string
  customer_name: string | null
}

export interface AppointmentDetail {
  id: string
  serviceId: string
  staffMemberId: string
  startsAt: string
  endsAt: string
  status: string
  createdAt: string
  customerUserId: string
  serviceName: string
  serviceDurationMinutes: number
  servicePriceCents: number
  staffDisplayName: string
  orgName: string
  orgTimezone: string
  customerName: string
}

interface AppointmentDetailRow {
  id: string
  service_id: string
  staff_member_id: string
  starts_at: string
  ends_at: string
  status: string
  created_at: string
  customer_user_id: string
  service_name: string
  service_duration_minutes: number
  service_price_cents: number
  staff_display_name: string
  org_name: string
  org_timezone: string
  customer_name: string
}

export interface RescheduledAppointment {
  id: string
  serviceId: string
  staffMemberId: string
  startsAt: string
  endsAt: string
  status: string
  updatedAt: string
}

interface RescheduleAppointmentRow {
  id: string
  service_id: string
  staff_member_id: string
  starts_at: string
  ends_at: string
  status: string
  updated_at: string
}

export interface NewAppointment {
  id: string
  serviceId: string
  staffMemberId: string
  startsAt: string
  endsAt: string
  status: string
  createdAt: string
}

interface AppointmentRow {
  id: string
  service_id: string
  staff_member_id: string
  starts_at: string
  ends_at: string
  status: string
  created_at: string
}

export interface CancelledAppointment {
  id: string
  serviceId: string
  staffMemberId: string
  startsAt: string
  endsAt: string
  status: string
  updatedAt: string
}

interface CancelAppointmentRow {
  id: string
  service_id: string
  staff_member_id: string
  starts_at: string
  ends_at: string
  status: string
  updated_at: string
}

const CANCEL_ERRORS: Record<string, string> = {
  CANCEL_OUTSIDE_POLICY_WINDOW:
    'No podés cancelar con tan poca anticipación. Cancelá con al menos la anticipación mínima requerida.',
  CANCEL_INVALID_STATUS:
    'Este turno no puede cancelarse porque ya fue cancelado o completado.',
  CANCEL_NOT_AUTHORIZED:
    'No tenés permiso para cancelar este turno.',
}

export function translateCancelError(err: unknown): Error {
  if (!err || typeof err !== 'object') {
    return new Error('Ocurrió un error al cancelar el turno. Intentá de nuevo.')
  }
  const e = err as { code?: string; message?: string }

  if (e.code === 'P0001') {
    const msg = e.message ?? ''
    for (const [key, translation] of Object.entries(CANCEL_ERRORS)) {
      if (msg.includes(key)) {
        return new Error(translation)
      }
    }
  }

  return new Error('Ocurrió un error al cancelar el turno. Intentá de nuevo.')
}

export async function cancelAppointment(params: {
  appointmentId: string
}): Promise<CancelledAppointment> {
  const supabase = initSupabase()

  const { data, error } = await supabase.rpc('cancel_appointment', {
    p_appointment_id: params.appointmentId,
  })

  if (error) {
    throw translateCancelError(error)
  }

  const rows = (data ?? []) as CancelAppointmentRow[]
  if (rows.length === 0) {
    throw new Error('No se pudo cancelar el turno.')
  }

  const row = rows[0]
  return {
    id: row.id,
    serviceId: row.service_id,
    staffMemberId: row.staff_member_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    updatedAt: row.updated_at,
  }
}

const RESCHEDULE_ERRORS: Record<string, string> = {
  RESCHEDULE_OUTSIDE_POLICY_WINDOW:
    'Este horario está fuera del plazo mínimo permitido para reprogramar.',
  RESCHEDULE_INVALID_STATUS:
    'Este turno no puede reprogramarse porque ya fue cancelado o completado.',
  RESCHEDULE_NOT_AUTHORIZED:
    'No tenés permiso para reprogramar este turno.',
}

function translateRescheduleError(err: unknown): Error {
  if (!err || typeof err !== 'object') {
    return new Error('Error al reprogramar el turno.')
  }
  const e = err as { code?: string; message?: string }

  if (e.code === '23P01') {
    return new Error(
      'El horario seleccionado ya no está disponible. Por favor, elegí otro turno.',
    )
  }

  if (e.code === 'P0001') {
    const msg = e.message ?? ''
    for (const [key, translation] of Object.entries(RESCHEDULE_ERRORS)) {
      if (msg.includes(key)) {
        return new Error(translation)
      }
    }
  }

  return new Error('Error al reprogramar el turno.')
}

const BOOKING_ERRORS: Record<string, string> = {
  BOOKING_NO_STAFF_AVAILABLE:
    'El horario seleccionado ya no está disponible. Por favor, seleccioná otro turno.',
  BOOKING_CAPACITY_EXCEEDED:
    'El turno seleccionado ya no tiene disponibilidad. Por favor, elegí otro.',
  BOOKING_OUTSIDE_POLICY_WINDOW:
    'Este horario ya no está dentro del rango de reservas permitido.',
  BOOKING_SERVICE_NOT_FOUND: 'El servicio seleccionado no está disponible.',
  BOOKING_NOT_ALLOWED: 'No tenés permiso para reservar a nombre de otra persona.',
  BOOKING_CUSTOMER_INVALID: 'No pudimos identificar a la persona para la reserva. Elegí otra.',
  BOOKING_GUEST_INVALID: 'Revisá los datos de la persona: el nombre (mínimo 2 letras) y el email si lo cargaste.',
}

function translateBookingError(err: unknown): Error {
  if (!err || typeof err !== 'object') {
    return new Error('Error al crear el turno.')
  }
  const e = err as { code?: string; message?: string }

  // Exclusion constraint violation
  if (e.code === '23P01') {
    return new Error(
      'El horario seleccionado ya no está disponible. Por favor, seleccioná otro turno.',
    )
  }

  // Unique constraint violation (legacy fallback)
  if (e.code === '23505') {
    return new Error(
      'El horario seleccionado ya no está disponible. Por favor, seleccioná otro turno.',
    )
  }

  // Application-level RAISE errors
  if (e.code === 'P0001') {
    const msg = e.message ?? ''
    if (msg.includes('COUPON_')) {
      return new Error(translateCouponError(msg))
    }
    for (const [key, translation] of Object.entries(BOOKING_ERRORS)) {
      if (msg.includes(key)) {
        return new Error(translation)
      }
    }
  }

  return new Error('Error al crear el turno.')
}

export function isConflictError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { code?: string; message?: string }

  if (e.code === '23P01' || e.code === '23505') return true

  if (e.code === 'P0001') {
    const msg = e.message ?? ''
    return Object.keys(BOOKING_ERRORS).some((key) => msg.includes(key))
  }

  return false
}

export async function createAppointment(params: {
  serviceId: string
  startsAt: string
  /** Optional discount coupon code, validated again on the server. */
  couponCode?: string
  /** Admin/staff only: book for an existing client account instead of for themselves. */
  customerUserId?: string
  /** Admin/staff only: book for a person without an account. */
  guest?: { name: string; phone?: string; email?: string }
}): Promise<NewAppointment> {
  const supabase = initSupabase()

  const { data, error } = await supabase.rpc('create_appointment', {
    p_service_id: params.serviceId,
    p_starts_at: params.startsAt,
    p_coupon_code: params.couponCode?.trim() ? params.couponCode.trim() : null,
    p_customer_user_id: params.customerUserId ?? null,
    p_guest_name: params.guest?.name.trim() || null,
    p_guest_phone: params.guest?.phone?.trim() || null,
    p_guest_email: params.guest?.email?.trim() || null,
  })

  if (error) {
    throw translateBookingError(error)
  }

  const rows = (data ?? []) as AppointmentRow[]
  if (rows.length === 0) {
    throw new Error('No se pudo crear el turno.')
  }

  const row = rows[0]
  return {
    id: row.id,
    serviceId: row.service_id,
    staffMemberId: row.staff_member_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    createdAt: row.created_at,
  }
}

export async function getAppointment(
  appointmentId: string,
): Promise<AppointmentDetail | null> {
  const supabase = initSupabase()

  const { data, error } = await supabase.rpc('get_appointment', {
    p_appointment_id: appointmentId,
  })

  if (error) {
    throw error
  }

  const rows = (data ?? []) as AppointmentDetailRow[]
  if (rows.length === 0) {
    return null
  }

  const row = rows[0]
  return {
    id: row.id,
    serviceId: row.service_id,
    staffMemberId: row.staff_member_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    createdAt: row.created_at,
    customerUserId: row.customer_user_id,
    serviceName: row.service_name,
    serviceDurationMinutes: row.service_duration_minutes,
    servicePriceCents: row.service_price_cents,
    staffDisplayName: row.staff_display_name,
    orgName: row.org_name,
    orgTimezone: row.org_timezone,
    customerName: row.customer_name,
  }
}

export async function rescheduleAppointment(params: {
  appointmentId: string
  newStartsAt: string
}): Promise<RescheduledAppointment> {
  const supabase = initSupabase()

  const { data, error } = await supabase.rpc('reschedule_appointment', {
    p_appointment_id: params.appointmentId,
    p_new_starts_at: params.newStartsAt,
  })

  if (error) {
    throw translateRescheduleError(error)
  }

  const rows = (data ?? []) as RescheduleAppointmentRow[]
  if (rows.length === 0) {
    throw new Error('No se pudo reprogramar el turno.')
  }

  const row = rows[0]
  return {
    id: row.id,
    serviceId: row.service_id,
    staffMemberId: row.staff_member_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    updatedAt: row.updated_at,
  }
}

function toAppointmentSummary(row: AppointmentSummaryRow): AppointmentSummary {
  return {
    id: row.id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    createdAt: row.created_at,
    customerUserId: row.customer_user_id,
    serviceId: row.service_id,
    serviceName: row.service_name,
    serviceDurationMinutes: row.service_duration_minutes,
    servicePriceCents: row.service_price_cents,
    staffDisplayName: row.staff_display_name,
    orgName: row.org_name,
    orgTimezone: row.org_timezone,
    customerName: row.customer_name,
  }
}

export async function listAppointments(): Promise<AppointmentSummary[]> {
  const supabase = initSupabase()

  const { data, error } = await supabase.rpc('list_appointments')

  if (error) {
    throw error
  }

  return ((data ?? []) as AppointmentSummaryRow[]).map(toAppointmentSummary)
}

/** Only the appointments the logged-in user booked as a client, whatever other roles they have. */
export async function listMyCustomerAppointments(): Promise<AppointmentSummary[]> {
  const supabase = initSupabase()

  const { data, error } = await supabase.rpc('list_my_customer_appointments')

  if (error) {
    throw error
  }

  return ((data ?? []) as AppointmentSummaryRow[]).map(toAppointmentSummary)
}

/** Only the appointments where the logged-in user is the professional (admins included). */
export async function listMyStaffAppointments(): Promise<AppointmentSummary[]> {
  const supabase = initSupabase()

  const { data, error } = await supabase.rpc('list_my_staff_appointments')

  if (error) {
    throw error
  }

  return ((data ?? []) as AppointmentSummaryRow[]).map(toAppointmentSummary)
}
