import type { DiscountType } from './coupons'

export const COUPON_IMAGE_WIDTH = 1080
/** Instagram story format (9:16). */
export const COUPON_IMAGE_HEIGHT = 1920

export type CouponThemeId =
  | 'base'
  | 'navidad'
  | 'anio-nuevo'
  | 'black-friday'
  | 'cyber-monday'
  | 'dia-madre'
  | 'dia-mujer'

interface CouponTheme {
  id: CouponThemeId
  label: string
  /** Small line above the amount, e.g. "CUPÓN" or "BLACK FRIDAY". */
  kicker: string
  bgFrom: string
  bgTo: string
  card: string
  ink: string
  subtle: string
  accent: string
  /** Text color on top of the accent pill. */
  accentInk: string
  decoration: () => string
}

export interface CouponImageInput {
  theme: CouponThemeId
  code: string
  discountType: DiscountType
  /** percent: 1-100. fixed: cents. */
  discountValue: number
  /** "Todos los servicios" or "Categoría Uñas". */
  scope: string
  /** "Válido del 1 jun 2026 al 31 dic 2026". */
  validity: string
  businessName: string
  /** The business logo as a data: URL (an external URL would block the PNG export). */
  logoDataUrl?: string | null
}

// ── Little shapes used by the decorations ─────────────────────────────────────

const W = COUPON_IMAGE_WIDTH
const H = COUPON_IMAGE_HEIGHT

function star(cx: number, cy: number, r: number, fill: string, opacity = 1): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.42
    const angle = (Math.PI / 5) * i - Math.PI / 2
    pts.push(`${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`)
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" opacity="${opacity}"/>`
}

function sparkle(cx: number, cy: number, r: number, stroke: string): string {
  const lines = [0, 45, 90, 135]
    .map((deg) => {
      const rad = (deg * Math.PI) / 180
      const dx = (r * Math.cos(rad)).toFixed(1)
      const dy = (r * Math.sin(rad)).toFixed(1)
      return `<line x1="${cx - Number(dx)}" y1="${cy - Number(dy)}" x2="${cx + Number(dx)}" y2="${cy + Number(dy)}"/>`
    })
    .join('')
  return `<g stroke="${stroke}" stroke-width="6" stroke-linecap="round">${lines}</g>`
}

function heart(cx: number, cy: number, size: number, fill: string, opacity = 1): string {
  const s = size / 24
  return `<path transform="translate(${cx - 12 * s} ${cy - 12 * s}) scale(${s})" opacity="${opacity}" fill="${fill}" d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/>`
}

function dots(points: Array<[number, number, number]>, fill: string, opacity = 1): string {
  return points.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${opacity}"/>`).join('')
}

function confetti(fills: string[]): string {
  const pieces: string[] = []
  for (let i = 0; i < 70; i += 1) {
    // deterministic pseudo-random placement, so the same coupon always gives the same image
    const x = (i * 197) % W
    const y = (i * 331 + 40) % H
    const fill = fills[i % fills.length]
    const rot = (i * 53) % 180
    pieces.push(`<rect x="${x}" y="${y}" width="16" height="30" rx="3" fill="${fill}" opacity="0.75" transform="rotate(${rot} ${x} ${y})"/>`)
  }
  return pieces.join('')
}

function snowflake(cx: number, cy: number, r: number): string {
  const arms = [0, 60, 120]
    .map((deg) => {
      const rad = (deg * Math.PI) / 180
      const dx = r * Math.cos(rad)
      const dy = r * Math.sin(rad)
      return `<line x1="${(cx - dx).toFixed(1)}" y1="${(cy - dy).toFixed(1)}" x2="${(cx + dx).toFixed(1)}" y2="${(cy + dy).toFixed(1)}"/>`
    })
    .join('')
  return `<g stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.85">${arms}</g>`
}

function balloon(cx: number, cy: number, r: number, fill: string): string {
  return `<g><ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 1.15}" fill="${fill}"/><ellipse cx="${cx - r * 0.35}" cy="${cy - r * 0.45}" rx="${r * 0.28}" ry="${r * 0.4}" fill="#ffffff" opacity="0.18"/><path d="M${cx} ${cy + r * 1.15} q-14 70 6 140" fill="none" stroke="${fill}" stroke-width="4"/></g>`
}

// ── Themes ────────────────────────────────────────────────────────────────────

const THEMES: CouponTheme[] = [
  {
    id: 'base',
    label: 'Base',
    kicker: 'CUPÓN',
    bgFrom: '#f6e3d4',
    bgTo: '#d9b8ee',
    card: '#ffffff',
    ink: '#3a2a52',
    subtle: '#7a6a93',
    accent: '#e6dff1',
    accentInk: '#3a2a52',
    decoration: () =>
      dots([[120, 240, 90], [980, 440, 60], [900, 1680, 110], [90, 1480, 50], [160, 900, 70], [1000, 1150, 40]], '#ffffff', 0.35) +
      sparkle(940, 230, 34, '#ffffff') +
      sparkle(130, 1760, 28, '#fff3b0') +
      sparkle(980, 1500, 24, '#ffffff') +
      heart(160, 520, 70, '#ffffff', 0.7) +
      heart(920, 1600, 56, '#ffffff', 0.6),
  },
  {
    id: 'navidad',
    label: 'Navidad',
    kicker: 'NAVIDAD',
    bgFrom: '#0f5a3a',
    bgTo: '#8c1d2c',
    card: '#fffaf0',
    ink: '#7a1626',
    subtle: '#5b6b5e',
    accent: '#0f5a3a',
    accentInk: '#ffffff',
    decoration: () =>
      star(930, 250, 62, '#ffd34d') +
      [[130, 330, 40], [930, 520, 30], [220, 1620, 36], [880, 1700, 44], [90, 980, 26], [990, 1120, 28], [330, 220, 22], [770, 260, 24], [110, 1380, 30], [960, 1450, 26]]
        .map(([x, y, r]) => snowflake(x, y, r))
        .join('') +
      dots([[160, 1440, 24], [190, 1470, 18], [920, 1420, 22]], '#d7263d', 0.9),
  },
  {
    id: 'anio-nuevo',
    label: 'Año nuevo',
    kicker: 'AÑO NUEVO',
    bgFrom: '#0b1a3a',
    bgTo: '#2a1b5c',
    card: '#fff8e1',
    ink: '#1a2547',
    subtle: '#6b6270',
    accent: '#f3c13a',
    accentInk: '#1a2547',
    decoration: () =>
      confetti(['#f3c13a', '#ffffff', '#e86aa7', '#6bd3f0']) +
      star(150, 250, 50, '#f3c13a') +
      star(930, 1700, 56, '#f3c13a') +
      sparkle(930, 250, 36, '#ffffff') +
      sparkle(140, 1650, 30, '#ffffff'),
  },
  {
    id: 'black-friday',
    label: 'Black Friday',
    kicker: 'BLACK FRIDAY',
    bgFrom: '#ffffff',
    bgTo: '#e9e9ee',
    card: '#1c1c1f',
    ink: '#ffffff',
    subtle: '#c9c9d1',
    accent: '#ef5350',
    accentInk: '#ffffff',
    decoration: () =>
      `<path d="M120 0 L420 0 L700 ${H} L400 ${H} Z" fill="#ef5350" opacity="0.8"/>` +
      `<path d="M820 0 L1080 0 L1080 260 Z" fill="#ef5350" opacity="0.8"/>` +
      confetti(['#2b2b30']) +
      balloon(110, 380, 90, '#2b2b30') +
      balloon(970, 1500, 100, '#2b2b30') +
      balloon(880, 430, 64, '#3a3a40') +
      balloon(180, 1520, 60, '#3a3a40'),
  },
  {
    id: 'cyber-monday',
    label: 'Cyber Monday',
    kicker: 'CYBER MONDAY',
    bgFrom: '#070b2a',
    bgTo: '#143c8a',
    card: '#0d1440',
    ink: '#ffffff',
    subtle: '#9fb4e8',
    accent: '#22d3ee',
    accentInk: '#06122e',
    decoration: () =>
      `<g stroke="#22d3ee" stroke-width="2" opacity="0.28">${Array.from({ length: Math.ceil(H / 100) + 1 }, (_, i) => `<line x1="0" y1="${i * 100}" x2="${W}" y2="${i * 100}"/>`).join('')}${Array.from({ length: 11 }, (_, i) => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="${H}"/>`).join('')}</g>` +
      dots([[130, 280, 14], [950, 420, 10], [160, 1700, 12], [940, 1640, 16]], '#22d3ee', 0.9) +
      `<path d="M50 200 h160 M50 240 h100" stroke="#22d3ee" stroke-width="8" stroke-linecap="round"/>` +
      `<path d="M1030 1780 h-160 M1030 1740 h-100" stroke="#e86aa7" stroke-width="8" stroke-linecap="round"/>`,
  },
  {
    id: 'dia-madre',
    label: 'Día de la madre',
    kicker: 'DÍA DE LA MADRE',
    bgFrom: '#ffe3ea',
    bgTo: '#f7a9c4',
    card: '#fffafb',
    ink: '#8a1f4a',
    subtle: '#8c6a77',
    accent: '#f7a9c4',
    accentInk: '#6e1038',
    decoration: () =>
      heart(140, 270, 110, '#ffffff', 0.7) +
      heart(930, 400, 70, '#e8588d', 0.85) +
      heart(990, 1600, 120, '#ffffff', 0.7) +
      heart(150, 1560, 80, '#e8588d', 0.85) +
      heart(860, 230, 46, '#e8588d', 0.8) +
      heart(120, 1000, 54, '#ffffff', 0.5) +
      sparkle(900, 160, 24, '#ffffff'),
  },
  {
    id: 'dia-mujer',
    label: 'Día de la mujer',
    kicker: 'DÍA DE LA MUJER',
    bgFrom: '#5b2a86',
    bgTo: '#c23a9a',
    card: '#fff7fd',
    ink: '#4a1f6e',
    subtle: '#7d5e92',
    accent: '#c23a9a',
    accentInk: '#ffffff',
    decoration: () => {
      const flower = (cx: number, cy: number, r: number, fill: string) =>
        [0, 72, 144, 216, 288]
          .map((deg) => {
            const rad = (deg * Math.PI) / 180
            return `<circle cx="${(cx + r * Math.cos(rad)).toFixed(1)}" cy="${(cy + r * Math.sin(rad)).toFixed(1)}" r="${r * 0.8}" fill="${fill}" opacity="0.85"/>`
          })
          .join('') + `<circle cx="${cx}" cy="${cy}" r="${r * 0.6}" fill="#ffd34d"/>`
      return flower(130, 290, 40, '#ffffff') + flower(950, 410, 30, '#ffffff') + flower(160, 1640, 34, '#ffffff') + flower(930, 1700, 46, '#ffffff') + flower(110, 1000, 26, '#ffffff') + sparkle(960, 220, 26, '#ffd34d')
    },
  },
]

export const COUPON_THEMES: ReadonlyArray<{ id: CouponThemeId; label: string; swatch: [string, string] }> = THEMES.map(
  (t) => ({ id: t.id, label: t.label, swatch: [t.bgFrom, t.bgTo] as [string, string] }),
)

export function getCouponTheme(id: string): CouponTheme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}

// ── SVG ───────────────────────────────────────────────────────────────────────

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const pesos = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })

/** The big text: "20%" or "$ 2.000". */
export function amountText(type: DiscountType, value: number): string {
  return type === 'percent' ? `${value}%` : `$ ${pesos.format(value / 100)}`
}

function fitFontSize(text: string, max: number, widthBudget: number, factor = 0.58): number {
  return Math.max(60, Math.min(max, Math.floor(widthBudget / (Math.max(text.length, 1) * factor))))
}

/** Cuts a long line so it does not overflow the ticket. */
function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

/** The coupon as a 1080x1920 (Instagram story) SVG: themed background, ticket with the discount, code and conditions. */
export function buildCouponSvg(input: CouponImageInput): string {
  const t = getCouponTheme(input.theme)
  const amount = amountText(input.discountType, input.discountValue)
  const amountSize = fitFontSize(amount, 260, 700)
  const code = escapeXml(input.code)
  const codeSize = fitFontSize(input.code, 64, 560, 0.7)

  // Ticket with a notch on each side
  const x = 110
  const y = 470
  const w = W - 220
  const h = 960
  const notchY = y + 480
  const ticket =
    `M${x + 40} ${y} H${x + w - 40} Q${x + w} ${y} ${x + w} ${y + 40} V${notchY - 36} ` +
    `A36 36 0 0 0 ${x + w} ${notchY + 36} V${y + h - 40} Q${x + w} ${y + h} ${x + w - 40} ${y + h} ` +
    `H${x + 40} Q${x} ${y + h} ${x} ${y + h - 40} V${notchY + 36} A36 36 0 0 0 ${x} ${notchY - 36} V${y + 40} Q${x} ${y} ${x + 40} ${y} Z`

  // Logo in a white circle above the ticket (only when there is one)
  const logo = input.logoDataUrl
    ? `<defs><clipPath id="logoClip"><circle cx="${W / 2}" cy="335" r="80"/></clipPath></defs>
<circle cx="${W / 2}" cy="335" r="90" fill="#ffffff"/>
<image href="${escapeXml(input.logoDataUrl)}" x="${W / 2 - 80}" y="255" width="160" height="160" preserveAspectRatio="xMidYMid slice" clip-path="url(#logoClip)"/>`
    : ''

  const font = "'Helvetica Neue', Helvetica, Arial, sans-serif"

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${font}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.bgFrom}"/><stop offset="1" stop-color="${t.bgTo}"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${t.decoration()}
${logo}
<path d="${ticket}" fill="${t.card}" transform="translate(0 14)" opacity="0.18"/>
<path d="${ticket}" fill="${t.card}"/>
<text x="${W / 2}" y="${y + 110}" text-anchor="middle" font-size="40" font-weight="700" letter-spacing="12" fill="${t.subtle}">${escapeXml(t.kicker)}</text>
<text x="${W / 2}" y="${y + 110 + amountSize * 0.95}" text-anchor="middle" font-size="${amountSize}" font-weight="800" fill="${t.ink}">${escapeXml(amount)}</text>
<text x="${W / 2}" y="${y + 110 + amountSize * 0.95 + 70}" text-anchor="middle" font-size="46" fill="${t.ink}">de descuento</text>
<line x1="${x + 60}" y1="${notchY}" x2="${x + w - 60}" y2="${notchY}" stroke="${t.subtle}" stroke-width="3" stroke-dasharray="14 12" opacity="0.6"/>
<text x="${W / 2}" y="${notchY + 82}" text-anchor="middle" font-size="30" letter-spacing="6" fill="${t.subtle}">TU CÓDIGO</text>
<rect x="${W / 2 - 300}" y="${notchY + 110}" width="600" height="112" rx="56" fill="${t.accent}"/>
<text x="${W / 2}" y="${notchY + 110 + 56 + codeSize * 0.35}" text-anchor="middle" font-size="${codeSize}" font-weight="800" letter-spacing="4" font-family="'Courier New', Courier, monospace" fill="${t.accentInk}">${code}</text>
<text x="${W / 2}" y="${notchY + 290}" text-anchor="middle" font-size="34" fill="${t.ink}">${escapeXml(clip(input.scope, 44))}</text>
<text x="${W / 2}" y="${notchY + 336}" text-anchor="middle" font-size="30" fill="${t.subtle}">${escapeXml(clip(input.validity, 52))}</text>
<text x="${W / 2}" y="${H - 380}" text-anchor="middle" font-size="50" font-weight="800" fill="${t.id === 'black-friday' ? '#1c1c1f' : '#ffffff'}">${escapeXml(clip(input.businessName, 30))}</text>
<text x="${W / 2}" y="${H - 325}" text-anchor="middle" font-size="30" fill="${t.id === 'black-friday' ? '#55555c' : '#ffffff'}" opacity="0.85">Mencioná el código al reservar tu turno</text>
</svg>`
}

// ── Files ─────────────────────────────────────────────────────────────────────

/** "cupon-verano10-navidad" for the downloaded file (no extension). */
export function couponFileName(code: string, theme: CouponThemeId): string {
  const safe = code.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'cupon'
  return `cupon-${safe}-${theme}`
}

/** Draws the SVG on a canvas and returns it as a PNG. Rejects if the browser cannot do it. */
export function svgToPngBlob(svg: string, scale = 1): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = COUPON_IMAGE_WIDTH * scale
        canvas.height = COUPON_IMAGE_HEIGHT * scale
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('canvas-unavailable')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('png-failed'))), 'image/png')
      } catch (err) {
        reject(err instanceof Error ? err : new Error('png-failed'))
      } finally {
        URL.revokeObjectURL(url)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image-load-failed'))
    }
    img.src = url
  })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Fetches an image and returns it as a data: URL, or null if it cannot be read (no CORS, offline, not an image). */
export async function loadImageAsDataUrl(url: string): Promise<string | null> {
  if (!url) return null
  if (url.startsWith('data:image/')) return url
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    if (!blob.type.startsWith('image/')) return null
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}
