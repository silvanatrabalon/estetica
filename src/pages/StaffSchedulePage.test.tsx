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
    expect(screen.getByRole('button', { name: '+ Agregar' })).toBeInTheDocument()
  })

  it('days off are read-only with a notice when not allowed, but still listed (edge case)', () => {
    mockHook.mockReturnValue(hookValue({ canEdit: true, canEditDaysOff: false }))
    render(<StaffSchedulePage />)
    openDaysTab()

    expect(screen.getByRole('status')).toHaveTextContent('Tu administrador carga tus días libres')
    expect(screen.getByText(/Navidad/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Eliminar' })).toBeNull()
    expect(screen.queryByRole('button', { name: '+ Agregar' })).toBeNull()
  })

  it('the two permissions are independent (edge case)', () => {
    mockHook.mockReturnValue(hookValue({ canEdit: false, canEditDaysOff: true }))
    render(<StaffSchedulePage />)
    expect(screen.queryByRole('button', { name: 'Guardar horario' })).toBeNull()
    openDaysTab()
    expect(screen.getByRole('button', { name: '+ Agregar' })).toBeInTheDocument()
  })
})

describe('StaffSchedulePage explanation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('tells the professional that this defines the appointments the client sees', () => {
    render(<StaffSchedulePage />)
    expect(screen.getByText('Esto define los turnos que ve el cliente.')).toBeInTheDocument()
    expect(screen.getByText(/solo pueden reservar con vos en los días y horarios que figuran acá/)).toBeInTheDocument()
  })
})

describe('StaffSchedulePage — unsaved changes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('changing section with unsaved changes asks first; "Volver y guardar" stays', () => {
    mockHook.mockReturnValue(hookValue({ isDirty: true }))
    render(<StaffSchedulePage />)
    fireEvent.click(screen.getByRole('tab', { name: 'Días libres y especiales' }))
    expect(screen.getByText('Tenés cambios sin guardar')).toBeInTheDocument()
    expect(screen.getByText(/no se guardan solos/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Volver y guardar' }))
    expect(screen.getByRole('tab', { name: 'Horario semanal' })).toHaveAttribute('aria-selected', 'true')
  })

  it('"Salir sin guardar" changes section and clears the unsaved mark', () => {
    const setIsDirty = vi.fn()
    mockHook.mockReturnValue(hookValue({ isDirty: true, setIsDirty }))
    render(<StaffSchedulePage />)
    fireEvent.click(screen.getByRole('tab', { name: 'Días libres y especiales' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salir sin guardar' }))
    expect(screen.getByRole('tab', { name: 'Días libres y especiales' })).toHaveAttribute('aria-selected', 'true')
    expect(setIsDirty).toHaveBeenCalledWith(false)
  })

  it('with nothing unsaved it changes section without asking (edge case)', () => {
    mockHook.mockReturnValue(hookValue({ isDirty: false }))
    render(<StaffSchedulePage />)
    fireEvent.click(screen.getByRole('tab', { name: 'Días libres y especiales' }))
    expect(screen.queryByText('Tenés cambios sin guardar')).toBeNull()
    expect(screen.getByRole('tab', { name: 'Días libres y especiales' })).toHaveAttribute('aria-selected', 'true')
  })

  it('the browser warns before closing only while there are unsaved changes (edge case)', () => {
    mockHook.mockReturnValue(hookValue({ isDirty: false }))
    const { rerender } = render(<StaffSchedulePage />)
    const clean = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(clean)
    expect(clean.defaultPrevented).toBe(false)
    mockHook.mockReturnValue(hookValue({ isDirty: true }))
    rerender(<StaffSchedulePage />)
    const dirty = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(dirty)
    expect(dirty.defaultPrevented).toBe(true)
  })
})
