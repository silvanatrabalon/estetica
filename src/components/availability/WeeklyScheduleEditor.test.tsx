import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WeeklyScheduleEditor } from '../../components/availability/WeeklyScheduleEditor'
import type { StaffScheduleDay } from '../../services/staffAvailability'

const emptySchedule: StaffScheduleDay[] = []

const loadedSchedule: StaffScheduleDay[] = [
  {
    id: '1',
    staffMemberId: 'staff-1',
    dayOfWeek: 1,
    isWorking: true,
    startsAt: '09:00',
    endsAt: '17:00',
    pmStartsAt: null,
    pmEndsAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

describe('WeeklyScheduleEditor', () => {
  it('renders all 7 day rows', () => {
    render(
      <WeeklyScheduleEditor
        schedule={emptySchedule}
        isSaving={false}
        onSave={vi.fn()}
        onDirtyChange={vi.fn()}
      />,
    )

    expect(screen.getByLabelText(/^Domingo trabaja/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Lunes trabaja/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Martes trabaja/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Miércoles trabaja/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Jueves trabaja/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Viernes trabaja/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Sábado trabaja/)).toBeInTheDocument()
  })

  it('shows time inputs for working days from loaded schedule', () => {
    render(
      <WeeklyScheduleEditor
        schedule={loadedSchedule}
        isSaving={false}
        onSave={vi.fn()}
        onDirtyChange={vi.fn()}
      />,
    )

    // Monday (dayOfWeek=1) is working, so time inputs should appear
    const startInputs = screen.getAllByLabelText(/hora de inicio/)
    expect(startInputs.length).toBeGreaterThan(0)
  })

  it('calls onSave with schedule when save button is clicked', () => {
    const onSave = vi.fn()
    render(
      <WeeklyScheduleEditor
        schedule={loadedSchedule}
        isSaving={false}
        onSave={onSave}
        onDirtyChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByText('Guardar horario'))
    expect(onSave).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ day_of_week: 1, is_working: true }),
    ]))
  })

  it('shows validation error for invalid time range', () => {
    render(
      <WeeklyScheduleEditor
        schedule={loadedSchedule}
        isSaving={false}
        onSave={vi.fn()}
        onDirtyChange={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText('Lunes: hora de inicio'), { target: { value: '20:00' } })
    fireEvent.click(screen.getByText('Guardar horario'))

    expect(screen.getByText(/el inicio debe ser anterior al fin/)).toBeInTheDocument()
  })

  it('shows Guardando text and disables button when isSaving', () => {
    render(
      <WeeklyScheduleEditor
        schedule={emptySchedule}
        isSaving={true}
        onSave={vi.fn()}
        onDirtyChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Guardando...')).toBeDisabled()
  })
  describe('readOnly', () => {
    it('hides the save button when read-only', () => {
      render(
        <WeeklyScheduleEditor schedule={loadedSchedule} isSaving={false} onSave={vi.fn()} onDirtyChange={vi.fn()} readOnly />,
      )
      expect(screen.queryByRole('button', { name: 'Guardar horario' })).toBeNull()
    })

    it('disables every control when read-only (edge case)', () => {
      const { container } = render(
        <WeeklyScheduleEditor schedule={loadedSchedule} isSaving={false} onSave={vi.fn()} onDirtyChange={vi.fn()} readOnly />,
      )
      const controls = container.querySelectorAll('input, select, button')
      expect(controls.length).toBeGreaterThan(0)
      controls.forEach((el) => expect(el).toBeDisabled())
    })

    it('stays editable by default', () => {
      render(
        <WeeklyScheduleEditor schedule={loadedSchedule} isSaving={false} onSave={vi.fn()} onDirtyChange={vi.fn()} />,
      )
      expect(screen.getByRole('button', { name: 'Guardar horario' })).toBeEnabled()
    })
  })

  describe('two shifts (split)', () => {
    const splitSchedule: StaffScheduleDay[] = [
      { ...loadedSchedule[0], startsAt: '09:00', endsAt: '13:00', pmStartsAt: '15:00', pmEndsAt: '19:00' },
    ]

    it('shows matutino and vespertino for each working day', () => {
      render(
        <WeeklyScheduleEditor schedule={splitSchedule} isSaving={false} onSave={vi.fn()} onDirtyChange={vi.fn()} split />,
      )
      expect(screen.getByLabelText('Lunes: Turno matutino')).toBeChecked()
      expect(screen.getByLabelText('Lunes: Turno vespertino')).toBeChecked()
      expect(screen.getByLabelText('Lunes: Turno vespertino: hora de inicio')).toHaveValue('15:00')
    })

    it('saves both shifts', () => {
      const onSave = vi.fn()
      render(<WeeklyScheduleEditor schedule={splitSchedule} isSaving={false} onSave={onSave} onDirtyChange={vi.fn()} split />)
      fireEvent.click(screen.getByText('Guardar horario'))
      expect(onSave).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            day_of_week: 1,
            starts_at: '09:00',
            ends_at: '13:00',
            pm_starts_at: '15:00',
            pm_ends_at: '19:00',
          }),
        ]),
      )
    })

    it('a day with only the vespertino shift saves empty morning times', () => {
      const onSave = vi.fn()
      render(<WeeklyScheduleEditor schedule={splitSchedule} isSaving={false} onSave={onSave} onDirtyChange={vi.fn()} split />)
      fireEvent.click(screen.getByLabelText('Lunes: Turno matutino'))
      fireEvent.click(screen.getByText('Guardar horario'))
      expect(onSave).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ day_of_week: 1, starts_at: null, ends_at: null, pm_starts_at: '15:00' }),
        ]),
      )
    })

    it('blocks saving a working day with both shifts off (edge case)', () => {
      const onSave = vi.fn()
      render(<WeeklyScheduleEditor schedule={splitSchedule} isSaving={false} onSave={onSave} onDirtyChange={vi.fn()} split />)
      fireEvent.click(screen.getByLabelText('Lunes: Turno matutino'))
      fireEvent.click(screen.getByLabelText('Lunes: Turno vespertino'))
      fireEvent.click(screen.getByText('Guardar horario'))
      expect(screen.getByText('Elegí al menos un turno.')).toBeInTheDocument()
      expect(onSave).not.toHaveBeenCalled()
    })

    it('blocks overlapping shifts (edge case)', () => {
      const onSave = vi.fn()
      render(<WeeklyScheduleEditor schedule={splitSchedule} isSaving={false} onSave={onSave} onDirtyChange={vi.fn()} split />)
      fireEvent.change(screen.getByLabelText('Lunes: Turno vespertino: hora de inicio'), { target: { value: '12:00' } })
      fireEvent.click(screen.getByText('Guardar horario'))
      expect(screen.getByText(/debe empezar después/)).toBeInTheDocument()
      expect(onSave).not.toHaveBeenCalled()
    })

    it('in continuous mode a split row is shown as one merged range (edge case)', () => {
      const onSave = vi.fn()
      render(<WeeklyScheduleEditor schedule={splitSchedule} isSaving={false} onSave={onSave} onDirtyChange={vi.fn()} />)
      expect(screen.queryByLabelText('Lunes: Turno matutino')).toBeNull()
      expect(screen.getByLabelText('Lunes: hora de inicio')).toHaveValue('09:00')
      expect(screen.getByLabelText('Lunes: hora de fin')).toHaveValue('19:00')
    })
  })
})

describe('WeeklyScheduleEditor — unsaved changes', () => {
  function setup() {
    const onDirtyChange = vi.fn()
    render(<WeeklyScheduleEditor schedule={loadedSchedule} isSaving={false} onSave={vi.fn()} onDirtyChange={onDirtyChange} />)
    return onDirtyChange
  }

  it('is clean at the start, with no notice', () => {
    const onDirtyChange = setup()
    expect(onDirtyChange).toHaveBeenLastCalledWith(false)
    expect(screen.queryByText(/Tenés cambios sin guardar/)).toBeNull()
    expect(screen.getByRole('button', { name: 'Guardar horario' })).toBeInTheDocument()
  })

  it('a change marks it as unsaved and shows the notice next to the Guardar button', () => {
    const onDirtyChange = setup()
    fireEvent.click(screen.getByLabelText(/^Martes trabaja/))
    expect(onDirtyChange).toHaveBeenLastCalledWith(true)
    expect(screen.getByRole('status')).toHaveTextContent(
      'Tenés cambios sin guardar. Apretá “Guardar horario” antes de salir de esta sección: no se guardan solos.',
    )
  })

  it('undoing the change makes it clean again (edge case)', () => {
    const onDirtyChange = setup()
    fireEvent.click(screen.getByLabelText(/^Martes trabaja/))
    expect(onDirtyChange).toHaveBeenLastCalledWith(true)
    fireEvent.click(screen.getByLabelText(/^Martes trabaja/))
    expect(onDirtyChange).toHaveBeenLastCalledWith(false)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('read-only never shows the notice or the button (edge case)', () => {
    render(<WeeklyScheduleEditor schedule={loadedSchedule} isSaving={false} onSave={vi.fn()} onDirtyChange={vi.fn()} readOnly />)
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Guardar horario' })).toBeNull()
  })
})
