import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { ensureProfileOnBootstrap, updateMyProfile } from './profile'
import { initSupabase } from '../lib/supabase'

vi.mock('../lib/supabase', () => ({
  initSupabase: vi.fn(),
}))

type QueryBuilder = {
  select: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
}

type SupabaseMock = {
  from: ReturnType<typeof vi.fn>
  auth: {
    getUser: ReturnType<typeof vi.fn>
  }
}

function createSupabaseMock(): { client: SupabaseMock; builder: QueryBuilder } {
  const builder: QueryBuilder = {
    select: vi.fn(),
    maybeSingle: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    order: vi.fn(),
  }

  builder.select.mockReturnValue(builder)
  builder.insert.mockResolvedValue({ error: null })
  builder.update.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.order.mockReturnValue(builder)

  const client: SupabaseMock = {
    from: vi.fn(() => builder),
    auth: {
      getUser: vi.fn(),
    },
  }

  return { client, builder }
}

describe('profile service', () => {
  const mockedInit = vi.mocked(initSupabase)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates profile on bootstrap when missing and marks incomplete without name', async () => {
    const { client, builder } = createSupabaseMock()
    mockedInit.mockReturnValue(client as never)

    const user = {
      id: 'user-1',
      email: 'demo@example.com',
      user_metadata: {},
    } as User

    client.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    builder.maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: { user_id: 'user-1', full_name: null, phone: null },
        error: null,
      })

    const result = await ensureProfileOnBootstrap(user)

    expect(builder.insert).toHaveBeenCalled()
    expect(result.status).toBe('incomplete')
    expect(result.profile?.userId).toBe('user-1')
  })

  it('updates own profile for authenticated user', async () => {
    const { client, builder } = createSupabaseMock()
    mockedInit.mockReturnValue(client as never)

    client.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    builder.single.mockResolvedValue({
      data: { user_id: 'user-1', full_name: 'Ana', phone: null },
      error: null,
    })

    const updated = await updateMyProfile({ name: 'Ana', phone: '' })

    expect(builder.update).toHaveBeenCalled()
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(updated.name).toBe('Ana')
  })

  it('creates profile if not found during update (PGRST116)', async () => {
    const { client, builder } = createSupabaseMock()
    mockedInit.mockReturnValue(client as never)

    client.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    // First call (update) fails with PGRST116 (no rows)
    builder.single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' },
    })

    // Second call (insert) succeeds
    builder.insert.mockReturnValue(builder)
    builder.single.mockResolvedValueOnce({
      data: { user_id: 'user-1', full_name: 'Ana', phone: '+5551234567' },
      error: null,
    })

    const updated = await updateMyProfile({ name: 'Ana', phone: '+5551234567' })

    expect(builder.update).toHaveBeenCalled()
    expect(builder.insert).toHaveBeenCalled()
    expect(updated.name).toBe('Ana')
    expect(updated.phone).toBe('+5551234567')
  })
})
