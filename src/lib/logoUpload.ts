export const LOGO_MAX_BYTES = 2 * 1024 * 1024 // 2 MB (bucket limit is 10 MB; logos should be small)
export const LOGO_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const

/** Returns a Spanish error message, or null when the file is acceptable. */
export function validateLogoFile(file: { type: string; size: number }): string | null {
  if (!(LOGO_ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return 'El logo debe ser una imagen JPG, PNG, WEBP o GIF.'
  }
  if (file.size <= 0) {
    return 'El archivo está vacío.'
  }
  if (file.size > LOGO_MAX_BYTES) {
    return 'El logo no puede superar los 2 MB.'
  }
  return null
}

/** Storage path for a logo; timestamp avoids stale CDN/browser cache on replacement. */
export function buildLogoPath(fileName: string, now: number = Date.now()): string {
  const rawExt = fileName.includes('.') ? (fileName.split('.').pop() ?? '') : ''
  const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png'
  return `logo/logo-${now}.${ext}`
}
