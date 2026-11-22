import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { PromotionsSection } from './PromotionsSection'

function renderSection(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

const coupon = {
  code: 'VERANO10',
  description: 'Descuento de verano',
  discountType: 'percent' as const,
  discountValue: 10,
  categoryName: null,
  endsOn: '2026-12-31',
}

describe('PromotionsSection', () => {
  it('renders nothing without coupons (edge case)', () => {
    const { container } = renderSection(<PromotionsSection coupons={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the code, the discount, the description and the end date', () => {
    renderSection(<PromotionsSection coupons={[coupon]} />)
    expect(screen.getByRole('heading', { name: 'Promociones' })).toBeInTheDocument()
    expect(screen.getByText('VERANO10')).toBeInTheDocument()
    expect(screen.getByText('10% OFF')).toBeInTheDocument()
    expect(screen.getByText('Descuento de verano')).toBeInTheDocument()
    expect(screen.getByText(/Hasta el 31 de diciembre/)).toBeInTheDocument()
    expect(screen.getByText(/En todos los servicios/)).toBeInTheDocument()
  })

  it('describes the discount when there is no description and names the category (edge case)', () => {
    renderSection(
      <PromotionsSection
        coupons={[{ ...coupon, description: null, discountType: 'fixed', discountValue: 50000, categoryName: 'Uñas', endsOn: null }]}
      />,
    )
    expect(screen.getByText(/de descuento/)).toBeInTheDocument()
    expect(screen.getByText('En Uñas')).toBeInTheDocument()
    expect(screen.queryByText(/Hasta el/)).toBeNull()
  })

  it('lists several coupons', () => {
    renderSection(<PromotionsSection coupons={[coupon, { ...coupon, code: 'OTRO20' }]} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  const promo = {
    promoId: 'p1',
    name: 'Semana de manos',
    description: 'Todo con descuento',
    discountType: 'percent' as const,
    discountValue: 20,
    endsOn: '2026-12-31',
    serviceNames: ['Manicura', 'Pedicura'],
    serviceIds: ['s1', 's2'],
  }

  it('shows a promo with its services and end date, without a code', () => {
    renderSection(<PromotionsSection coupons={[]} promos={[promo]} />)
    expect(screen.getByText('20% OFF')).toBeInTheDocument()
    expect(screen.getByText('Manicura, Pedicura')).toBeInTheDocument()
    expect(screen.getByText(/Hasta el 31 de diciembre/)).toBeInTheDocument()
    expect(screen.getByText(/ir a reservar con ella/)).toBeInTheDocument()
  })

  it('shows promos and coupons together (edge case)', () => {
    renderSection(<PromotionsSection coupons={[coupon]} promos={[promo]} />)
    expect(screen.getByText('VERANO10')).toBeInTheDocument()
    expect(screen.getByText(/Semana de manos/)).toBeInTheDocument()
  })

  it('renders nothing without promos nor coupons (edge case)', () => {
    const { container } = renderSection(<PromotionsSection coupons={[]} promos={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('a promo takes you to its booking, through sign-in when there is no session', () => {
    const { unmount } = renderSection(<PromotionsSection coupons={[]} promos={[promo]} isAuthenticated />)
    expect(screen.getByRole('link', { name: 'Reservar con la promo Semana de manos' })).toHaveAttribute('href', '/booking?promo=p1')
    unmount()
    renderSection(<PromotionsSection coupons={[]} promos={[promo]} />)
    const href = screen.getByRole('link', { name: /Reservar con la promo/ }).getAttribute('href') as string
    expect(href.startsWith('/signin?redirect=')).toBe(true)
    expect(decodeURIComponent(href)).toContain('/booking?promo=p1')
  })

  it('a coupon takes you to its booking with its code and category', () => {
    renderSection(<PromotionsSection coupons={[{ ...coupon, categoryName: 'Uñas' }]} isAuthenticated />)
    expect(screen.getByRole('link', { name: 'Reservar con el cupón VERANO10' })).toHaveAttribute(
      'href',
      '/booking?cupon=VERANO10&categoria=U%C3%B1as',
    )
  })

  it('a coupon for every service has no category in its link (edge case)', () => {
    renderSection(<PromotionsSection coupons={[coupon]} isAuthenticated />)
    expect(screen.getByRole('link', { name: /Reservar con el cupón/ })).toHaveAttribute('href', '/booking?cupon=VERANO10')
  })
})
