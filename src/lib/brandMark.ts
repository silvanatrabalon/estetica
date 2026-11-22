/**
 * The SB mark of the business, from /public/logo_sb.svg. It is a single-color vector (it paints with
 * `currentColor`), so images made for sharing, like coupons and gift cards, can draw it in any color.
 */
export interface BrandMark {
  /** The viewBox of the original file, "minX minY width height". */
  viewBox: string
  width: number
  height: number
  /** The drawing: the file's shapes, with no fill of their own so the outer color paints them. */
  inner: string
}

export const BRAND_MARK_URL = '/logo_sb.svg'

/** Reads the shapes of an SVG file. Returns null when the text is not a usable SVG. */
export function parseBrandMark(svgText: string): BrandMark | null {
  if (!svgText || !svgText.includes('<svg')) return null
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const root = doc.documentElement
  if (!root || root.nodeName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) return null

  const box = (root.getAttribute('viewBox') ?? '').trim().split(/[\s,]+/).map(Number)
  const [, , width, height] =
    box.length === 4 && box.every((n) => Number.isFinite(n))
      ? box
      : [0, 0, Number(root.getAttribute('width')), Number(root.getAttribute('height'))]
  if (!(width > 0) || !(height > 0)) return null

  const serializer = new XMLSerializer()
  const parts: string[] = []
  for (const child of Array.from(root.children)) {
    const tag = child.nodeName.toLowerCase()
    // Text and scripts are not part of the drawing
    if (tag === 'title' || tag === 'desc' || tag === 'script' || tag === 'style' || tag === 'metadata') continue
    const copy = child.cloneNode(true) as Element
    for (const el of [copy, ...Array.from(copy.querySelectorAll('*'))]) {
      if (el.getAttribute('fill') === 'currentColor') el.removeAttribute('fill')
    }
    parts.push(serializer.serializeToString(copy).replace(/ xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, ''))
  }
  if (parts.length === 0) return null

  const viewBox = box.length === 4 && box.every((n) => Number.isFinite(n)) ? box.join(' ') : `0 0 ${width} ${height}`
  return { viewBox, width, height, inner: parts.join('') }
}

/** The mark as an SVG element to place inside another SVG: `width` wide, its height follows the proportions. */
export function brandMarkSvg(mark: BrandMark, opts: { x: number; y: number; width: number; color: string }): string {
  const height = (opts.width * mark.height) / mark.width
  return `<svg x="${opts.x}" y="${opts.y}" width="${opts.width}" height="${Math.round(height * 100) / 100}" viewBox="${mark.viewBox}" fill="${opts.color}">${mark.inner}</svg>`
}

/** How tall `brandMarkSvg` is for a given width. */
export function brandMarkHeight(mark: BrandMark, width: number): number {
  return (width * mark.height) / mark.width
}

let cached: Promise<BrandMark | null> | null = null

/** Loads the mark once. Null when the file cannot be read (the images are then made without a logo). */
export function loadBrandMark(): Promise<BrandMark | null> {
  if (!cached) {
    cached = (async () => {
      try {
        const response = await fetch(BRAND_MARK_URL)
        if (!response.ok) return null
        return parseBrandMark(await response.text())
      } catch {
        return null
      }
    })()
    // A failure is not remembered: the next try reads the file again
    void cached.then((mark) => {
      if (!mark) cached = null
    })
  }
  return cached
}
