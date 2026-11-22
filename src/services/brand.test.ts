import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getBrandSettings, getPublicIdentity, saveBrandSettings } from './brand'

const mockInitSupabase = vi.fn()
vi.mock('../lib/supabase', () => ({ initSupabase: () => mockInitSupabase() }))

function mockClient(row: unknown, updateResult: { error: unknown } = { error: null }) {
  const eq = vi.fn().mockResolvedValue(updateResult)
  const update = vi.fn().mockReturnValue({ eq })
  const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null })
  const select = vi.fn().mockReturnValue({ order: () => ({ limit: () => ({ maybeSingle }) }) })
  mockInitSupabase.mockReturnValue({ from: () => ({ select, update }) })
  return { update, eq }
}

describe('getBrandSettings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns trimmed values and null for blanks', async () => {
    mockClient({ id: 'o1', logo_url: ' https://x/logo.png ', booking_header_text: '  ', booking_subtitle_text: 'Hola' })
    expect(await getBrandSettings()).toEqual({
      logoUrl: 'https://x/logo.png',
      bookingHeaderText: null,
      bookingSubtitleText: 'Hola',
    })
  })

  it('returns all nulls when there is no organization (edge case)', async () => {
    mockClient(null)
    expect(await getBrandSettings()).toEqual({ logoUrl: null, bookingHeaderText: null, bookingSubtitleText: null })
  })
})

describe('saveBrandSettings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects over-long texts before touching the database', async () => {
    await expect(
      saveBrandSettings({ logoUrl: null, bookingHeaderText: 'a'.repeat(81), bookingSubtitleText: null }),
    ).rejects.toThrow(/título/)
    expect(mockInitSupabase).not.toHaveBeenCalled()
  })

  it('writes only branding columns and stores blanks as null', async () => {
    const { update, eq } = mockClient({ id: 'o1', logo_url: null, booking_header_text: null, booking_subtitle_text: null })
    await saveBrandSettings({ logoUrl: ' https://x/l.png ', bookingHeaderText: '   ', bookingSubtitleText: 'Elegí' })

    const payload = update.mock.calls[0][0]
    expect(payload).toEqual(
      expect.objectContaining({ logo_url: 'https://x/l.png', booking_header_text: null, booking_subtitle_text: 'Elegí' }),
    )
    expect(Object.keys(payload).sort()).toEqual(
      ['booking_header_text', 'booking_subtitle_text', 'logo_url', 'updated_at'],
    )
    expect(eq).toHaveBeenCalledWith('id', 'o1')
  })

  it('fails clearly when there is no organization (edge case)', async () => {
    mockClient(null)
    await expect(saveBrandSettings({ logoUrl: null, bookingHeaderText: null, bookingSubtitleText: null })).rejects.toThrow(
      'No se encontró el negocio.',
    )
  })

  it('propagates database errors (edge case)', async () => {
    const err = new Error('db')
    mockClient({ id: 'o1', logo_url: null, booking_header_text: null, booking_subtitle_text: null }, { error: err })
    await expect(saveBrandSettings({ logoUrl: null, bookingHeaderText: null, bookingSubtitleText: null })).rejects.toThrow('db')
  })
})

describe('getPublicIdentity', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the name and the logo, trimmed', async () => {
    mockClient({ name: ' Estética So Beauty ', logo_url: ' https://x/logo.svg ' })
    expect(await getPublicIdentity()).toEqual({ name: 'Estética So Beauty', logoUrl: 'https://x/logo.svg' })
  })

  it('returns nulls when there is no organization or the lookup fails (edge cases)', async () => {
    mockClient(null)
    expect(await getPublicIdentity()).toEqual({ name: null, logoUrl: null })
    mockInitSupabase.mockImplementation(() => {
      throw new Error('down')
    })
    expect(await getPublicIdentity()).toEqual({ name: null, logoUrl: null })
  })
})

