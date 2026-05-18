import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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
})
