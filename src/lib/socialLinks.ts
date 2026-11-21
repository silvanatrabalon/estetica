export const SOCIAL_NETWORKS = [
  { key: 'instagram', label: 'Instagram', kind: 'url', placeholder: 'https://instagram.com/tu_perfil' },
  { key: 'whatsapp', label: 'WhatsApp', kind: 'phone', placeholder: '5491112345678' },
  { key: 'facebook', label: 'Facebook', kind: 'url', placeholder: 'https://facebook.com/tu_pagina' },
  { key: 'tiktok', label: 'TikTok', kind: 'url', placeholder: 'https://tiktok.com/@tu_usuario' },
  { key: 'youtube', label: 'YouTube', kind: 'url', placeholder: 'https://youtube.com/@tu_canal' },
  { key: 'x', label: 'X (Twitter)', kind: 'url', placeholder: 'https://x.com/tu_usuario' },
  { key: 'website', label: 'Sitio web', kind: 'url', placeholder: 'https://tusitio.com' },
] as const

export type SocialNetworkKey = (typeof SOCIAL_NETWORKS)[number]['key']

export interface SocialLink {
  network: SocialNetworkKey
  value: string
  enabled: boolean
}

export function isSocialNetworkKey(value: unknown): value is SocialNetworkKey {
  return SOCIAL_NETWORKS.some((network) => network.key === value)
}

function getKind(network: SocialNetworkKey): 'url' | 'phone' {
  return SOCIAL_NETWORKS.find((n) => n.key === network)?.kind ?? 'url'
}

/** Digits only, e.g. "+54 9 11 1234-5678" -> "5491112345678". */
export function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/** Trims and, for URLs without a scheme, prepends https://. Empty stays empty. */
export function normalizeSocialValue(network: SocialNetworkKey, value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (getKind(network) === 'phone') return normalizePhoneDigits(trimmed)
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
}

/** Spanish error message, or null when the value is valid. An empty value is valid (means "not set"). */
export function validateSocialValue(network: SocialNetworkKey, value: string): string | null {
  if (!value.trim()) return null
  const normalized = normalizeSocialValue(network, value)

  const label = SOCIAL_NETWORKS.find((n) => n.key === network)?.label ?? network

  if (getKind(network) === 'phone') {
    // Letters-only input normalizes to '' and must be rejected, not treated as "not set"
    return normalized.length >= 8 && normalized.length <= 15
      ? null
      : `Ingresá un número de WhatsApp válido (entre 8 y 15 dígitos, con código de país).`
  }

  try {
    const url = new URL(normalized)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('protocol')
    if (!url.hostname.includes('.')) throw new Error('host')
    return null
  } catch {
    return `Ingresá una URL válida para ${label}.`
  }
}

/** Public link for a stored value, or null if it can't be built safely. */
export function buildSocialHref(network: SocialNetworkKey, value: string): string | null {
  if (validateSocialValue(network, value) || !value.trim()) return null
  const normalized = normalizeSocialValue(network, value)
  return getKind(network) === 'phone' ? `https://wa.me/${normalized}` : normalized
}
