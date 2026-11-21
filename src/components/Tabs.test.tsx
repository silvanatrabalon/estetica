import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Tabs } from './Tabs'

const tabs = [
  { key: 'a', label: 'Uno' },
  { key: 'b', label: 'Dos' },
] as const

describe('Tabs', () => {
  it('marks the active tab and notifies on change', () => {
    const onChange = vi.fn()
    render(<Tabs tabs={[...tabs]} active="a" onChange={onChange} ariaLabel="Secciones" />)

    expect(screen.getByRole('tablist', { name: 'Secciones' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Uno' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Dos' })).toHaveAttribute('aria-selected', 'false')

    fireEvent.click(screen.getByRole('tab', { name: 'Dos' }))
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('clicking the active tab still calls onChange safely (edge case)', () => {
    const onChange = vi.fn()
    render(<Tabs tabs={[...tabs]} active="a" onChange={onChange} ariaLabel="Secciones" />)
    fireEvent.click(screen.getByRole('tab', { name: 'Uno' }))
    expect(onChange).toHaveBeenCalledWith('a')
  })
})
