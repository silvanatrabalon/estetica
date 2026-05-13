import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExceptionDateForm } from '../../components/availability/ExceptionDateForm'

describe('ExceptionDateForm', () => {
  it('renders date and type inputs', () => {
    render(<ExceptionDateForm isSaving={false} onAdd={vi.fn()} />)

    expect(screen.getByLabelText('Fecha')).toBeInTheDocument()
    expect(screen.getByLabelText('Tipo')).toBeInTheDocument()
  })

  it('shows validation error when submitting without date', () => {
    render(<ExceptionDateForm isSaving={false} onAdd={vi.fn()} />)

    fireEvent.click(screen.getByText('+ Agregar excepción'))
    expect(screen.getByText('Seleccioná una fecha.')).toBeInTheDocument()
  })

  it('shows time inputs when custom_hours is selected', () => {
    render(<ExceptionDateForm isSaving={false} onAdd={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'custom_hours' } })
    expect(screen.getByLabelText('Hora de inicio')).toBeInTheDocument()
    expect(screen.getByLabelText('Hora de fin')).toBeInTheDocument()
  })

  it('hides time inputs when day_off is selected', () => {
    render(<ExceptionDateForm isSaving={false} onAdd={vi.fn()} />)

    // default is day_off — no time inputs
    expect(screen.queryByLabelText('Hora de inicio')).not.toBeInTheDocument()
  })

  it('calls onAdd with correct data when form is valid (day_off)', () => {
    const onAdd = vi.fn()
    render(<ExceptionDateForm isSaving={false} onAdd={onAdd} />)

    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2025-12-25' } })
    fireEvent.click(screen.getByText('+ Agregar excepción'))

    expect(onAdd).toHaveBeenCalledWith({
      exceptionDate: '2025-12-25',
      exceptionType: 'day_off',
      startsAt: null,
      endsAt: null,
      reason: null,
    })
  })

  it('calls onAdd with correct data when form is valid (custom_hours)', () => {
    const onAdd = vi.fn()
    render(<ExceptionDateForm isSaving={false} onAdd={onAdd} />)

    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2025-12-26' } })
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'custom_hours' } })
    fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: '10:00' } })
    fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: '14:00' } })
    fireEvent.click(screen.getByText('+ Agregar excepción'))

    expect(onAdd).toHaveBeenCalledWith({
      exceptionDate: '2025-12-26',
      exceptionType: 'custom_hours',
      startsAt: '10:00',
      endsAt: '14:00',
      reason: null,
    })
  })

  it('shows time error for invalid range in custom_hours mode', () => {
    render(<ExceptionDateForm isSaving={false} onAdd={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2025-12-26' } })
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'custom_hours' } })
    fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: '18:00' } })
    fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: '09:00' } })
    fireEvent.click(screen.getByText('+ Agregar excepción'))

    expect(
      screen.getByText('La hora de inicio debe ser anterior a la hora de fin.'),
    ).toBeInTheDocument()
  })

  it('disables button and inputs when isSaving', () => {
    render(<ExceptionDateForm isSaving={true} onAdd={vi.fn()} />)

    expect(screen.getByText('Guardando...')).toBeDisabled()
  })
})
