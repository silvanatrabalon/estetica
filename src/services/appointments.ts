import { initSupabase } from '../lib/supabase'

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

const BOOKING_ERRORS: Record<string, string> = {
  BOOKING_NO_STAFF_AVAILABLE:
    'El horario seleccionado ya no está disponible. Por favor, seleccioná otro turno.',
  BOOKING_CAPACITY_EXCEEDED:
    'El turno seleccionado ya no tiene disponibilidad. Por favor, elegí otro.',
  BOOKING_OUTSIDE_POLICY_WINDOW:
    'Este horario ya no está dentro del rango de reservas permitido.',
  BOOKING_SERVICE_NOT_FOUND: 'El servicio seleccionado no está disponible.',
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
}): Promise<NewAppointment> {
  const supabase = initSupabase()

  const { data, error } = await supabase.rpc('create_appointment', {
    p_service_id: params.serviceId,
    p_starts_at: params.startsAt,
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
