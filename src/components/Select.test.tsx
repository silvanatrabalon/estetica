import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Fragment } from 'react'
import { Select } from './Select'

describe('Select (styled drop-down with <option> children)', () => {
  it('shows the chosen option and opens a styled list of the others', () => {
    render(
      <>
        <label htmlFor="s">Tipo</label>
        <Select id="s" value="b" onChange={vi.fn()}>
          <option value="a">Uno</option>
          <option value="b">Dos</option>
        </Select>
      </>,
    )
    const button = screen.getByLabelText('Tipo')
    expect(button).toHaveAttribute('aria-haspopup', 'listbox')
    expect(button.textContent).toContain('Dos')
    expect(document.querySelector('select')).toBeNull()
    fireEvent.click(button)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Uno', 'Dos'])
  })

  it('calls onChange with something shaped like a change event, with the name', () => {
    const onChange = vi.fn()
    render(
      <Select aria-label="Fuente" name="fontFamily" value="a" onChange={onChange}>
        <option value="a">Uno</option>
        <option value="b">Dos</option>
      </Select>,
    )
    fireEvent.click(screen.getByLabelText('Fuente'))
    fireEvent.click(screen.getByRole('option', { name: 'Dos' }))
    expect(onChange).toHaveBeenCalledWith({ target: { name: 'fontFamily', value: 'b' } })
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('works with numeric values (edge case)', () => {
    const onChange = vi.fn()
    render(
      <Select aria-label="Minutos" value={60} onChange={(e) => onChange(Number(e.target.value))}>
        <option value={0}>Sin anticipación</option>
        <option value={60}>1 hora</option>
      </Select>,
    )
    expect(screen.getByLabelText('Minutos').textContent).toContain('1 hora')
    fireEvent.click(screen.getByLabelText('Minutos'))
    fireEvent.click(screen.getByRole('option', { name: 'Sin anticipación' }))
    expect(onChange).toHaveBeenCalledWith(0)
  })

  it('reads options inside fragments and arrays, and builds labels from text only (edge case)', () => {
    render(
      <Select aria-label="Mezcla" value="" onChange={vi.fn()}>
        <option value="">Elegí</option>
        <Fragment>
          <option value="x">Equis</option>
        </Fragment>
        {['y', 'z'].map((v) => (
          <option key={v} value={v}>
            Letra {v}
          </option>
        ))}
      </Select>,
    )
    fireEvent.click(screen.getByLabelText('Mezcla'))
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Elegí', 'Equis', 'Letra y', 'Letra z'])
  })

  it('an <option> without value uses its text; an empty list does not crash (edge case)', () => {
    const onChange = vi.fn()
    const { unmount } = render(
      <Select aria-label="Sin valor" value="" onChange={onChange}>
        <option>Solo texto</option>
      </Select>,
    )
    fireEvent.click(screen.getByLabelText('Sin valor'))
    fireEvent.click(screen.getByRole('option', { name: 'Solo texto' }))
    expect(onChange).toHaveBeenCalledWith({ target: { name: '', value: 'Solo texto' } })
    unmount()
    render(<Select aria-label="Vacío" value="" />)
    expect(screen.getByLabelText('Vacío')).toBeInTheDocument()
  })

  it('does not open when disabled (edge case)', () => {
    render(
      <Select aria-label="Bloqueado" value="a" disabled onChange={vi.fn()}>
        <option value="a">Uno</option>
      </Select>,
    )
    const button = screen.getByLabelText('Bloqueado')
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})
