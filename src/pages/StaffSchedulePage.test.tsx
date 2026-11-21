import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

describe('StaffSchedulePage permission', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lets the professional edit when the admin allowed it', () => {
    mockHook.mockReturnValue(hookValue({ canEdit: true }))
    render(<StaffSchedulePage />)

    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByRole('button', { name: 'Guardar horario' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument()
  })

  it('shows a read-only view with a notice when editing is not allowed', () => {
    mockHook.mockReturnValue(hookValue({ canEdit: false }))
    render(<StaffSchedulePage />)

    expect(screen.getByRole('status')).toHaveTextContent('Tu administrador define tus horarios')
    expect(screen.queryByRole('button', { name: 'Guardar horario' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Eliminar' })).toBeNull()
  })

  it('still lists the exceptions when read-only (edge case)', () => {
    mockHook.mockReturnValue(hookValue({ canEdit: false }))
    render(<StaffSchedulePage />)
    expect(screen.getByText(/Navidad/)).toBeInTheDocument()
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
})
