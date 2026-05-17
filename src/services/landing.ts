import { initSupabase } from '../lib/supabase'

export interface CarouselImage {
  id: string
  organizationId: string
  storagePath: string
  displayOrder: number
  altText: string | null
  createdAt: string
}

export interface LandingConfig {
  id: string | null
  organizationId: string | null
  heroTitle: string | null
  heroSubtitle: string | null
  aboutText: string | null
  instagramUrl: string | null
  whatsappNumber: string | null
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  showHours: boolean
  carouselImages: CarouselImage[]
}

interface LandingConfigRow {
  id: string | null
  organization_id: string | null
  hero_title: string | null
  hero_subtitle: string | null
  about_text: string | null
  instagram_url: string | null
  whatsapp_number: string | null
  primary_color: string
  secondary_color: string
  font_family: string
  show_hours: boolean
  carousel_images: CarouselImageRaw[]
}

interface CarouselImageRaw {
  id: string
  organization_id: string
  storage_path: string
  display_order: number
  alt_text: string | null
  created_at: string
}

function toCarouselImage(raw: CarouselImageRaw): CarouselImage {
  return {
    id: raw.id,
    organizationId: raw.organization_id,
    storagePath: raw.storage_path,
    displayOrder: raw.display_order,
    altText: raw.alt_text,
    createdAt: raw.created_at,
  }
}

function toLandingConfig(row: LandingConfigRow): LandingConfig {
  return {
    id: row.id,
    organizationId: row.organization_id,
    heroTitle: row.hero_title,
    heroSubtitle: row.hero_subtitle,
    aboutText: row.about_text,
    instagramUrl: row.instagram_url,
    whatsappNumber: row.whatsapp_number,
    primaryColor: row.primary_color ?? '#f9a8d4',
    secondaryColor: row.secondary_color ?? '#fbcfe8',
    fontFamily: row.font_family ?? 'Inter',
    showHours: row.show_hours ?? true,
    carouselImages: (row.carousel_images ?? []).map(toCarouselImage),
  }
}

const DEFAULT_LANDING_CONFIG: LandingConfig = {
  id: null,
  organizationId: null,
  heroTitle: null,
  heroSubtitle: null,
  aboutText: null,
  instagramUrl: null,
  whatsappNumber: null,
  primaryColor: '#f9a8d4',
  secondaryColor: '#fbcfe8',
  fontFamily: 'Inter',
  showHours: true,
  carouselImages: [],
}

export async function getLandingConfig(): Promise<LandingConfig> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('get_landing_config')

  if (error) {
    throw error
  }

  const rows = data as LandingConfigRow[] | null
  if (!rows || rows.length === 0) {
    return DEFAULT_LANDING_CONFIG
  }

  return toLandingConfig(rows[0])
}
