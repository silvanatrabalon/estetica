import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { StatCard } from './StatCard'

describe('StatCard', () => {
  it('renders label and value when not loading', () => {
    render(<StatCard label="Turnos hoy" value={7} />)

    expect(screen.getByText('Turnos hoy')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.queryByTestId('stat-card-skeleton')).not.toBeInTheDocument()
  })

  it('renders skeleton placeholder when loading', () => {
    render(<StatCard label="Turnos hoy" value={7} loading />)

    expect(screen.getByText('Turnos hoy')).toBeInTheDocument()
    expect(screen.getByTestId('stat-card-skeleton')).toBeInTheDocument()
    // value should not be shown while loading
    expect(screen.queryByText('7')).not.toBeInTheDocument()
  })

  it('renders string values', () => {
    render(<StatCard label="Ingresos" value="$ 1.350,00" />)

    expect(screen.getByText('$ 1.350,00')).toBeInTheDocument()
  })

  it('puts the value in the bottom-right corner of the card', () => {
    render(<StatCard label="Turnos hoy" value={3} />)
    const value = screen.getByText('3')
    expect(value.className).toContain('self-end')
    expect(value.className).toContain('mt-auto')
  })

  it('keeps the skeleton in the same corner so nothing jumps when data arrives (edge case)', () => {
    render(<StatCard label="Turnos hoy" value={3} loading />)
    const skeleton = screen.getByTestId('stat-card-skeleton')
    expect(skeleton.className).toContain('self-end')
    expect(skeleton.className).toContain('mt-auto')
  })

  it('lines the value up for long values too (edge case)', () => {
    render(<StatCard label="Ingresos" value="$ 1.234.567" />)
    expect(screen.getByText('$ 1.234.567').className).toContain('self-end')
  })

  it('is a link to the given path when "to" is set', () => {
    render(
      <MemoryRouter>
        <StatCard label="Turnos hoy" value={3} to="/admin/appointments?periodo=today" />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /Turnos hoy/ }).getAttribute('href')).toBe(
      '/admin/appointments?periodo=today',
    )
  })

  it('is not a link without "to"', () => {
    render(<StatCard label="Turnos hoy" value={3} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
