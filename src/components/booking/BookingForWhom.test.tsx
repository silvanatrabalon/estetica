import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { BookingForWhom } from './BookingForWhom'
import type { BookingTarget } from '../../lib/bookingTarget'

const clients = [
  { userId: 'u1', name: 'Ana Pérez', email: 'ana@mail.com' },
  { userId: 'u2', name: '', email: 'sin-nombre@mail.com' },
]

function setup(value: BookingTarget, extra: Partial<React.ComponentProps<typeof BookingForWhom>> = {}) {
  const onChange = vi.fn()
  render(<BookingForWhom value={value} onChange={onChange} clients={clients} loading={false} error={null} {...extra} />)
  return onChange
}

describe('BookingForWhom', () => {
  it('starts on "Para mí" and says the appointment is in the user\'s name', () => {
    setup({ kind: 'me' })
    expect(screen.getByRole('radio', { name: 'Para mí' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('El turno queda a tu nombre.')).toBeInTheDocument()
  })

  it('switching to a client asks to choose one', () => {
    const onChange = setup({ kind: 'me' })
    fireEvent.click(screen.getByRole('radio', { name: 'Para un cliente' }))
    expect(onChange).toHaveBeenCalledWith({ kind: 'client', userId: '' })
  })

  it('switching to another person starts an empty form', () => {
    const onChange = setup({ kind: 'me' })
    fireEvent.click(screen.getByRole('radio', { name: 'Otra persona' }))
    expect(onChange).toHaveBeenCalledWith({ kind: 'guest', name: '', phone: '', email: '' })
  })

  it('clicking the option already selected does nothing (edge case)', () => {
    const onChange = setup({ kind: 'me' })
    fireEvent.click(screen.getByRole('radio', { name: 'Para mí' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('lists the clients with name and email, and says the turn is not the user\'s', () => {
    const onChange = setup({ kind: 'client', userId: '' })
    expect(screen.getByRole('option', { name: 'Ana Pérez (ana@mail.com)' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'sin-nombre@mail.com' })).toBeInTheDocument()
    expect(screen.getByText(/a nombre del cliente, no tuyo/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'u1' } })
    expect(onChange).toHaveBeenCalledWith({ kind: 'client', userId: 'u1' })
  })

  it('shows loading and error states for the client list (edge cases)', () => {
    setup({ kind: 'client', userId: '' }, { loading: true })
    expect(screen.getByRole('option', { name: 'Cargando clientes…' })).toBeInTheDocument()
  })

  it('shows the error instead of the list when clients cannot be loaded (edge case)', () => {
    setup({ kind: 'client', userId: '' }, { error: 'No pudimos cargar la lista de clientes.' })
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar la lista de clientes.')
    expect(screen.queryByLabelText('Cliente')).toBeNull()
  })

  it('suggests "Otra persona" when there are no client accounts (edge case)', () => {
    setup({ kind: 'client', userId: '' }, { clients: [] })
    expect(screen.getByText(/Usá “Otra persona”/)).toBeInTheDocument()
  })

  it('the person without account has name, phone and email, only the name required', () => {
    const onChange = setup({ kind: 'guest', name: '', phone: '', email: '' })
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Rosa' } })
    expect(onChange).toHaveBeenCalledWith({ kind: 'guest', name: 'Rosa', phone: '', email: '' })
    expect(screen.getByLabelText(/Teléfono/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
    expect(screen.getByText(/No necesita cuenta/)).toBeInTheDocument()
  })

  it('shows the validation error', () => {
    setup({ kind: 'guest', name: '', phone: '', email: '' }, { validationError: 'Escribí el nombre de la persona (mínimo 2 letras).' })
    expect(screen.getByRole('alert')).toHaveTextContent('Escribí el nombre')
  })
})
