import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LandingConfigPage } from './LandingConfigPage'

const mockGetConfig = vi.fn()

vi.mock('../hooks/useUser', () => ({
  useUser: () => ({ activeRole: 'admin', isLoading: false }),
}))

vi.mock('../lib/supabase', () => ({
  initSupabase: () => ({ storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: '' } }) }) } }),
}))

vi.mock('../services/adminLanding', () => ({
  adminGetLandingConfig: (...args: unknown[]) => mockGetConfig(...args),
  adminUpdateLandingConfig: vi.fn(),
  adminAddCarouselImage: vi.fn(),
  adminDeleteCarouselImage: vi.fn(),
  adminReorderCarouselImages: vi.fn(),
  uploadMediaFile: vi.fn(),
  deleteMediaFile: vi.fn(),
}))

const config = {
  heroTitle: null,
  heroSubtitle: null,
  aboutText: null,
  instagramUrl: null,
  whatsappNumber: null,
  primaryColor: '#f9a8d4',
  secondaryColor: '#fbcfe8',
  fontFamily: 'Inter',
  showHours: true,
  carouselImages: [],
}

describe('LandingConfigPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetConfig.mockResolvedValue(config)
  })

  function renderPage() {
    return render(
      <MemoryRouter>
        <LandingConfigPage />
      </MemoryRouter>,
    )
  }

  it('renders the landing content form', async () => {
    renderPage()
    expect(await screen.findByRole('button', { name: 'Guardar configuración' })).toBeInTheDocument()
  })

  it('no longer shows the old Instagram field or its own page title (edge case)', async () => {
    renderPage()
    await screen.findByRole('button', { name: 'Guardar configuración' })
    expect(screen.queryByLabelText('URL de Instagram')).toBeNull()
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })

  it('does not include the social links editor (it has its own tab) (edge case)', async () => {
    renderPage()
    await screen.findByRole('button', { name: 'Guardar configuración' })
    expect(screen.queryByText('Redes sociales')).toBeNull()
  })
})
