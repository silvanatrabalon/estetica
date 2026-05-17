import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SlotPickerModal } from './SlotPickerModal'

// ── Mock useAvailableSlots ─────────────────────────────────────────────────

const mockUseAvailableSlots = vi.hoisted(() => vi.fn())

vi.mock('../../hooks/useAvailableSlots', () => ({
  useAvailableSlots: (...args: unknown[]) => mockUseAvailableSlots(...args),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────

const defaultSlots = [
  { starts_at: '2026-05-17T14:00:00Z', ends_at: '2026-05-17T15:00:00Z' },
  { starts_at: '2026-05-17T15:00:00Z', ends_at: '2026-05-17T16:00:00Z' },
]

const defaultProps = {
  serviceId: 'svc-1',
  date: '2026-05-17',
  orgTimezone: 'UTC',
  onConfirm: vi.fn(),
  onClose: vi.fn(),
}

describe('SlotPickerModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAvailableSlots.mockReturnValue({
      slots: defaultSlots,
      loading: false,
      error: null,
    })
  })

  it('renders the title "Elegí un horario"', () => {
    render(<SlotPickerModal {...defaultProps} />)
    expect(screen.getByRole('heading', { name: /Elegí un horario/i })).toBeInTheDocument()
  })

  it('renders slot buttons when slots are available', () => {
    render(<SlotPickerModal {...defaultProps} />)
    const buttons = screen.getAllByRole('button')
    // Slot buttons + close button
    const slotButtons = buttons.filter((b) => b.getAttribute('aria-label') !== 'Cerrar')
    expect(slotButtons.length).toBeGreaterThanOrEqual(2)
  })

  it('calls useAvailableSlots with correct serviceId and date', () => {
    render(<SlotPickerModal {...defaultProps} />)
    expect(mockUseAvailableSlots).toHaveBeenCalledWith('svc-1', '2026-05-17')
  })

  it('shows empty state when no slots available', () => {
    mockUseAvailableSlots.mockReturnValue({ slots: [], loading: false, error: null })
    render(<SlotPickerModal {...defaultProps} />)
    expect(
      screen.getByText(/No hay horarios disponibles para esta fecha. Elegí otro día./i),
    ).toBeInTheDocument()
  })

  it('shows loading state while fetching', () => {
    mockUseAvailableSlots.mockReturnValue({ slots: [], loading: true, error: null })
    render(<SlotPickerModal {...defaultProps} />)
    expect(screen.getByText(/Buscando horarios disponibles/i)).toBeInTheDocument()
  })

  it('close button calls onClose', () => {
    const onClose = vi.fn()
    render(<SlotPickerModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /Cerrar/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('clicking a slot calls onConfirm with startsAt', () => {
    const onConfirm = vi.fn()
    render(<SlotPickerModal {...defaultProps} onConfirm={onConfirm} />)
    // Click the first slot button (not the close button)
    const slotButtons = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-label') !== 'Cerrar')
    fireEvent.click(slotButtons[0])
    expect(onConfirm).toHaveBeenCalledWith('2026-05-17T14:00:00Z')
  })

  it('renders Spanish error message when error prop is provided', () => {
    const errorMsg = 'El horario seleccionado ya no está disponible. Elegí otro.'
    render(<SlotPickerModal {...defaultProps} error={errorMsg} />)
    expect(screen.getByText(errorMsg)).toBeInTheDocument()
  })

  it('slot buttons are disabled when confirming is true', () => {
    render(<SlotPickerModal {...defaultProps} confirming={true} />)
    const slotButtons = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-label') !== 'Cerrar')
    slotButtons.forEach((btn) => {
      expect(btn).toBeDisabled()
    })
  })
})
