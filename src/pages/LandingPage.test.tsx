import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LandingPage } from './LandingPage'

const mockUseUser = vi.fn()
vi.mock('../hooks/useUser', () => ({ useUser: () => mockUseUser() }))

vi.mock('../services/landing', () => ({
  getLandingConfig: () => new Promise(() => {}),
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

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={['/']}>
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
