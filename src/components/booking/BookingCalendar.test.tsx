import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BookingCalendar } from './BookingCalendar'

const mockGetAvailableDays = vi.fn()
vi.mock('../../services/availability', () => ({
  getAvailableDays: (...a: unknown[]) => mockGetAvailableDays(...a),
}))

function renderCalendar(props: Partial<React.ComponentProps<typeof BookingCalendar>> = {}) {
  const onSelect = vi.fn()
  render(
    <BookingCalendar
      serviceId="svc-1"
      minDate="2026-11-21"
      maxDate="2027-01-20"
      selectedDate={null}
      onSelect={onSelect}
      {...props}
    />,
  )
  return onSelect
}

describe('BookingCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAvailableDays.mockResolvedValue([
      { day: '2026-11-24', slotCount: 12 },
      { day: '2026-11-27', slotCount: 2 },
    ])
  })

  it('shows the month and requests only the bookable part of it', async () => {
    renderCalendar()
    expect(screen.getByText('Noviembre de 2026')).toBeInTheDocument()
    await waitFor(() => expect(mockGetAvailableDays).toHaveBeenCalledWith('svc-1', '2026-11-21', '2026-11-30'))
  })

  it('only days with free slots are buttons; the rest are disabled (e.g. Sundays)', async () => {
    renderCalendar()
    const free = await screen.findByRole('button', { name: /24 de noviembre, 12 horarios libres/ })
    expect(free).toBeEnabled()
    expect(screen.getAllByRole('button', { name: /horarios? libres?/ })).toHaveLength(2)
    // Sunday 22 is not a button
    expect(screen.queryByRole('button', { name: /22 de noviembre/ })).toBeNull()
  })

  it('uses the singular for a single free slot (edge case)', async () => {
    mockGetAvailableDays.mockResolvedValue([{ day: '2026-11-24', slotCount: 1 }])
    renderCalendar()
    expect(await screen.findByRole('button', { name: '24 de noviembre, 1 horario libre' })).toBeInTheDocument()
  })

  it('picking a day calls onSelect with its date key', async () => {
    const onSelect = renderCalendar()
    fireEvent.click(await screen.findByRole('button', { name: /27 de noviembre/ }))
    expect(onSelect).toHaveBeenCalledWith('2026-11-27')
  })

  it('marks the selected day', async () => {
    renderCalendar({ selectedDate: '2026-11-24' })
    expect(await screen.findByRole('button', { name: /24 de noviembre/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('cannot go before the current month, but can move forward and request the next month', async () => {
    renderCalendar()
    expect(screen.getByRole('button', { name: 'Mes anterior' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Mes siguiente' }))
    expect(screen.getByText('Diciembre de 2026')).toBeInTheDocument()
    await waitFor(() => expect(mockGetAvailableDays).toHaveBeenLastCalledWith('svc-1', '2026-12-01', '2026-12-31'))
    expect(screen.getByRole('button', { name: 'Mes anterior' })).toBeEnabled()
  })

  it('stops at the last month of the booking window (edge case)', () => {
    renderCalendar({ minDate: '2026-12-15', maxDate: '2027-01-20' })
    fireEvent.click(screen.getByRole('button', { name: 'Mes siguiente' }))
    expect(screen.getByText('Enero de 2027')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mes siguiente' })).toBeDisabled()
  })

  it('says so when the month has no available days (edge case)', async () => {
    mockGetAvailableDays.mockResolvedValue([])
    renderCalendar()
    expect(await screen.findByText(/No hay días disponibles este mes/)).toBeInTheDocument()
    expect(screen.getByText(/Probá con el mes siguiente/)).toBeInTheDocument()
  })

  it('shows an error when the days cannot be loaded (edge case)', async () => {
    mockGetAvailableDays.mockRejectedValue(new Error('down'))
    renderCalendar()
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los días disponibles')
  })

  it('explains the colors with a legend', () => {
    renderCalendar()
    expect(screen.getByText('Varios horarios libres')).toBeInTheDocument()
    expect(screen.getByText('Pocos horarios libres')).toBeInTheDocument()
    expect(screen.getByText('Sin disponibilidad')).toBeInTheDocument()
  })
})
