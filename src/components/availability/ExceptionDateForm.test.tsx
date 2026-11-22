import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExceptionDateForm } from '../../components/availability/ExceptionDateForm'
import { pickOption } from '../../hooks/__test-utils__/select'

describe('ExceptionDateForm', () => {
  it('renders date and type inputs', async () => {
    render(<ExceptionDateForm isSaving={false} onAdd={vi.fn()} />)

    expect(screen.getByLabelText('Fecha')).toBeInTheDocument()
    expect(screen.getByLabelText('Tipo')).toBeInTheDocument()
  })

  it('shows validation error when submitting without date', async () => {
    render(<ExceptionDateForm isSaving={false} onAdd={vi.fn()} />)

    fireEvent.click(screen.getByText('+ Agregar día'))
    expect(screen.getByText('Seleccioná una fecha.')).toBeInTheDocument()
  })

  it('shows time inputs when custom_hours is selected', async () => {
    render(<ExceptionDateForm isSaving={false} onAdd={vi.fn()} />)

    await pickOption('Tipo', 'Horario especial')
    expect(screen.getByLabelText('Hora de inicio')).toBeInTheDocument()
    expect(screen.getByLabelText('Hora de fin')).toBeInTheDocument()
  })

  it('hides time inputs when day_off is selected', async () => {
    render(<ExceptionDateForm isSaving={false} onAdd={vi.fn()} />)

    // default is day_off — no time inputs
    expect(screen.queryByLabelText('Hora de inicio')).not.toBeInTheDocument()
  })

  it('calls onAdd with correct data when form is valid (day_off)', async () => {
    const onAdd = vi.fn()
    render(<ExceptionDateForm isSaving={false} onAdd={onAdd} />)

    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2025-12-25' } })
    fireEvent.click(screen.getByText('+ Agregar día'))

    expect(onAdd).toHaveBeenCalledWith({
      exceptionDate: '2025-12-25',
      exceptionType: 'day_off',
      startsAt: null,
      endsAt: null,
      pmStartsAt: null,
      pmEndsAt: null,
      reason: null,
    })
  })

  it('calls onAdd with correct data when form is valid (custom_hours)', async () => {
    const onAdd = vi.fn()
    render(<ExceptionDateForm isSaving={false} onAdd={onAdd} />)

    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2025-12-26' } })
    await pickOption('Tipo', 'Horario especial')
    fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: '10:00' } })
    fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: '14:00' } })
    fireEvent.click(screen.getByText('+ Agregar día'))

    expect(onAdd).toHaveBeenCalledWith({
      exceptionDate: '2025-12-26',
      exceptionType: 'custom_hours',
      startsAt: '10:00',
      endsAt: '14:00',
      pmStartsAt: null,
      pmEndsAt: null,
      reason: null,
    })
  })

  it('shows time error for invalid range in custom_hours mode', async () => {
    render(<ExceptionDateForm isSaving={false} onAdd={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2025-12-26' } })
    await pickOption('Tipo', 'Horario especial')
    fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: '18:00' } })
    fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: '09:00' } })
    fireEvent.click(screen.getByText('+ Agregar día'))

    expect(
      screen.getByText(/el inicio debe ser anterior al fin/),
    ).toBeInTheDocument()
  })

  it('disables button and inputs when isSaving', async () => {
    render(<ExceptionDateForm isSaving={true} onAdd={vi.fn()} />)

    expect(screen.getByText('Guardando...')).toBeDisabled()
  })

  describe('two shifts (split)', () => {
    async function pickCustomHours() {
      fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2025-12-26' } })
      await pickOption('Tipo', 'Horario especial')
    }

    it('offers matutino and vespertino for a special day', async () => {
      render(<ExceptionDateForm isSaving={false} split onAdd={vi.fn()} />)
      await pickCustomHours()
      expect(screen.getByLabelText('Turno matutino')).toBeChecked()
      expect(screen.getByLabelText('Turno vespertino')).toBeChecked()
    })

    it('can be only matutino', async () => {
      const onAdd = vi.fn()
      render(<ExceptionDateForm isSaving={false} split onAdd={onAdd} />)
      await pickCustomHours()
      fireEvent.click(screen.getByLabelText('Turno vespertino'))
      fireEvent.click(screen.getByText('+ Agregar día'))
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ startsAt: '09:00', endsAt: '13:00', pmStartsAt: null, pmEndsAt: null }),
      )
    })

    it('can be only vespertino', async () => {
      const onAdd = vi.fn()
      render(<ExceptionDateForm isSaving={false} split onAdd={onAdd} />)
      await pickCustomHours()
      fireEvent.click(screen.getByLabelText('Turno matutino'))
      fireEvent.click(screen.getByText('+ Agregar día'))
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ startsAt: null, endsAt: null, pmStartsAt: '15:00', pmEndsAt: '19:00' }),
      )
    })

    it('requires at least one shift (edge case)', async () => {
      const onAdd = vi.fn()
      render(<ExceptionDateForm isSaving={false} split onAdd={onAdd} />)
      await pickCustomHours()
      fireEvent.click(screen.getByLabelText('Turno matutino'))
      fireEvent.click(screen.getByLabelText('Turno vespertino'))
      fireEvent.click(screen.getByText('+ Agregar día'))
      expect(screen.getByText('Elegí al menos un turno.')).toBeInTheDocument()
      expect(onAdd).not.toHaveBeenCalled()
    })
  })
})
