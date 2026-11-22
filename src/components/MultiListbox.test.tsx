import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MultiListbox } from './MultiListbox'

const options = [
  { value: 'a', label: 'Manicura' },
  { value: 'b', label: 'Pedicura' },
  { value: 'c', label: 'Masaje' },
]

function Harness({ initial = [] as string[], opts = options }) {
  const [values, setValues] = useState(initial)
  return <MultiListbox ariaLabel="Servicios" placeholder="Elegí" values={values} onChange={setValues} options={opts} />
}

const button = () => screen.getByRole('button', { name: 'Servicios' })

describe('MultiListbox', () => {
  it('shows the placeholder, then names, then a count', () => {
    render(<Harness />)
    expect(button()).toHaveTextContent('Elegí')
    fireEvent.click(button())
    fireEvent.click(screen.getByRole('option', { name: /Manicura/ }))
    expect(button()).toHaveTextContent('Manicura')
    fireEvent.click(screen.getByRole('option', { name: /Pedicura/ }))
    expect(button()).toHaveTextContent('Manicura, Pedicura')
    fireEvent.click(screen.getByRole('option', { name: /Masaje/ }))
    expect(button()).toHaveTextContent('3 elegidos')
  })

  it('stays open while choosing and a second click removes the option', () => {
    render(<Harness initial={['a']} />)
    fireEvent.click(button())
    fireEvent.click(screen.getByRole('option', { name: /Pedicura/ }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('option', { name: /Manicura/ }))
    expect(screen.getByRole('option', { name: /Manicura/ })).toHaveAttribute('aria-selected', 'false')
    expect(button()).toHaveTextContent('Pedicura')
  })

  it('Escape closes only the list, not what is around it (edge case)', () => {
    let outer = 0
    document.addEventListener('keydown', () => outer++)
    render(<Harness />)
    fireEvent.click(button())
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(outer).toBe(0)
  })

  it('closes on an outside click and says when there are no options (edge cases)', () => {
    render(<Harness opts={[]} />)
    fireEvent.click(button())
    expect(screen.getByText('No hay opciones.')).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})
