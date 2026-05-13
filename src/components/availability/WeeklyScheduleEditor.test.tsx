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

    expect(screen.getByLabelText('Dom trabaja')).toBeInTheDocument()
    expect(screen.getByLabelText('Lun trabaja')).toBeInTheDocument()
    expect(screen.getByLabelText('Mar trabaja')).toBeInTheDocument()
    expect(screen.getByLabelText('Mié trabaja')).toBeInTheDocument()
    expect(screen.getByLabelText('Jue trabaja')).toBeInTheDocument()
    expect(screen.getByLabelText('Vie trabaja')).toBeInTheDocument()
    expect(screen.getByLabelText('Sáb trabaja')).toBeInTheDocument()
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
    const startInputs = screen.getAllByLabelText('Hora de inicio')
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

    const startInputs = screen.getAllByLabelText('Hora de inicio')
    fireEvent.change(startInputs[0], { target: { value: '20:00' } })
    fireEvent.click(screen.getByText('Guardar horario'))

    expect(
      screen.getByText('La hora de inicio debe ser anterior a la hora de fin.'),
    ).toBeInTheDocument()
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
})
