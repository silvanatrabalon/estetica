import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { BookingStepper, BOOKING_STEPS } from './BookingStepper'

describe('BookingStepper', () => {
  it('shows the four steps in order, as a step by step menu', () => {
    render(<BookingStepper step={1} onGoTo={vi.fn()} />)
    const nav = screen.getByRole('navigation', { name: 'Pasos de la reserva' })
    expect(Array.from(nav.querySelectorAll('li')).map((li) => li.textContent?.replace(/^\d+/, ''))).toEqual([
      'Servicio',
      'Fecha',
      'Horario',
      'Confirmar',
    ])
    expect(BOOKING_STEPS.map((s) => s.step)).toEqual([1, 2, 3, 4])
  })

  it('marks the current step, and no step is a button on the first one', () => {
    render(<BookingStepper step={1} onGoTo={vi.fn()} />)
    expect(screen.getByRole('navigation').querySelector('[aria-current="step"]')?.textContent).toContain('Servicio')
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('steps already done show a check and are buttons to go back to them', () => {
    const onGoTo = vi.fn()
    render(<BookingStepper step={3} onGoTo={onGoTo} />)
    expect(screen.getByRole('navigation').querySelector('[aria-current="step"]')?.textContent).toContain('Horario')
    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Volver a Servicio', 'Volver a Fecha'])
    expect(screen.getByRole('button', { name: 'Volver a Servicio' }).querySelector('svg')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Volver a Fecha' }))
    expect(onGoTo).toHaveBeenCalledWith(2)
    fireEvent.click(screen.getByRole('button', { name: 'Volver a Servicio' }))
    expect(onGoTo).toHaveBeenLastCalledWith(1)
  })

  it('steps still to come are not clickable (edge case)', () => {
    render(<BookingStepper step={2} onGoTo={vi.fn()} />)
    for (const label of ['Horario', 'Confirmar']) {
      expect(screen.queryByRole('button', { name: new RegExp(label) })).toBeNull()
    }
  })

  it('on the last step the three before are done and only Confirmar is current (edge case)', () => {
    render(<BookingStepper step={4} onGoTo={vi.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(3)
    expect(screen.getByRole('navigation').querySelector('[aria-current="step"]')?.textContent).toContain('Confirmar')
  })
})
