import { initSupabase } from '../lib/supabase'

export interface BookingClient {
  /** 'account': a client account. 'guest': a person without account booked before. */
  kind: 'account' | 'guest'
  /** Set for accounts, null for people without account. */
  userId: string | null
  /** May be empty when the account has no name yet. */
  name: string
  email: string | null
  phone: string | null
  /** false for deactivated accounts. */
  isActive: boolean
}

/**
 * Everyone admin and staff can book for: client accounts (deactivated ones too) and the people
 * without account that were booked before. Throws if the caller is not admin or staff.
 */
export async function listBookingClients(): Promise<BookingClient[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('list_booking_clients')
  if (error) throw new Error(error.message)

  return ((data ?? []) as Array<{
    kind?: 'account' | 'guest'
    user_id: string | null
    name: string | null
    email: string | null
    phone?: string | null
    is_active?: boolean | null
  }>).map((row) => ({
    kind: row.kind ?? 'account',
    userId: row.user_id,
    name: row.name ?? '',
    email: row.email,
    phone: row.phone ?? null,
    isActive: row.is_active !== false,
  }))
}

/** What to show for a client in a list: name (or email), plus a note for guests and deactivated accounts. */
export function clientLabel(client: BookingClient): string {
  const name = client.name.trim()
  const base = name && client.email ? `${name} (${client.email})` : name || client.email || 'Cliente sin nombre'
  if (client.kind === 'guest') return `${base} · sin cuenta`
  return client.isActive ? base : `${base} · inactivo`
}
