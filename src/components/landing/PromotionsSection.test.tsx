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
})
