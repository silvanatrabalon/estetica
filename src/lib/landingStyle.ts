export interface TitlePart {
  text: string
  accent: boolean
}

/**
 * Splits a title into plain and accented (italic, in the main color) parts.
 * The admin marks the accent with asterisks: "Donde la *belleza* se vuelve arte".
 * Without asterisks the last word is the accent, so every title gets the same look.
 */
export function splitAccentTitle(title: string): TitlePart[] {
  const text = title.trim()
  if (!text) return []

  const marked = [...text.matchAll(/\*([^*]+)\*/g)]
  if (marked.length > 0) {
    const parts: TitlePart[] = []
    let cursor = 0
    for (const match of marked) {
      const start = match.index ?? 0
      if (start > cursor) parts.push({ text: text.slice(cursor, start), accent: false })
      parts.push({ text: match[1], accent: true })
      cursor = start + match[0].length
    }
    if (cursor < text.length) parts.push({ text: text.slice(cursor), accent: false })
    return parts
  }

  const words = text.split(/\s+/)
  if (words.length === 1) return [{ text: words[0], accent: true }]
  return [
    { text: `${words.slice(0, -1).join(' ')} `, accent: false },
    { text: words[words.length - 1], accent: true },
  ]
}

/** "#c9a24d" -> white or a dark brown, whichever reads better on top of it. Anything odd gives white. */
export function readableTextOn(hex: string): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return '#ffffff'
  const n = parseInt(match[1], 16)
  const channel = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const luminance = 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  return luminance > 0.45 ? '#2b2420' : '#ffffff'
}

export interface HourRow {
  day_of_week: number
  is_closed: boolean
  opens_at: string | null
  closes_at: string | null
}

const hhmm = (t: string) => t.slice(0, 5)

/** What the business does today, for the card over the photo. Null when nothing is known. */
export function todayHoursText(
  hours: HourRow[],
  options: { now?: Date; closedAllDay?: boolean } = {},
): string | null {
  const now = options.now ?? new Date()
  if (options.closedAllDay) return 'Hoy cerrado'
  const today = hours.find((h) => h.day_of_week === now.getDay())
  if (!today) return null
  if (today.is_closed || !today.opens_at || !today.closes_at) return 'Hoy cerrado'
  return `Hoy de ${hhmm(today.opens_at)} a ${hhmm(today.closes_at)}`
}
