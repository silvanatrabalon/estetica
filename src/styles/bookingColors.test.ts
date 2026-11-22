import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')
const files = [
  'pages/BookingPage.tsx',
  'pages/ReschedulePage.tsx',
  'components/booking/BookingStepper.tsx',
  'components/booking/BookingCalendar.tsx',
  'components/booking/BookingForWhom.tsx',
]

describe('the booking flow uses the colors of the rest of the app', () => {
  it.each(files)('%s has no green buttons, selections or focus rings', (file) => {
    const text = readFileSync(join(root, file), 'utf8')
    expect(text).not.toMatch(/bg-emerald-[5-7]00/)
    expect(text).not.toMatch(/border-emerald-[5-7]00/)
    expect(text).not.toMatch(/ring-emerald-/)
  })

  it('the main buttons use the brand color', () => {
    const page = readFileSync(join(root, 'pages/BookingPage.tsx'), 'utf8')
    expect(page).toContain('bg-brand-primary')
    expect(page).toContain('hover:bg-brand-strong')
    expect(page).toContain('Seleccionar este servicio')
  })

  it('green is kept only for success notices (applied coupon), not for actions (edge case)', () => {
    const page = readFileSync(join(root, 'pages/BookingPage.tsx'), 'utf8')
    const greenLines = page.split('\n').filter((l) => /emerald-/.test(l))
    for (const line of greenLines) expect(line).toMatch(/text-emerald-700/)
  })
})
