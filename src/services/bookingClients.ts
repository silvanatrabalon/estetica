import { initSupabase } from '../lib/supabase'

export interface BookingClient {
  userId: string
  /** May be empty when the account has no name yet. */
  name: string
  email: string | null
}

/** Client accounts that admin and staff can book for. Throws if the caller is not admin or staff. */
export async function listBookingClients(): Promise<BookingClient[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('list_booking_clients')
  if (error) throw new Error(error.message)

  return ((data ?? []) as Array<{ user_id: string; name: string | null; email: string | null }>).map((row) => ({
    userId: row.user_id,
    name: row.name ?? '',
    email: row.email,
  }))
}

/** What to show for a client in a list: name, or the email when there is no name. */
export function clientLabel(client: BookingClient): string {
  const name = client.name.trim()
  if (name && client.email) return `${name} (${client.email})`
  return name || client.email || 'Cliente sin nombre'
}
