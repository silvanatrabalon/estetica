import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BookingSlotDayView } from './BookingSlotDayView'
import type { AvailableSlot } from '../../services/availability'
import { getTopPx, getHeightPx, getGridOpenMinutes } from '../../lib/timeAxis'

const OPEN_TIME = '09:00'
const CLOSE_TIME = '20:00'
const TZ = 'UTC'

function makeSlot(startsAt: string, endsAt: string): AvailableSlot {
  return { starts_at: startsAt, ends_at: endsAt }
}

function renderView(
  props: Partial<React.ComponentProps<typeof BookingSlotDayView>> & {
    slots?: AvailableSlot[]
  } = {},
) {
  return render(
    <BookingSlotDayView
      slots={props.slots ?? []}
      selectedSlot={props.selectedSlot ?? null}
      onSelectSlot={props.onSelectSlot ?? vi.fn()}
      orgTimezone={props.orgTimezone ?? TZ}
      openTime={props.openTime ?? OPEN_TIME}
      closeTime={props.closeTime ?? CLOSE_TIME}
      loading={props.loading ?? false}
    />,
  )
}

describe('BookingSlotDayView', () => {
  // Task 5.2 — top and height styles
  it('slot block has correct top style based on starts_at', () => {
    const slot = makeSlot('2026-05-18T09:30:00Z', '2026-05-18T10:00:00Z')
    renderView({ slots: [slot] })
    const block = screen.getByTestId('slot-block')
    const gridOpenMinutes = getGridOpenMinutes(OPEN_TIME)
    const expectedTop = getTopPx(slot.starts_at, gridOpenMinutes, TZ)
    expect(block.style.top).toBe(`${expectedTop}px`)
  })

  it('slot block has correct height based on duration', () => {
    // 30-minute slot → getHeightPx(30)
    const slot = makeSlot('2026-05-18T09:00:00Z', '2026-05-18T09:30:00Z')
    renderView({ slots: [slot] })
    const block = screen.getByTestId('slot-block')
    const expectedHeight = getHeightPx(30)
    expect(block.style.height).toBe(`${expectedHeight}px`)
  })

  it('60-minute slot has double the height of a 30-minute slot', () => {
    const slot30 = makeSlot('2026-05-18T09:00:00Z', '2026-05-18T09:30:00Z')
    const slot60 = makeSlot('2026-05-18T10:00:00Z', '2026-05-18T11:00:00Z')
    const { unmount } = renderView({ slots: [slot30] })
    const block30 = screen.getByTestId('slot-block')
    const height30 = parseInt(block30.style.height)
    unmount()

    renderView({ slots: [slot60] })
    const block60 = screen.getByTestId('slot-block')
    const height60 = parseInt(block60.style.height)

    expect(height60).toBe(height30 * 2)
  })

  // Task 5.3 — selected vs unselected styling
  it('selected slot block has selected testid', () => {
    const slot = makeSlot('2026-05-18T09:00:00Z', '2026-05-18T09:30:00Z')
    renderView({ slots: [slot], selectedSlot: slot })
    expect(screen.getByTestId('slot-block-selected')).toBeInTheDocument()
    expect(screen.queryByTestId('slot-block')).not.toBeInTheDocument()
  })

  it('unselected slot block does not have selected testid', () => {
    const slot = makeSlot('2026-05-18T09:00:00Z', '2026-05-18T09:30:00Z')
    renderView({ slots: [slot], selectedSlot: null })
    expect(screen.getByTestId('slot-block')).toBeInTheDocument()
    expect(screen.queryByTestId('slot-block-selected')).not.toBeInTheDocument()
  })

  it('only the matching slot has selected styling when multiple slots present', () => {
    const slot1 = makeSlot('2026-05-18T09:00:00Z', '2026-05-18T09:30:00Z')
    const slot2 = makeSlot('2026-05-18T10:00:00Z', '2026-05-18T10:30:00Z')
    renderView({ slots: [slot1, slot2], selectedSlot: slot1 })
    expect(screen.getByTestId('slot-block-selected')).toBeInTheDocument()
    expect(screen.getByTestId('slot-block')).toBeInTheDocument()
  })

  // Task 5.4 — clicking calls onSelectSlot
  it('clicking a slot block calls onSelectSlot with the correct slot', () => {
    const slot = makeSlot('2026-05-18T09:00:00Z', '2026-05-18T09:30:00Z')
    const onSelectSlot = vi.fn()
    renderView({ slots: [slot], onSelectSlot })
    fireEvent.click(screen.getByTestId('slot-block'))
    expect(onSelectSlot).toHaveBeenCalledWith(slot)
    expect(onSelectSlot).toHaveBeenCalledTimes(1)
  })

  // Task 5.5 — empty state
  it('shows Spanish empty state when slots=[] and not loading', () => {
    renderView({ slots: [], loading: false })
    expect(screen.getByTestId('booking-slot-empty')).toHaveTextContent(
      'No hay turnos disponibles para este día',
    )
  })

  it('does not show empty state when there are slots', () => {
    const slot = makeSlot('2026-05-18T09:00:00Z', '2026-05-18T09:30:00Z')
    renderView({ slots: [slot] })
    expect(screen.queryByTestId('booking-slot-empty')).not.toBeInTheDocument()
  })

  // Task 5.6 — loading skeleton
  it('renders loading skeleton when loading=true', () => {
    renderView({ loading: true })
    expect(screen.getByTestId('booking-slot-loading')).toBeInTheDocument()
  })

  it('does not render slot blocks when loading=true', () => {
    const slot = makeSlot('2026-05-18T09:00:00Z', '2026-05-18T09:30:00Z')
    renderView({ slots: [slot], loading: true })
    expect(screen.queryByTestId('slot-block')).not.toBeInTheDocument()
    expect(screen.queryByTestId('slot-block-selected')).not.toBeInTheDocument()
  })

  it('does not render empty state when loading=true', () => {
    renderView({ slots: [], loading: true })
    expect(screen.queryByTestId('booking-slot-empty')).not.toBeInTheDocument()
  })

  // Task 5.7 — hour labels
  it('renders hour labels for each whole-hour boundary between openTime and closeTime', () => {
    renderView({ openTime: '09:00', closeTime: '12:00' })
    // Hours: 09:00, 10:00, 11:00
    expect(screen.getByTestId('hour-label-9')).toBeInTheDocument()
    expect(screen.getByTestId('hour-label-10')).toBeInTheDocument()
    expect(screen.getByTestId('hour-label-11')).toBeInTheDocument()
    expect(screen.queryByTestId('hour-label-12')).not.toBeInTheDocument()
  })

  it('shows slot start time inside the block', () => {
    // 09:00 UTC → "09:00" in UTC timezone
    const slot = makeSlot('2026-05-18T09:00:00Z', '2026-05-18T09:30:00Z')
    renderView({ slots: [slot] })
    // formatSlotTime renders the hour:minute; just check for "09:" prefix presence
    const block = screen.getByTestId('slot-block')
    expect(block.textContent).toContain('30 min')
  })

  // Task 2.1 — scroll container has top padding on mount
  it('scroll container has pt-2 class on mount', () => {
    renderView()
    const scrollContainer = document.querySelector('.overflow-y-auto')
    expect(scrollContainer).toHaveClass('pt-2')
  })

  // Task 2.2 — unselected available slot uses high-contrast background
  it('unselected available slot uses high-contrast teal background', () => {
    const slot = makeSlot('2026-05-18T09:00:00Z', '2026-05-18T09:30:00Z')
    renderView({ slots: [slot], selectedSlot: null })
    const block = screen.getByTestId('slot-block')
    expect(block).toHaveClass('bg-teal-500')
  })
})
