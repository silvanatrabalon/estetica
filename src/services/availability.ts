import { initSupabase } from '../lib/supabase'

export interface AvailableSlot {
  starts_at: string
  ends_at: string
}

/**
 * Calls the get_available_slots SECURITY DEFINER RPC and returns available
 * time slots for the given service and date.
 *
 * @param serviceId - UUID of the service
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns Array of available slots, empty if none available
 * @throws Error if the RPC call fails
 */
export async function getAvailableSlots(
  serviceId: string,
  date: string,
): Promise<AvailableSlot[]> {
  const supabase = initSupabase()

  const { data, error } = await supabase.rpc('get_available_slots', {
    p_service_id: serviceId,
    p_date: date,
  })

  if (error) {
    console.error('[getAvailableSlots] Supabase error:', error)
    throw error
  }

  return (data as AvailableSlot[]) ?? []
}
