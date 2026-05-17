import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { WeeklyCalendar } from './WeeklyCalendar'
import type { AppointmentSummary } from '../../services/appointments'

// ── DnD mocks ────────────────────────────────────────────────────────────────

const mockDragEnd = vi.hoisted(() => vi.fn())

vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>()
  return {
    ...actual,
    // Override DndContext to capture onDragEnd and expose it via mockDragEnd
    DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd: (event: unknown) => void }) => {
      mockDragEnd.mockImplementation(onDragEnd)
      return <>{children}</>
    },
    // useDraggable: return minimal shape; set data-draggable on the node
    useDraggable: ({ id, data }: { id: string; data: Record<string, unknown> }) => ({
      attributes: { 'data-draggable': 'true', 'data-id': id, 'data-appointment': JSON.stringify(data.appointment) },
      listeners: {},
      setNodeRef: () => {},
      transform: null,
      isDragging: false,
    }),
    useDroppable: ({ id }: { id: string }) => ({
      isOver: false,
      setNodeRef: () => {},
      over: null,
      id,
    }),
    useSensors: () => [],
    useSensor: () => ({}),
    PointerSensor: class {},
  }
})

const mockRescheduleAppointment = vi.hoisted(() => vi.fn())
vi.mock('../../services/appointments', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/appointments')>()
  return {
    ...actual,
    rescheduleAppointment: (...args: unknown[]) => mockRescheduleAppointment(...args),
  }
})

const mockUseAvailableSlots = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useAvailableSlots', () => ({
  useAvailableSlots: (...args: unknown[]) => mockUseAvailableSlots(...args),
}))

// ── Test helpers ─────────────────────────────────────────────────────────────

function makeApt(overrides: Partial<AppointmentSummary> = {}): AppointmentSummary {
  return {
    id: 'apt-1',
    startsAt: '2026-05-11T10:00:00Z',
    endsAt: '2026-05-11T10:30:00Z',
    status: 'confirmed',
    createdAt: '2026-05-01T00:00:00Z',
    customerUserId: 'user-1',
    serviceId: 'svc-1',
    serviceName: 'Corte',
    serviceDurationMinutes: 30,
    servicePriceCents: 2000,
    staffDisplayName: 'Ana',
    orgName: 'Salon',
    orgTimezone: 'UTC',
    customerName: 'Cliente',
    ...overrides,
  }
}

function renderCalendar(
  appointments: AppointmentSummary[] = [],
  extraProps: Partial<React.ComponentProps<typeof WeeklyCalendar>> = {},
) {
  // Pin to a fixed week: 2026-05-11 (Monday)
  const currentDate = new Date('2026-05-11T00:00:00Z')
  return render(
    <MemoryRouter>
      <WeeklyCalendar
        appointments={appointments}
        orgTimezone="UTC"
        currentDate={currentDate}
        {...extraProps}
      />
    </MemoryRouter>,
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WeeklyCalendar', () => {
  beforeEach(() => {
    mockDragEnd.mockReset()
    mockRescheduleAppointment.mockReset()
    mockUseAvailableSlots.mockReturnValue({ slots: [], loading: false, error: null })

    // Default desktop view
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false, // desktop
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    })
  })

  it('renders the weekly calendar with day headers', () => {
    renderCalendar()
    expect(screen.getByText('Lun')).toBeInTheDocument()
    expect(screen.getByText('Dom')).toBeInTheDocument()
  })

  it('renders a confirmed appointment as draggable', () => {
    const apt = makeApt({ status: 'confirmed' })
    renderCalendar([apt])
    const draggable = document.querySelector('[data-draggable="true"]')
    expect(draggable).not.toBeNull()
  })

  it('cancelled appointment has no data-draggable attribute', () => {
    const apt = makeApt({ status: 'cancelled' })
    renderCalendar([apt])
    const draggable = document.querySelector('[data-draggable="true"]')
    expect(draggable).toBeNull()
  })

  it('completed appointment has no data-draggable attribute', () => {
    const apt = makeApt({ status: 'completed' })
    renderCalendar([apt])
    const draggable = document.querySelector('[data-draggable="true"]')
    expect(draggable).toBeNull()
  })

  it('no_show appointment has no data-draggable attribute', () => {
    const apt = makeApt({ status: 'no_show' })
    renderCalendar([apt])
    const draggable = document.querySelector('[data-draggable="true"]')
    expect(draggable).toBeNull()
  })

  it('same-day drag end is a no-op (no modal rendered)', async () => {
    const apt = makeApt({
      startsAt: '2026-05-11T10:00:00Z',
      status: 'confirmed',
    })
    renderCalendar([apt])

    // Trigger handleDragEnd via the captured mock
    // The appointment is on 2026-05-11 UTC; drop on same day
    await act(async () => {
      mockDragEnd({
        active: { id: apt.id, data: { current: { appointment: apt } } },
        over: { id: '2026-05-11' },
      })
    })

    // SlotPickerModal should NOT be rendered
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('different-day drag end opens SlotPickerModal', async () => {
    const apt = makeApt({
      startsAt: '2026-05-11T10:00:00Z',
      status: 'confirmed',
    })
    renderCalendar([apt])

    await act(async () => {
      mockDragEnd({
        active: { id: apt.id, data: { current: { appointment: apt } } },
        over: { id: '2026-05-13' }, // different day
      })
    })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('drag to undefined over is a no-op', async () => {
    const apt = makeApt({ status: 'confirmed' })
    renderCalendar([apt])

    await act(async () => {
      mockDragEnd({
        active: { id: apt.id, data: { current: { appointment: apt } } },
        over: null,
      })
    })

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('after slot selection rescheduleAppointment is called with correct args', async () => {
    const apt = makeApt({
      id: 'apt-reschedule',
      serviceId: 'svc-42',
      startsAt: '2026-05-11T10:00:00Z',
      status: 'confirmed',
    })
    const newStartsAt = '2026-05-13T09:00:00Z'
    mockUseAvailableSlots.mockReturnValue({
      slots: [{ starts_at: newStartsAt, ends_at: '2026-05-13T09:30:00Z' }],
      loading: false,
      error: null,
    })
    mockRescheduleAppointment.mockResolvedValue({ id: apt.id, startsAt: newStartsAt })

    const onRescheduleSuccess = vi.fn()
    renderCalendar([apt], { onRescheduleSuccess })

    // Open modal via drag to different day
    await act(async () => {
      mockDragEnd({
        active: { id: apt.id, data: { current: { appointment: apt } } },
        over: { id: '2026-05-13' },
      })
    })

    // Modal should be open — click the slot
    const slotButtons = await screen.findAllByRole('button')
    const slotBtn = slotButtons.find((b) => b.textContent?.includes('09:00'))
    if (slotBtn) {
      await act(async () => {
        fireEvent.click(slotBtn)
      })

      expect(mockRescheduleAppointment).toHaveBeenCalledWith({
        appointmentId: apt.id,
        newStartsAt,
      })
      expect(onRescheduleSuccess).toHaveBeenCalledWith(apt.id, newStartsAt)
    }
  })

  it('renders prev/next week navigation buttons', () => {
    renderCalendar()
    expect(screen.getByLabelText('Semana anterior')).toBeInTheDocument()
    expect(screen.getByLabelText('Semana siguiente')).toBeInTheDocument()
  })
})
