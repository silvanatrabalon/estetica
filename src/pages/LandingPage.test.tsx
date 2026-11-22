import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LandingPage } from './LandingPage'

const mockUseUser = vi.fn()
vi.mock('../hooks/useUser', () => ({ useUser: () => mockUseUser() }))

const mockConfig = vi.fn(() => new Promise(() => {}))
vi.mock('../services/landing', () => ({
  getLandingConfig: () => mockConfig(),
  getUpcomingClosures: () => Promise.resolve([]),
}))
vi.mock('../services/socialLinks', () => ({ getPublicSocialLinks: () => Promise.resolve([]) }))
vi.mock('../services/coupons', () => ({ listPublicCoupons: () => Promise.resolve([]) }))
// Any chain of select/eq/order/limit resolves to an empty result
function emptyChain(): unknown {
  const result = { data: [], error: null }
  const chain: Record<string, unknown> = {
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  }
  for (const method of ['select', 'eq', 'order', 'limit', 'in', 'gte', 'lte']) {
    chain[method] = () => chain
  }
  return chain
}

vi.mock('../lib/supabase', () => ({ initSupabase: () => ({ from: () => emptyChain() }) }))

function renderLanding(url = '/') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin/dashboard" element={<div>Panel admin</div>} />
        <Route path="/dashboard" element={<div>Panel staff</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LandingPage role redirect', () => {
  it('redirects an admin to the admin home', () => {
    mockUseUser.mockReturnValue({ user: { id: 'u' }, activeRole: 'admin', isLoading: false })
    renderLanding()
    expect(screen.getByText('Panel admin')).toBeInTheDocument()
  })

  it('admin and staff can see the site when they come from the menu (?sitio), with a way back', async () => {
    mockConfig.mockRejectedValue(new Error('no config: the page uses its defaults'))
    for (const [role, back] of [
      ['admin', '/admin/dashboard'],
      ['staff', '/dashboard'],
    ] as const) {
      mockUseUser.mockReturnValue({ user: { id: 'u' }, activeRole: role, isLoading: false })
      const { unmount } = renderLanding('/?sitio=1')
      expect(screen.queryByText('Panel admin')).toBeNull()
      expect(screen.queryByText('Panel staff')).toBeNull()
      expect(await screen.findByRole('link', { name: '← Volver al panel' })).toHaveAttribute('href', back)
      unmount()
    }
  })

  it('a customer or a visitor sees no "back to the panel" link (edge case)', async () => {
    mockConfig.mockRejectedValue(new Error('no config'))
    mockUseUser.mockReturnValue({ user: { id: 'u' }, activeRole: 'customer', isLoading: false })
    renderLanding('/?sitio=1')
    await waitFor(() => expect(mockConfig).toHaveBeenCalled())
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByRole('link', { name: '← Volver al panel' })).toBeNull()
  })

  it('redirects staff to the staff home', () => {
    mockUseUser.mockReturnValue({ user: { id: 'u' }, activeRole: 'staff', isLoading: false })
    renderLanding()
    expect(screen.getByText('Panel staff')).toBeInTheDocument()
  })

  it('does not crash when the role arrives after the page mounted (edge case: dev role override)', () => {
    mockUseUser.mockReturnValue({ user: { id: 'u' }, activeRole: null, isLoading: true })
    const view = renderLanding()
    mockUseUser.mockReturnValue({ user: { id: 'u' }, activeRole: 'staff', isLoading: false })
    expect(() =>
      view.rerender(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<div>Panel staff</div>} />
          </Routes>
        </MemoryRouter>,
      ),
    ).not.toThrow()
    expect(screen.getByText('Panel staff')).toBeInTheDocument()
  })
})
