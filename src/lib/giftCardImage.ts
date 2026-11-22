import { clip, escapeXml } from './couponImage'

export const GIFT_CARD_WIDTH = 1600
export const GIFT_CARD_HEIGHT = 1000

export type GiftCardThemeId = 'rosa' | 'dorado' | 'lila'

interface GiftCardTheme {
  id: GiftCardThemeId
  label: string
  paper: string
  ribbon: string
  ink: string
  accent: string
  subtle: string
}

export interface GiftCardInput {
  theme: GiftCardThemeId
  /** Who receives it. */
  recipient: string
  /** Who gives it (optional). */
  sender: string
  /** What it is for: a service name, or an amount. */
  gift: { kind: 'service'; name: string } | { kind: 'amount'; cents: number }
  /** Optional dedication. */
  message: string
  /** Optional, already formatted: "Válida hasta el 31 dic 2026". */
  validity: string
  businessName: string
  logoDataUrl?: string | null
}

const THEMES: GiftCardTheme[] = [
  { id: 'rosa', label: 'Rosa', paper: '#ece9e6', ribbon: '#e4dfdb', ink: '#2a2326', accent: '#c9505f', subtle: '#6f6468' },
  { id: 'dorado', label: 'Dorado', paper: '#f5f0e4', ribbon: '#ebe3d0', ink: '#2b2a28', accent: '#b0883a', subtle: '#6f6a5c' },
  { id: 'lila', label: 'Lila', paper: '#efeaf6', ribbon: '#e2daee', ink: '#2f2542', accent: '#7a4fb0', subtle: '#6e6485' },
]

export const GIFT_CARD_THEMES: ReadonlyArray<{ id: GiftCardThemeId; label: string; swatch: string }> = THEMES.map(
  (t) => ({ id: t.id, label: t.label, swatch: t.accent }),
)

export function getGiftCardTheme(id: string): GiftCardTheme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}

const pesos = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })

/** What the card is for, as text: the service name or "$ 5.000". */
export function giftText(gift: GiftCardInput['gift']): string {
  return gift.kind === 'service' ? gift.name : `$ ${pesos.format(gift.cents / 100)}`
}

/** Splits a text into at most `maxLines` lines of about `perLine` characters; the last one is clipped. */
export function wrapText(text: string, perLine: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length <= perLine || !current) {
      current = next
    } else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    kept[maxLines - 1] = clip(`${kept[maxLines - 1]} ${lines.slice(maxLines).join(' ')}`, perLine)
    return kept
  }
  return lines.map((line) => clip(line, perLine))
}

function bow(cx: number, cy: number, t: GiftCardTheme): string {
  const stroke = `fill="${t.paper}" stroke="${t.accent}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"`
  return `<g>
<rect x="${cx - 55}" y="0" width="110" height="${GIFT_CARD_HEIGHT}" fill="${t.ribbon}" stroke="${t.accent}" stroke-width="7"/>
<path ${stroke} d="M${cx - 24} ${cy - 4} C${cx - 130} ${cy - 170} ${cx - 300} ${cy - 130} ${cx - 285} ${cy - 20} C${cx - 275} ${cy + 60} ${cx - 140} ${cy + 50} ${cx - 24} ${cy + 14} Z"/>
<path ${stroke} d="M${cx + 24} ${cy - 4} C${cx + 130} ${cy - 170} ${cx + 300} ${cy - 130} ${cx + 285} ${cy - 20} C${cx + 275} ${cy + 60} ${cx + 140} ${cy + 50} ${cx + 24} ${cy + 14} Z"/>
<path ${stroke} d="M${cx - 18} ${cy + 30} C${cx - 140} ${cy + 80} ${cx - 270} ${cy + 170} ${cx - 245} ${cy + 220} C${cx - 215} ${cy + 250} ${cx - 110} ${cy + 140} ${cx - 8} ${cy + 46} Z"/>
<path ${stroke} d="M${cx + 18} ${cy + 30} C${cx + 140} ${cy + 80} ${cx + 270} ${cy + 170} ${cx + 245} ${cy + 220} C${cx + 215} ${cy + 250} ${cx + 110} ${cy + 140} ${cx + 8} ${cy + 46} Z"/>
<rect ${stroke} x="${cx - 40}" y="${cy - 40}" width="80" height="80" rx="26"/>
</g>`
}

/** The gift card as a 1600x1000 SVG: paper background, ribbon and bow, who it is for, what, and from whom. */
export function buildGiftCardSvg(input: GiftCardInput): string {
  const t = getGiftCardTheme(input.theme)
  const W = GIFT_CARD_WIDTH
  const H = GIFT_CARD_HEIGHT
  const serif = "Georgia, 'Times New Roman', serif"
  const gift = giftText(input.gift)
  const giftLines = wrapText(gift, input.gift.kind === 'amount' ? 12 : 30, 2)
  const giftSize = input.gift.kind === 'amount' ? 80 : giftLines.length > 1 ? 56 : 68
  const recipient = clip(input.recipient.trim(), 28)
  const sender = clip(input.sender.trim(), 30)
  const messageLines = wrapText(input.message, 58, 2)

  const logo = input.logoDataUrl
    ? `<defs><clipPath id="gcLogo"><circle cx="175" cy="150" r="62"/></clipPath></defs>
<circle cx="175" cy="150" r="66" fill="#ffffff" stroke="${t.accent}" stroke-width="4"/>
<image href="${escapeXml(input.logoDataUrl)}" x="113" y="88" width="124" height="124" preserveAspectRatio="xMidYMid slice" clip-path="url(#gcLogo)"/>`
    : ''
  const businessX = input.logoDataUrl ? 265 : 110

  // Vertical layout: each block starts where the previous one ends, so nothing overlaps
  let y = 330
  const parts: string[] = []
  parts.push(`<text x="110" y="${y}" font-size="30" letter-spacing="8" fill="${t.subtle}" font-family="${serif}">PARA</text>`)
  y += 72
  parts.push(`<text x="110" y="${y}" font-size="72" fill="${t.ink}" font-family="${serif}" font-style="italic">${escapeXml(recipient)}</text>`)
  y += 135
  parts.push(`<text x="104" y="${y}" font-size="150" fill="${t.ink}" font-family="${serif}" letter-spacing="4">GIFT CARD</text>`)
  y += 36
  parts.push(`<rect x="110" y="${y}" width="150" height="6" fill="${t.accent}"/>`)
  y += 36
  giftLines.forEach((line, i) => {
    parts.push(`<text x="110" y="${y + giftSize * 0.8 + i * (giftSize + 8)}" font-size="${giftSize}" fill="${t.accent}" font-family="${serif}">${escapeXml(line)}</text>`)
  })
  y += giftLines.length * (giftSize + 8) + 22
  if (sender) {
    parts.push(`<text x="110" y="${y + 34}" font-size="40" fill="${t.ink}" font-family="${serif}">De parte de <tspan font-style="italic" fill="${t.accent}">${escapeXml(sender)}</tspan></text>`)
    y += 58
  }
  messageLines.forEach((line, i) => {
    parts.push(`<text x="110" y="${y + 30 + i * 42}" font-size="30" fill="${t.subtle}" font-family="${serif}" font-style="italic">${escapeXml(line)}</text>`)
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
<filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.4  0 0 0 0.09 0"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="${t.paper}"/>
<rect width="${W}" height="${H}" filter="url(#paper)"/>
${bow(1340, 270, t)}
${logo}
<text x="${businessX}" y="${input.logoDataUrl ? 165 : 150}" font-size="38" letter-spacing="3" fill="${t.accent}" font-family="${serif}">${escapeXml(clip(input.businessName.toUpperCase(), 26))}</text>
${parts.join('\n')}
${input.validity ? `<text x="110" y="${H - 60}" font-size="28" letter-spacing="2" fill="${t.subtle}" font-family="${serif}">${escapeXml(clip(input.validity, 60))}</text>` : ''}
<rect x="22" y="22" width="${W - 44}" height="${H - 44}" fill="none" stroke="${t.accent}" stroke-width="3" opacity="0.35"/>
</svg>`
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** "2026-12-31" -> "Válida hasta el 31 dic 2026"; empty or invalid input gives an empty text. */
export function giftValidityText(day: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!match) return ''
  const month = Number(match[2])
  if (month < 1 || month > 12) return ''
  return `Válida hasta el ${Number(match[3])} ${MONTHS[month - 1]} ${match[1]}`
}

/** "gift-card-ana-perez" for the downloaded file (no extension). */
export function giftCardFileName(recipient: string): string {
  const safe =
    recipient
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'regalo'
  return `gift-card-${safe}`
}
