import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import { ExceptionDateForm } from '../../components/availability/ExceptionDateForm'
import { pickOption } from '../../hooks/__test-utils__/select'

/** Renders the button and opens the pop-up, as a person would. */
function renderOpen(ui: ReactElement) {
  const view = render(ui)
  fireEvent.click(screen.getByRole('button', { name: '+ Agregar' }))
  return view
}

const submit = () => screen.getByRole('button', { name: 'Agregar día' })

describe('ExceptionDateForm', () => {
  it('shows only the Agregar button, with no form until it is pressed', () => {
    render(<ExceptionDateForm isSaving={false} onAdd={vi.fn()} />)
    expect(screen.getByRole('button', { name: '+ Agregar' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByLabelText('Fecha')).toBeNull()
  })

  it('the button opens a pop-up and Cancelar or Escape close it without adding', () => {
    const onAdd = vi.fn()
    renderOpen(<ExceptionDateForm isSaving={false} onAdd={onAdd} />)
    expect(screen.getByRole('dialog', { name: 'Agregar día libre o especial' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '+ Agregar' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('closes after adding, and opens empty the next time', async () => {
    const onAdd = vi.fn().mockResolvedValue(true)
    renderOpen(<ExceptionDateForm isSaving={false} onAdd={onAdd} />)
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2025-12-25' } })
    fireEvent.click(submit())
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    fireEvent.click(screen.getByRole('button', { name: '+ Agregar' }))
    expect((screen.getByLabelText('Fecha') as HTMLInputElement).value).toBe('')
  })

  it('stays open with what was typed when the day could not be saved (edge case)', async () => {
    const onAdd = vi.fn().mockResolvedValue(false)
    renderOpen(<ExceptionDateForm isSaving={false} onAdd={onAdd} error="La fecha seleccionada ya tiene un día registrado." />)
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2025-12-25' } })
    fireEvent.click(submit())
    await waitFor(() => expect(onAdd).toHaveBeenCalled())
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect((screen.getByLabelText('Fecha') as HTMLInputElement).value).toBe('2025-12-25')
    expect(screen.getByRole('dialog')).toContainElement(screen.getByRole('alert'))
    expect(screen.getByRole('alert')).toHaveTextContent('ya tiene un día registrado')
  })

  it('renders date and type inputs', async () => {
    renderOpen(<ExceptionDateForm isSaving={false} onAdd={vi.fn()} />)

    expect(screen.getByLabelText('Fecha')).toBeInTheDocument()
    expect(screen.getByLabelText('Tipo')).toBeInTheDocument()
  })

  it('shows validation error when submitting without date', async () => {
    renderOpen(<ExceptionDateForm isSaving={false} onAdd={vi.fn()} />)

    fireEvent.click(submit())
    expect(screen.getByText('Seleccioná una fecha.')).toBeInTheDocument()
  })

  it('shows time inputs when custom_hours is selected', async () => {
    renderOpen(<ExceptionDateForm isSaving={false} onAdd={vi.fn()} />)

    await pickOption('Tipo', 'Horario especial')
    expect(screen.getByLabelText('Hora de inicio')).toBeInTheDocument()
    expect(screen.getByLabelText('Hora de fin')).toBeInTheDocument()
  })

  it('hides time inputs when day_off is selected', async () => {
    renderOpen(<ExceptionDateForm isSaving={false} onAdd={vi.fn()} />)

    // default is day_off — no time inputs
    expect(screen.queryByLabelText('Hora de inicio')).not.toBeInTheDocument()
  })

  it('calls onAdd with correct data when form is valid (day_off)', async () => {
    const onAdd = vi.fn()
    renderOpen(<ExceptionDateForm isSaving={false} onAdd={onAdd} />)

    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2025-12-25' } })
    fireEvent.click(submit())

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
    renderOpen(<ExceptionDateForm isSaving={false} onAdd={onAdd} />)

    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2025-12-26' } })
    await pickOption('Tipo', 'Horario especial')
    fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: '10:00' } })
    fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: '14:00' } })
    fireEvent.click(submit())

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
    renderOpen(<ExceptionDateForm isSaving={false} onAdd={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2025-12-26' } })
    await pickOption('Tipo', 'Horario especial')
    fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: '18:00' } })
    fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: '09:00' } })
    fireEvent.click(submit())

    expect(
      screen.getByText(/el inicio debe ser anterior al fin/),
    ).toBeInTheDocument()
  })

  it('disables button and inputs when isSaving', async () => {
    renderOpen(<ExceptionDateForm isSaving={true} onAdd={vi.fn()} />)

    expect(screen.getByText('Guardando...')).toBeDisabled()
  })

  describe('two shifts (split)', () => {
    async function pickCustomHours() {
      fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2025-12-26' } })
      await pickOption('Tipo', 'Horario especial')
    }

    it('offers matutino and vespertino for a special day', async () => {
      renderOpen(<ExceptionDateForm isSaving={false} split onAdd={vi.fn()} />)
      await pickCustomHours()
      expect(screen.getByLabelText('Turno matutino')).toBeChecked()
      expect(screen.getByLabelText('Turno vespertino')).toBeChecked()
    })

    it('can be only matutino', async () => {
      const onAdd = vi.fn()
      renderOpen(<ExceptionDateForm isSaving={false} split onAdd={onAdd} />)
      await pickCustomHours()
      fireEvent.click(screen.getByLabelText('Turno vespertino'))
      fireEvent.click(submit())
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ startsAt: '09:00', endsAt: '13:00', pmStartsAt: null, pmEndsAt: null }),
      )
    })

    it('can be only vespertino', async () => {
      const onAdd = vi.fn()
      renderOpen(<ExceptionDateForm isSaving={false} split onAdd={onAdd} />)
      await pickCustomHours()
      fireEvent.click(screen.getByLabelText('Turno matutino'))
      fireEvent.click(submit())
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ startsAt: null, endsAt: null, pmStartsAt: '15:00', pmEndsAt: '19:00' }),
      )
    })

    it('requires at least one shift (edge case)', async () => {
      const onAdd = vi.fn()
      renderOpen(<ExceptionDateForm isSaving={false} split onAdd={onAdd} />)
      await pickCustomHours()
      fireEvent.click(screen.getByLabelText('Turno matutino'))
      fireEvent.click(screen.getByLabelText('Turno vespertino'))
      fireEvent.click(submit())
      expect(screen.getByText('Elegí al menos un turno.')).toBeInTheDocument()
      expect(onAdd).not.toHaveBeenCalled()
    })
  })
})
