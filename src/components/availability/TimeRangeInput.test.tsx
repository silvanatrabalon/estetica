import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TimeRangeInput } from '../../components/availability/TimeRangeInput'

describe('TimeRangeInput', () => {
  it('renders start and end time inputs', () => {
    render(
      <TimeRangeInput
        startsAt="09:00"
        endsAt="18:00"
        onStartsAtChange={vi.fn()}
        onEndsAtChange={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Hora de inicio')).toBeInTheDocument()
    expect(screen.getByLabelText('Hora de fin')).toBeInTheDocument()
  })

  it('calls onStartsAtChange when start time changes', () => {
    const onStartsAtChange = vi.fn()
    render(
      <TimeRangeInput
        startsAt="09:00"
        endsAt="18:00"
        onStartsAtChange={onStartsAtChange}
        onEndsAtChange={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: '10:00' } })
    expect(onStartsAtChange).toHaveBeenCalledWith('10:00')
  })

  it('calls onEndsAtChange when end time changes', () => {
    const onEndsAtChange = vi.fn()
    render(
      <TimeRangeInput
        startsAt="09:00"
        endsAt="18:00"
        onStartsAtChange={vi.fn()}
        onEndsAtChange={onEndsAtChange}
      />,
    )

    fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: '19:00' } })
    expect(onEndsAtChange).toHaveBeenCalledWith('19:00')
  })

  it('shows error message when provided', () => {
    render(
      <TimeRangeInput
        startsAt="09:00"
        endsAt="08:00"
        onStartsAtChange={vi.fn()}
        onEndsAtChange={vi.fn()}
        error="La hora de inicio debe ser anterior a la hora de fin."
      />,
    )

    expect(
      screen.getByText('La hora de inicio debe ser anterior a la hora de fin.'),
    ).toBeInTheDocument()
  })

  it('disables inputs when disabled prop is true', () => {
    render(
      <TimeRangeInput
        startsAt="09:00"
        endsAt="18:00"
        disabled
        onStartsAtChange={vi.fn()}
        onEndsAtChange={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Hora de inicio')).toBeDisabled()
    expect(screen.getByLabelText('Hora de fin')).toBeDisabled()
  })
})
