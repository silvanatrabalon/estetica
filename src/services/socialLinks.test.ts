import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getPublicSocialLinks, saveSocialLinks } from './socialLinks'

const mockInitSupabase = vi.fn()
vi.mock('../lib/supabase', () => ({ initSupabase: () => mockInitSupabase() }))

describe('saveSocialLinks validation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects an invalid URL before touching the database', async () => {
    await expect(
      saveSocialLinks([{ network: 'instagram', value: 'javascript:alert(1)', enabled: true }]),
    ).rejects.toThrow('URL válida')
    expect(mockInitSupabase).not.toHaveBeenCalled()
  })

  it('rejects a bad WhatsApp number before touching the database', async () => {
    await expect(
      saveSocialLinks([{ network: 'whatsapp', value: 'abc', enabled: true }]),
    ).rejects.toThrow('WhatsApp')
    expect(mockInitSupabase).not.toHaveBeenCalled()
  })
})

describe('saveSocialLinks writes', () => {
  beforeEach(() => vi.clearAllMocks())

  function setup() {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const inFn = vi.fn().mockResolvedValue({ error: null })
    const eq = vi.fn().mockReturnValue({ in: inFn })
    const del = vi.fn().mockReturnValue({ eq })
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'org-1' }, error: null })
    const from = vi.fn((table: string) => {
      if (table === 'organizations') {
        return { select: () => ({ order: () => ({ limit: () => ({ maybeSingle }) }) }) }
      }
      return { upsert, delete: del }
    })
    mockInitSupabase.mockReturnValue({ from })
    return { upsert, del, eq, inFn }
  }

  it('upserts filled networks (normalized) and deletes empty ones', async () => {
    const { upsert, del, eq, inFn } = setup()

    await saveSocialLinks([
      { network: 'instagram', value: 'instagram.com/sil', enabled: true },
      { network: 'whatsapp', value: '+54 9 11 1234-5678', enabled: false },
      { network: 'facebook', value: '   ', enabled: true },
    ])

    const rows = upsert.mock.calls[0][0]
    expect(rows).toEqual([
      expect.objectContaining({ organization_id: 'org-1', network: 'instagram', value: 'https://instagram.com/sil', enabled: true }),
      expect.objectContaining({ network: 'whatsapp', value: '5491112345678', enabled: false }),
    ])
    expect(del).toHaveBeenCalled()
    expect(eq).toHaveBeenCalledWith('organization_id', 'org-1')
    expect(inFn).toHaveBeenCalledWith('network', ['facebook'])
  })

  it('skips the upsert when everything is empty (edge case)', async () => {
    const { upsert, inFn } = setup()
    await saveSocialLinks([{ network: 'instagram', value: '', enabled: true }])
    expect(upsert).not.toHaveBeenCalled()
    expect(inFn).toHaveBeenCalledWith('network', ['instagram'])
  })

  it('does nothing harmful with an empty list (edge case)', async () => {
    const { upsert, del } = setup()
    await saveSocialLinks([])
    expect(upsert).not.toHaveBeenCalled()
    expect(del).not.toHaveBeenCalled()
  })
})

describe('getPublicSocialLinks', () => {
  it('returns only known networks with a value, in display order (edge case)', async () => {
    const eq = vi.fn().mockResolvedValue({
      data: [
        { network: 'website', value: 'https://x.com', enabled: true },
        { network: 'myspace', value: 'https://m.com', enabled: true },
        { network: 'instagram', value: '  ', enabled: true },
        { network: 'whatsapp', value: '5491112345678', enabled: true },
      ],
      error: null,
    })
    mockInitSupabase.mockReturnValue({ from: () => ({ select: () => ({ eq }) }) })

    const links = await getPublicSocialLinks()
    expect(links.map((l) => l.network)).toEqual(['whatsapp', 'website'])
  })

  it('propagates database errors', async () => {
    const err = new Error('db down')
    mockInitSupabase.mockReturnValue({
      from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: null, error: err }) }) }),
    })
    await expect(getPublicSocialLinks()).rejects.toThrow('db down')
  })
})
