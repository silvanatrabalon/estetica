import { initSupabase } from '../lib/supabase'
import type { CarouselImage, LandingConfig } from './landing'

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

export async function adminGetLandingConfig(): Promise<LandingConfig> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_get_landing_config')

  if (error) {
    throw error
  }

  const rows = data as LandingConfigRow[] | null
  if (!rows || rows.length === 0) {
    return DEFAULT_LANDING_CONFIG
  }

  return toLandingConfig(rows[0])
}

export interface UpsertLandingConfigParams {
  heroTitle?: string | null
  heroSubtitle?: string | null
  aboutText?: string | null
  instagramUrl?: string | null
  whatsappNumber?: string | null
  primaryColor?: string
  secondaryColor?: string
  fontFamily?: string
  showHours?: boolean
}

export async function adminUpsertLandingConfig(params: UpsertLandingConfigParams): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase.rpc('admin_upsert_landing_config', {
    p_hero_title: params.heroTitle ?? null,
    p_hero_subtitle: params.heroSubtitle ?? null,
    p_about_text: params.aboutText ?? null,
    p_instagram_url: params.instagramUrl ?? null,
    p_whatsapp_number: params.whatsappNumber ?? null,
    p_primary_color: params.primaryColor ?? '#f9a8d4',
    p_secondary_color: params.secondaryColor ?? '#fbcfe8',
    p_font_family: params.fontFamily ?? 'Inter',
    p_show_hours: params.showHours ?? true,
  })

  if (error) {
    throw error
  }
}

export async function adminAddCarouselImage(
  storagePath: string,
  altText?: string | null,
): Promise<CarouselImage> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_add_carousel_image', {
    p_storage_path: storagePath,
    p_alt_text: altText ?? null,
  })

  if (error) {
    throw error
  }

  const rows = data as CarouselImageRaw[] | null
  if (!rows || rows.length === 0) {
    throw new Error('No se pudo agregar la imagen al carrusel.')
  }

  return toCarouselImage(rows[0])
}

export async function adminRemoveCarouselImage(imageId: string): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase.rpc('admin_remove_carousel_image', {
    p_image_id: imageId,
  })

  if (error) {
    throw error
  }
}

export async function adminReorderCarouselImages(orderedIds: string[]): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase.rpc('admin_reorder_carousel_images', {
    p_ordered_ids: orderedIds,
  })

  if (error) {
    throw error
  }
}

export async function uploadMediaFile(bucket: string, path: string, file: File): Promise<string> {
  const supabase = initSupabase()

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  })

  if (error) {
    throw error
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteMediaFile(bucket: string, path: string): Promise<void> {
  const supabase = initSupabase()

  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    throw error
  }
}
