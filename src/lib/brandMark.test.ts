import { describe, expect, it } from 'vitest'
import { brandMarkHeight, brandMarkSvg, parseBrandMark } from './brandMark'

const FILE = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1066" height="733" viewBox="115 205 1070 737" role="img">
  <title id="title">SB beauty logo</title>
  <path d="M0,0 L10,10 Z" fill="currentColor"/>
</svg>`

describe('parseBrandMark', () => {
  it('reads the drawing and the viewBox, without the title and without its own fill', () => {
    const mark = parseBrandMark(FILE)
    expect(mark).not.toBeNull()
    expect(mark!.viewBox).toBe('115 205 1070 737')
    expect(mark!.width).toBe(1070)
    expect(mark!.height).toBe(737)
    expect(mark!.inner).toContain('<path d="M0,0 L10,10 Z"')
    expect(mark!.inner).not.toContain('currentColor')
    expect(mark!.inner).not.toContain('title')
    expect(mark!.inner).not.toContain('xmlns')
  })

  it('uses width and height when there is no viewBox (edge case)', () => {
    const mark = parseBrandMark('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><circle r="5"/></svg>')
    expect(mark).toMatchObject({ viewBox: '0 0 200 100', width: 200, height: 100 })
  })

  it('drops scripts and text so nothing but shapes goes into an image (edge case)', () => {
    const mark = parseBrandMark(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><script>alert(1)</script><path d="M0 0"/></svg>',
    )
    expect(mark!.inner).not.toContain('script')
    expect(mark!.inner).toContain('<path')
  })

  it('gives null for text that is not an SVG, an empty file or a drawing with no size (edge cases)', () => {
    expect(parseBrandMark('')).toBeNull()
    expect(parseBrandMark('<html><body>404</body></html>')).toBeNull()
    expect(parseBrandMark('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>')).toBeNull()
    expect(parseBrandMark('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>')).toBeNull()
    expect(parseBrandMark('<svg><path')).toBeNull()
  })
})

describe('brandMarkSvg', () => {
  const mark = parseBrandMark(FILE)!

  it('places the mark with the color asked and keeps its proportions', () => {
    const svg = brandMarkSvg(mark, { x: 10, y: 20, width: 535, color: '#c9505f' })
    expect(svg).toContain('x="10" y="20" width="535"')
    expect(svg).toContain('fill="#c9505f"')
    expect(svg).toContain('viewBox="115 205 1070 737"')
    expect(brandMarkHeight(mark, 535)).toBeCloseTo(368.5, 1)
    expect(svg).toContain('height="368.5"')
  })

  it('the same mark can be drawn in two colors (edge case)', () => {
    expect(brandMarkSvg(mark, { x: 0, y: 0, width: 100, color: '#fff' })).toContain('fill="#fff"')
    expect(brandMarkSvg(mark, { x: 0, y: 0, width: 100, color: '#000' })).toContain('fill="#000"')
  })
})
