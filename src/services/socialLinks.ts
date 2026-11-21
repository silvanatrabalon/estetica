import { initSupabase } from '../lib/supabase'
import {
  SOCIAL_NETWORKS,
  isSocialNetworkKey,
  normalizeSocialValue,
  validateSocialValue,
  type SocialLink,
} from '../lib/socialLinks'

interface SocialLinkRow {
  network: string
  value: string
  enabled: boolean
}

function sortByNetworkOrder(links: SocialLink[]): SocialLink[] {
  const order = SOCIAL_NETWORKS.map((n) => n.key as string)
  return [...links].sort((a, b) => order.indexOf(a.network) - order.indexOf(b.network))
}

function toLinks(rows: SocialLinkRow[] | null): SocialLink[] {
  const links: SocialLink[] = []
  for (const row of rows ?? []) {
    if (isSocialNetworkKey(row.network) && row.value?.trim()) {
      links.push({ network: row.network, value: row.value, enabled: row.enabled })
    }
  }
  return sortByNetworkOrder(links)
}

/** Links visitors can see: only networks the admin chose to show. */
export async function getPublicSocialLinks(): Promise<SocialLink[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase
    .from('social_links')
    .select('network, value, enabled')
    .eq('enabled', true)

  if (error) {
    throw error
  }

  return toLinks(data as SocialLinkRow[] | null)
}

/** All configured links, shown or hidden (admin only; RLS hides hidden ones from others). */
export async function getSocialLinks(): Promise<SocialLink[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase.from('social_links').select('network, value, enabled')

  if (error) {
    throw error
  }

  return toLinks(data as SocialLinkRow[] | null)
}

/**
 * Saves the full set of links. Networks with an empty value are removed.
 * Validates everything before touching the database.
 */
export async function saveSocialLinks(links: SocialLink[]): Promise<void> {
  for (const link of links) {
    const message = validateSocialValue(link.network, link.value)
    if (message) {
      throw new Error(message)
    }
  }

  const toSave = links
    .map((link) => ({ ...link, value: normalizeSocialValue(link.network, link.value) }))
    .filter((link) => link.value !== '')
  const toRemove = links
    .filter((link) => normalizeSocialValue(link.network, link.value) === '')
    .map((link) => link.network)

  const supabase = initSupabase()

  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string }>()

  if (orgError) {
    throw orgError
  }
  if (!organization) {
    throw new Error('No se encontró el negocio.')
  }

  if (toSave.length > 0) {
    const now = new Date().toISOString()
    const { error } = await supabase.from('social_links').upsert(
      toSave.map((link) => ({
        organization_id: organization.id,
        network: link.network,
        value: link.value,
        enabled: link.enabled,
        updated_at: now,
      })),
      { onConflict: 'organization_id,network' },
    )
    if (error) {
      throw error
    }
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('social_links')
      .delete()
      .eq('organization_id', organization.id)
      .in('network', toRemove)
    if (error) {
      throw error
    }
  }
}
