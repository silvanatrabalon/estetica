import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { StaffSchedulePage } from './StaffSchedulePage'

const mockHook = vi.fn()
vi.mock('../hooks/useMyStaffAvailability', () => ({
  useMyStaffAvailability: () => mockHook(),
}))

const exception = {
  id: 'e1',
  staffMemberId: 's1',
  exceptionDate: '2026-12-24',
  exceptionType: 'day_off',
  startsAt: null,
  endsAt: null,
  reason: 'Navidad',
}

function hookValue(overrides: Record<string, unknown> = {}) {
  return {
    status: 'ready',
    canEdit: true,
    canEditDaysOff: true,
    schedule: [],
    exceptions: [exception],
    isSaving: false,
    isDirty: false,
    errorMessage: null,
    successMessage: null,
    saveSchedule: vi.fn(),
    addException: vi.fn(),
    removeException: vi.fn(),
    setIsDirty: vi.fn(),
    ...overrides,
  }
}

function openDaysTab() {
  fireEvent.click(screen.getByRole('tab', { name: 'Días libres y especiales' }))
}

describe('StaffSchedulePage permission', () => {
  beforeEach(() => vi.clearAllMocks())

  it('starts on the weekly schedule tab and lets the professional edit when allowed', () => {
    mockHook.mockReturnValue(hookValue({ canEdit: true }))
    render(<StaffSchedulePage />)

    expect(screen.getByRole('tab', { name: 'Horario semanal' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByRole('button', { name: 'Guardar horario' })).toBeInTheDocument()
  })

  it('shows a read-only schedule with a notice when editing is not allowed', () => {
    mockHook.mockReturnValue(hookValue({ canEdit: false }))
    render(<StaffSchedulePage />)

    expect(screen.getByRole('status')).toHaveTextContent('Tu administrador define tus horarios')
    expect(screen.queryByRole('button', { name: 'Guardar horario' })).toBeNull()
  })

  it('disables the weekly inputs when read-only (edge case)', () => {
    mockHook.mockReturnValue(hookValue({ canEdit: false }))
    const { container } = render(<StaffSchedulePage />)
    const inputs = container.querySelectorAll('input, select, button[role="switch"]')
    expect(inputs.length).toBeGreaterThan(0)
    inputs.forEach((el) => expect(el).toBeDisabled())
  })

  it('asks the professional to contact the admin when read-only and no schedule exists (edge case)', () => {
    mockHook.mockReturnValue(hookValue({ canEdit: false, exceptions: [] }))
    render(<StaffSchedulePage />)
    expect(screen.getByText(/Pedíselo a tu administrador/)).toBeInTheDocument()
  })

  it('lists days off and lets the professional remove them when allowed', () => {
    mockHook.mockReturnValue(hookValue({ canEditDaysOff: true }))
    render(<StaffSchedulePage />)
    openDaysTab()

    expect(screen.getByText(/Navidad/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument()
    expect(screen.getByText('+ Agregar día')).toBeInTheDocument()
  })

  it('days off are read-only with a notice when not allowed, but still listed (edge case)', () => {
    mockHook.mockReturnValue(hookValue({ canEdit: true, canEditDaysOff: false }))
    render(<StaffSchedulePage />)
    openDaysTab()

    expect(screen.getByRole('status')).toHaveTextContent('Tu administrador carga tus días libres')
    expect(screen.getByText(/Navidad/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Eliminar' })).toBeNull()
    expect(screen.queryByText('+ Agregar día')).toBeNull()
  })

  it('the two permissions are independent (edge case)', () => {
    mockHook.mockReturnValue(hookValue({ canEdit: false, canEditDaysOff: true }))
    render(<StaffSchedulePage />)
    expect(screen.queryByRole('button', { name: 'Guardar horario' })).toBeNull()
    openDaysTab()
    expect(screen.getByText('+ Agregar día')).toBeInTheDocument()
  })
})
