import { initSupabase } from '../lib/supabase'
import { validateBrandTexts } from '../lib/brand'

export interface BrandSettings {
  logoUrl: string | null
  bookingHeaderText: string | null
  bookingSubtitleText: string | null
}

interface BrandRow {
  id: string
  logo_url: string | null
  booking_header_text: string | null
  booking_subtitle_text: string | null
}

function clean(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim()
  return trimmed === '' ? null : trimmed
}

async function fetchBrandRow(): Promise<BrandRow | null> {
  const supabase = initSupabase()
  const { data, error } = await supabase
    .from('organizations')
    .select('id, logo_url, booking_header_text, booking_subtitle_text')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle<BrandRow>()

  if (error) {
    throw error
  }
  return data
}

/** Public, read-only branding (organizations are readable by everyone). */
export async function getBrandSettings(): Promise<BrandSettings> {
  const row = await fetchBrandRow()
  return {
    logoUrl: clean(row?.logo_url),
    bookingHeaderText: clean(row?.booking_header_text),
    bookingSubtitleText: clean(row?.booking_subtitle_text),
  }
}

export interface PublicIdentity {
  name: string | null
  logoUrl: string | null
  address: string | null
}

/** Name, logo and address for the public page (organizations are readable by everyone). Never throws: the page works without them. */
export async function getPublicIdentity(): Promise<PublicIdentity> {
  try {
    const { data } = await initSupabase()
      .from('organizations')
      .select('name, logo_url, address')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle<{ name: string | null; logo_url: string | null; address: string | null }>()
    return { name: clean(data?.name), logoUrl: clean(data?.logo_url), address: clean(data?.address) }
  } catch {
    return { name: null, logoUrl: null, address: null }
  }
}

/** Saves logo and booking texts only; never touches business rules. */
export async function saveBrandSettings(input: BrandSettings): Promise<void> {
  const message = validateBrandTexts(input)
  if (message) {
    throw new Error(message)
  }

  const row = await fetchBrandRow()
  if (!row) {
    throw new Error('No se encontró el negocio.')
  }

  const supabase = initSupabase()
  const { error } = await supabase
    .from('organizations')
    .update({
      logo_url: clean(input.logoUrl),
      booking_header_text: clean(input.bookingHeaderText),
      booking_subtitle_text: clean(input.bookingSubtitleText),
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)

  if (error) {
    throw error
  }
}
