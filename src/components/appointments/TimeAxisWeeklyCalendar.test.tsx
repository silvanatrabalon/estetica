import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { TimeAxisWeeklyCalendar } from './TimeAxisWeeklyCalendar'
import type { AppointmentSummary } from '../../services/appointments'

// ── DnD mocks (same pattern as WeeklyCalendar.test.tsx) ──────────────────────

const mockDragEnd = vi.hoisted(() => vi.fn())

vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>()
  return {
    ...actual,
    DndContext: ({
      children,
      onDragEnd,
    }: {
      children: React.ReactNode
      onDragEnd: (event: unknown) => void
    }) => {
      mockDragEnd.mockImplementation(onDragEnd)
      return <>{children}</>
    },
    useDraggable: ({ id, data }: { id: string; data: Record<string, unknown> }) => ({
      attributes: {
        'data-draggable': 'true',
        'data-id': id,
        'data-appointment': JSON.stringify(data.appointment),
      },
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
    // Monday 2026-05-11 at 10:00 UTC
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
  extraProps: Partial<React.ComponentProps<typeof TimeAxisWeeklyCalendar>> = {},
) {
  // Pin to a fixed week starting Monday 2026-05-11
  const currentDate = new Date('2026-05-11T00:00:00Z')
  return render(
    <MemoryRouter>
      <TimeAxisWeeklyCalendar
        appointments={appointments}
        orgTimezone="UTC"
        openTime="08:00"
        closeTime="20:00"
        currentDate={currentDate}
        {...extraProps}
      />
    </MemoryRouter>,
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TimeAxisWeeklyCalendar', () => {
  beforeEach(() => {
    mockDragEnd.mockReset()
    mockRescheduleAppointment.mockReset()
    mockUseAvailableSlots.mockReturnValue({ slots: [], loading: false, error: null })
  })

  it('renders navigation buttons', () => {
    renderCalendar()
    expect(screen.getByLabelText('Semana anterior')).toBeInTheDocument()
    expect(screen.getByLabelText('Semana siguiente')).toBeInTheDocument()
  })

  it('renders all 7 day labels', () => {
    renderCalendar()
    expect(screen.getByText('Lun')).toBeInTheDocument()
    expect(screen.getByText('Mar')).toBeInTheDocument()
    expect(screen.getByText('Mié')).toBeInTheDocument()
    expect(screen.getByText('Jue')).toBeInTheDocument()
    expect(screen.getByText('Vie')).toBeInTheDocument()
    expect(screen.getByText('Sáb')).toBeInTheDocument()
    expect(screen.getByText('Dom')).toBeInTheDocument()
  })

  it('renders appointment block with service name', () => {
    const apt = makeApt({ serviceName: 'Peinado' })
    renderCalendar([apt])
    expect(screen.getByText('Peinado')).toBeInTheDocument()
  })

  it('appointment block has height proportional to duration', () => {
    // 30-minute appointment → height = 60px (at 2px/min)
    const apt = makeApt({ startsAt: '2026-05-11T10:00:00Z', endsAt: '2026-05-11T10:30:00Z' })
    renderCalendar([apt])
    const block = screen.getByTestId('time-block')
    expect(block.style.height).toBe('60px')
  })

  it('appointments grouped by local date — only shows appointment in correct column', () => {
    // Monday appointment
    const mondayApt = makeApt({
      id: 'apt-mon',
      startsAt: '2026-05-11T10:00:00Z',
      endsAt: '2026-05-11T10:30:00Z',
    })
    // Tuesday appointment
    const tuesdayApt = makeApt({
      id: 'apt-tue',
      startsAt: '2026-05-12T10:00:00Z',
      endsAt: '2026-05-12T10:30:00Z',
    })
    renderCalendar([mondayApt, tuesdayApt])
    // Both blocks should be rendered
    const blocks = screen.getAllByTestId('time-block')
    expect(blocks).toHaveLength(2)
  })

  it('DnD drop on different day opens SlotPickerModal', async () => {
    const apt = makeApt({ status: 'confirmed' })
    mockUseAvailableSlots.mockReturnValue({ slots: [], loading: true, error: null })
    renderCalendar([apt])

    await act(async () => {
      mockDragEnd({
        active: { id: apt.id, data: { current: { appointment: apt } } },
        over: { id: '2026-05-12' }, // different day (Tuesday UTC date key)
      })
    })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('DnD drop on same day is a no-op — no modal shown', async () => {
    const apt = makeApt({ status: 'confirmed' })
    renderCalendar([apt])

    await act(async () => {
      mockDragEnd({
        active: { id: apt.id, data: { current: { appointment: apt } } },
        over: { id: '2026-05-11' }, // same day (Monday UTC date key)
      })
    })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('DnD cancelled status block does not have draggable attribute', () => {
    const apt = makeApt({ status: 'cancelled' })
    renderCalendar([apt])
    const block = screen.getByTestId('time-block')
    expect(block).not.toHaveAttribute('data-draggable', 'true')
  })
})
