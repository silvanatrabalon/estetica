import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BarList } from './BarList'
import { ColumnChart } from './ColumnChart'

describe('ColumnChart', () => {
  it('renders one item per period with a text description for screen readers', () => {
    render(
      <ColumnChart
        ariaLabel="Ingresos"
        data={[
          { label: 'oct', value: 100, description: 'oct 2026: $ 1' },
          { label: 'nov', value: 300, description: 'nov 2026: $ 3' },
        ]}
      />,
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('nov 2026: $ 3')).toBeInTheDocument()
  })

  it('does not break when every value is zero or there is no data (edge case)', () => {
    const { container } = render(
      <ColumnChart ariaLabel="x" data={[{ label: 'oct', value: 0, description: 'oct: $ 0' }]} />,
    )
    expect(container.querySelector('[style*="3px"]')).not.toBeNull()
    render(<ColumnChart ariaLabel="vacío" data={[]} />)
    expect(screen.getByLabelText('vacío')).toBeInTheDocument()
  })
})

describe('BarList', () => {
  it('ranks items and shows their figures', () => {
    render(
      <BarList
        ariaLabel="Ranking"
        emptyText="Nada"
        items={[
          { id: 'a', label: 'Ana', value: 4, display: '4 visitas', sub: 'Gastó $ 10' },
          { id: 'b', label: 'Bea', value: 1, display: '1 visita' },
        ]}
      />,
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('4 visitas')).toBeInTheDocument()
    expect(screen.getByText('Gastó $ 10')).toBeInTheDocument()
  })

  it('shows the empty text when there are no items or all are zero (edge cases)', () => {
    const { rerender } = render(<BarList ariaLabel="x" emptyText="Nada por acá" items={[]} />)
    expect(screen.getByText('Nada por acá')).toBeInTheDocument()
    rerender(<BarList ariaLabel="x" emptyText="Nada por acá" items={[{ id: 'a', label: 'Ana', value: 0, display: '0' }]} />)
    expect(screen.getByText('Nada por acá')).toBeInTheDocument()
  })
})
