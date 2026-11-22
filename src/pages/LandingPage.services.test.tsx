import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LandingPage } from './LandingPage'

const mockUseUser = vi.fn()
vi.mock('../hooks/useUser', () => ({ useUser: () => mockUseUser() }))

const mockConfig = vi.fn()
vi.mock('../services/landing', () => ({
  getLandingConfig: () => mockConfig(),
  getUpcomingClosures: () => Promise.resolve([]),
}))
const mockSocial = vi.fn()
vi.mock('../services/socialLinks', () => ({ getPublicSocialLinks: () => mockSocial() }))
const mockIdentity = vi.fn()
vi.mock('../services/brand', () => ({ getPublicIdentity: () => mockIdentity() }))
vi.mock('../services/coupons', () => ({ listPublicCoupons: () => Promise.resolve([]) }))
const mockPromos = vi.fn()
vi.mock('../services/promos', () => ({ listPublicPromos: () => mockPromos() }))

let serviceRows: unknown[] = []

function chainFor(table: string): unknown {
  const result = { data: table === 'services' ? serviceRows : [], error: null }
  const chain: Record<string, unknown> = {
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  }
  for (const method of ['select', 'eq', 'order', 'limit', 'in', 'gte', 'lte']) {
    chain[method] = () => chain
  }
  return chain
}

vi.mock('../lib/supabase', () => ({
  initSupabase: () => ({
    from: (table: string) => chainFor(table),
    storage: { from: () => ({ getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn/${path}` } }) }) },
  }),
}))

const row = (id: string, name: string, price = 1000000) => ({
  id,
  organization_id: 'o',
  name,
  duration_minutes: 60,
  price_cents: price,
  image_url: null,
  is_active: true,
  max_concurrent_bookings: null,
  created_at: '2026-01-01',
  description: null,
  category_id: null,
})

const baseConfig = {
  heroTitle: null,
  heroSubtitle: null,
  aboutText: null,
  instagramUrl: null,
  whatsappNumber: null,
  primaryColor: '#f9a8d4',
  secondaryColor: '#fbcfe8',
  fontFamily: 'Inter',
  showHours: false,
  carouselImages: [],
}

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <LandingPage />
    </MemoryRouter>,
  )
}

const promo = {
  promoId: 'p1',
  name: 'Semana de manos',
  description: null,
  discountType: 'percent' as const,
  discountValue: 20,
  endsOn: '2026-12-31',
  serviceNames: ['Manicura'],
  serviceIds: ['s1'],
}

describe('LandingPage — services carousel and links', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    serviceRows = [row('s1', 'Manicura'), row('s2', 'Masaje')]
    mockConfig.mockResolvedValue(baseConfig)
    mockPromos.mockResolvedValue([])
    mockSocial.mockResolvedValue([])
    mockIdentity.mockResolvedValue({ name: 'Estética So Beauty', logoUrl: 'https://cdn/logo.svg' })
    mockUseUser.mockReturnValue({ user: { id: 'u' }, activeRole: 'customer', isLoading: false })
  })

  it('the hero image carousel has dots but no previous/next arrows', async () => {
    mockConfig.mockResolvedValue({
      ...baseConfig,
      carouselImages: [
        { id: 'a', storagePath: 'carousel/1.jpg', altText: null },
        { id: 'b', storagePath: 'carousel/2.jpg', altText: null },
      ],
    })
    renderLanding()
    await screen.findByTestId('services-carousel')
    expect(screen.getByRole('button', { name: 'Imagen 1' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Imagen anterior' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Imagen siguiente' })).toBeNull()
  })

  it('the services move in a loop: the row is rendered twice, the copy is hidden from assistive tech', async () => {
    renderLanding()
    const carousel = await screen.findByTestId('services-carousel')
    const links = carousel.querySelectorAll('a')
    // Two services are repeated up to a wide half, and that half is shown twice
    expect(links.length).toBeGreaterThanOrEqual(16)
    expect(links.length % 2).toBe(0)
    // Only the first pass can be reached by screen readers and keyboard
    const reachable = within(carousel).getAllByRole('link')
    expect(reachable).toHaveLength(2)
    expect(carousel.querySelectorAll('a[aria-hidden="true"][tabindex="-1"]').length).toBe(links.length - 2)
  })

  it('a service takes a signed-in customer straight to its booking', async () => {
    renderLanding()
    const link = await screen.findByRole('link', { name: 'Reservar Manicura' })
    expect(link).toHaveAttribute('href', '/booking?servicio=s1')
  })

  it('a visitor goes through sign-in and comes back to that service (edge case)', async () => {
    mockUseUser.mockReturnValue({ user: null, activeRole: null, isLoading: false })
    renderLanding()
    const link = await screen.findByRole('link', { name: 'Reservar Masaje' })
    const href = link.getAttribute('href') as string
    expect(href.startsWith('/signin?redirect=')).toBe(true)
    expect(decodeURIComponent(href)).toContain('/booking?servicio=s2')
  })

  it('a service in promo shows the badge, the old price struck and the new one', async () => {
    mockPromos.mockResolvedValue([promo])
    renderLanding()
    await waitFor(() => expect(screen.getAllByText('PROMO 20% OFF').length).toBeGreaterThan(0))
    const card = screen.getByRole('link', { name: 'Reservar Manicura' })
    expect(within(card).getByText(/10\.000/, { selector: 's' })).toBeInTheDocument()
    expect(within(card).getByText(/8\.000/, { selector: 'strong' })).toBeInTheDocument()
    expect(within(screen.getByRole('link', { name: 'Reservar Masaje' })).queryByText(/PROMO/)).toBeNull()
  })

  it('with two promos on a service the bigger discount is shown (edge case)', async () => {
    mockPromos.mockResolvedValue([promo, { ...promo, promoId: 'p2', discountValue: 50 }])
    renderLanding()
    await waitFor(() => expect(screen.getAllByText('PROMO 50% OFF').length).toBeGreaterThan(0))
    expect(screen.queryByText('PROMO 20% OFF')).toBeNull()
  })

  it('shows a message and no carousel when there are no services (edge case)', async () => {
    serviceRows = []
    renderLanding()
    expect(await screen.findByText('No hay servicios disponibles por el momento.')).toBeInTheDocument()
    expect(screen.queryByTestId('services-carousel')).toBeNull()
  })

  it('a single service still fills a loop (edge case)', async () => {
    serviceRows = [row('s1', 'Manicura')]
    renderLanding()
    const carousel = await screen.findByTestId('services-carousel')
    expect(carousel.querySelectorAll('a').length).toBeGreaterThanOrEqual(16)
    expect(within(carousel).getAllByRole('link')).toHaveLength(1)
  })
})

describe('LandingPage — design', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    serviceRows = [row('s1', 'Manicura')]
    mockConfig.mockResolvedValue({ ...baseConfig, heroTitle: 'Donde la *belleza* se vuelve arte', showHours: true, aboutText: 'Mi historia' })
    mockPromos.mockResolvedValue([])
    mockSocial.mockResolvedValue([])
    mockIdentity.mockResolvedValue({ name: 'Estética So Beauty', logoUrl: 'https://cdn/logo.svg' })
    mockUseUser.mockReturnValue({ user: null, activeRole: null, isLoading: false })
  })

  it('the title shows its accent word in italic', async () => {
    renderLanding()
    const heading = await screen.findByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Donde la belleza se vuelve arte')
    expect(heading.querySelector('em')).toHaveTextContent('belleza')
  })

  it('the top bar has the name, the logo and links only for the sections that exist', async () => {
    renderLanding()
    const nav = await screen.findByRole('navigation', { name: 'Principal' })
    await waitFor(() => expect(within(nav).getByText('Estética So Beauty')).toBeInTheDocument())
    expect(nav.querySelector('img')).toHaveAttribute('src', 'https://cdn/logo.svg')
    for (const label of ['Servicios', 'Sobre nosotros', 'Horarios', 'Contacto']) {
      expect(within(nav).getAllByRole('link', { name: label }).length).toBeGreaterThan(0)
    }
    expect(within(nav).queryByRole('link', { name: 'Promociones' })).toBeNull()
  })

  it('leaves out the links of sections that are off (edge case)', async () => {
    mockConfig.mockResolvedValue({ ...baseConfig, showHours: false, aboutText: null })
    renderLanding()
    const nav = await screen.findByRole('navigation', { name: 'Principal' })
    expect(within(nav).queryByRole('link', { name: 'Sobre nosotros' })).toBeNull()
    expect(within(nav).queryByRole('link', { name: 'Horarios' })).toBeNull()
  })

  it('adds Promociones to the bar when there are promos to show', async () => {
    mockPromos.mockResolvedValue([
      { promoId: 'p1', name: 'Semana', description: null, discountType: 'percent', discountValue: 20, endsOn: '2026-12-31', serviceNames: ['Manicura'], serviceIds: ['s1'] },
    ])
    renderLanding()
    const nav = await screen.findByRole('navigation', { name: 'Principal' })
    await waitFor(() => expect(within(nav).getAllByRole('link', { name: 'Promociones' }).length).toBeGreaterThan(0))
  })

  it('the WhatsApp button shows only when WhatsApp is on', async () => {
    renderLanding()
    await screen.findByRole('navigation', { name: 'Principal' })
    expect(screen.queryByRole('link', { name: 'Escribinos por WhatsApp' })).toBeNull()
  })

  it('the WhatsApp button appears with the number the admin set', async () => {
    mockSocial.mockResolvedValue([{ network: 'whatsapp', value: '+54 9 11 1234-5678', enabled: true }])
    renderLanding()
    expect(await screen.findByRole('link', { name: 'Escribinos por WhatsApp' })).toBeInTheDocument()
  })

  it('a visitor sees Reservar, which goes through sign-in', async () => {
    renderLanding()
    const nav = await screen.findByRole('navigation', { name: 'Principal' })
    const href = within(nav).getByRole('link', { name: 'Reservar' }).getAttribute('href') as string
    expect(href.startsWith('/signin?redirect=')).toBe(true)
  })

  it('admin and staff looking at the site have no Reservar buttons (edge case)', async () => {
    mockUseUser.mockReturnValue({ user: { id: 'u' }, activeRole: 'admin', isLoading: false })
    render(
      <MemoryRouter initialEntries={['/?sitio=1']}>
        <LandingPage />
      </MemoryRouter>,
    )
    const nav = await screen.findByRole('navigation', { name: 'Principal' })
    expect(within(nav).queryByRole('link', { name: 'Reservar' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Reservar turno' })).toBeNull()
    expect(screen.getByRole('link', { name: /Volver al panel/ })).toBeInTheDocument()
  })

  it('still loads without name nor logo (edge case)', async () => {
    mockIdentity.mockResolvedValue({ name: null, logoUrl: null })
    renderLanding()
    const nav = await screen.findByRole('navigation', { name: 'Principal' })
    expect(nav.querySelector('img')).toBeNull()
    expect(within(nav).getByRole('link', { name: 'Reservar' })).toBeInTheDocument()
  })
})

