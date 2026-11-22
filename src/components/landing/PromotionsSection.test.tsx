import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PromotionsSection } from './PromotionsSection'

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
    const { container } = render(<PromotionsSection coupons={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the code, the discount, the description and the end date', () => {
    render(<PromotionsSection coupons={[coupon]} />)
    expect(screen.getByRole('heading', { name: 'Promociones' })).toBeInTheDocument()
    expect(screen.getByText('VERANO10')).toBeInTheDocument()
    expect(screen.getByText('10% OFF')).toBeInTheDocument()
    expect(screen.getByText('Descuento de verano')).toBeInTheDocument()
    expect(screen.getByText(/Hasta el 31 de diciembre/)).toBeInTheDocument()
    expect(screen.getByText(/En todos los servicios/)).toBeInTheDocument()
  })

  it('describes the discount when there is no description and names the category (edge case)', () => {
    render(
      <PromotionsSection
        coupons={[{ ...coupon, description: null, discountType: 'fixed', discountValue: 50000, categoryName: 'Uñas', endsOn: null }]}
      />,
    )
    expect(screen.getByText(/de descuento/)).toBeInTheDocument()
    expect(screen.getByText('En Uñas')).toBeInTheDocument()
    expect(screen.queryByText(/Hasta el/)).toBeNull()
  })

  it('lists several coupons', () => {
    render(<PromotionsSection coupons={[coupon, { ...coupon, code: 'OTRO20' }]} />)
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
  }

  it('shows a promo with its services and end date, without a code', () => {
    render(<PromotionsSection coupons={[]} promos={[promo]} />)
    expect(screen.getByText('20% OFF')).toBeInTheDocument()
    expect(screen.getByText('Manicura, Pedicura')).toBeInTheDocument()
    expect(screen.getByText(/Hasta el 31 de diciembre/)).toBeInTheDocument()
    expect(screen.getByText(/Se aplican solas/)).toBeInTheDocument()
  })

  it('shows promos and coupons together (edge case)', () => {
    render(<PromotionsSection coupons={[coupon]} promos={[promo]} />)
    expect(screen.getByText('VERANO10')).toBeInTheDocument()
    expect(screen.getByText(/Semana de manos/)).toBeInTheDocument()
    expect(screen.getByText(/Usá el código/)).toBeInTheDocument()
  })

  it('renders nothing without promos nor coupons (edge case)', () => {
    const { container } = render(<PromotionsSection coupons={[]} promos={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
