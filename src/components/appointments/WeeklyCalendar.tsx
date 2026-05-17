import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '../../lib/cn'
import { formatSlotTime, toLocalDateKey } from '../../lib/formatSlotTime'
import { rescheduleAppointment } from '../../services/appointments'
import { SlotPickerModal } from './SlotPickerModal'
import type { AppointmentSummary } from '../../services/appointments'
import type { AvailabilityOverlayData } from './AvailabilityOverlay'
import { AvailabilityOverlay } from './AvailabilityOverlay'

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 border-yellow-300 text-yellow-900',
  confirmed: 'bg-green-100 border-green-300 text-green-900',
  cancelled: 'bg-red-50 border-red-200 text-red-700',
  completed: 'bg-blue-100 border-blue-200 text-blue-800',
  no_show: 'bg-gray-100 border-gray-200 text-gray-600',
}

const DRAGGABLE_STATUSES = new Set(['pending', 'confirmed'])

/** Returns the Monday (UTC) of the week containing the given date */
function getUTCMonday(date: Date): Date {
  const day = date.getUTCDay() // 0=Sun
  const offset = day === 0 ? -6 : 1 - day
  return new Date(date.getTime() + offset * 86400000)
}

function addUTCDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * 86400000)
}

/** Returns "YYYY-MM-DD" from a UTC Date */
function toUTCDateKey(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ── Draggable appointment block ───────────────────────────────────────────────

interface DraggableAppointmentProps {
  apt: AppointmentSummary
  orgTimezone: string
  showCustomerName?: boolean
}

function DraggableAppointment({ apt, orgTimezone, showCustomerName }: DraggableAppointmentProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: apt.id,
    data: { appointment: apt },
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50 }
    : undefined

  const colorClass = STATUS_COLORS[apt.status] ?? 'bg-gray-100 border-gray-200 text-gray-700'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      data-draggable="true"
      className={cn(
        'text-xs px-1.5 py-1 rounded border truncate cursor-grab active:cursor-grabbing select-none',
        colorClass,
        isDragging && 'opacity-50 ring-2 ring-indigo-400',
      )}
      title={`${apt.serviceName} · ${formatSlotTime(apt.startsAt, orgTimezone)}`}
    >
      <span className="font-medium block">{formatSlotTime(apt.startsAt, orgTimezone)}</span>
      <span className="block truncate">{apt.serviceName}</span>
      {showCustomerName && apt.customerName && (
        <span className="block truncate text-xs opacity-75">{apt.customerName}</span>
      )}
    </div>
  )
}

// ── Non-draggable appointment block ─────────────────────────────────────────

interface StaticAppointmentProps {
  apt: AppointmentSummary
  orgTimezone: string
  showCustomerName?: boolean
}

function StaticAppointment({ apt, orgTimezone, showCustomerName }: StaticAppointmentProps) {
  const colorClass = STATUS_COLORS[apt.status] ?? 'bg-gray-100 border-gray-200 text-gray-700'
  return (
    <Link
      to={`/booking/confirmation/${apt.id}`}
      className={cn(
        'block text-xs px-1.5 py-1 rounded border truncate cursor-default',
        colorClass,
      )}
      title={`${apt.serviceName} · ${formatSlotTime(apt.startsAt, orgTimezone)}`}
    >
      <span className="font-medium block">{formatSlotTime(apt.startsAt, orgTimezone)}</span>
      <span className="block truncate">{apt.serviceName}</span>
      {showCustomerName && apt.customerName && (
        <span className="block truncate text-xs opacity-75">{apt.customerName}</span>
      )}
    </Link>
  )
}

// ── Droppable day column ──────────────────────────────────────────────────────

interface DroppableDayColumnProps {
  dateKey: string
  children: React.ReactNode
  overlay?: AvailabilityOverlayData
}

function DroppableDayColumn({ dateKey, children, overlay }: DroppableDayColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: dateKey })

  return (
    <div
      ref={setNodeRef}
      className={cn('min-h-32 p-1 space-y-1 relative', isOver && 'bg-indigo-50')}
    >
      {overlay && (
        <AvailabilityOverlay
          date={dateKey}
          scheduleByDay={overlay.scheduleByDay}
          exceptionsByDate={overlay.exceptionsByDate}
          businessClosures={overlay.businessClosures}
        />
      )}
      {children}
    </div>
  )
}

// ── WeeklyCalendar ────────────────────────────────────────────────────────────

export interface WeeklyCalendarProps {
  appointments: AppointmentSummary[]
  orgTimezone: string
  currentDate?: Date
  showCustomerName?: boolean
  onRescheduleSuccess?: (appointmentId: string, newStartsAt: string) => void
  staffScheduleOverlay?: AvailabilityOverlayData
  onWeekChange?: (weekStart: Date) => void
}

export function WeeklyCalendar({
  appointments,
  orgTimezone,
  currentDate: initialDate,
  showCustomerName = false,
  onRescheduleSuccess,
  staffScheduleOverlay,
  onWeekChange,
}: WeeklyCalendarProps) {
  const [weekStart, setWeekStart] = useState(() =>
    getUTCMonday(initialDate ?? new Date()),
  )
  const [isMobileView, setIsMobileView] = useState(false)
  const [currentDay, setCurrentDay] = useState<Date>(() => initialDate ?? new Date())

  // Slot picker modal state
  const [slotPicker, setSlotPicker] = useState<{
    appointmentId: string
    serviceId: string
    date: string
  } | null>(null)
  const [rescheduleError, setRescheduleError] = useState<string | null>(null)
  const [rescheduleConfirming, setRescheduleConfirming] = useState(false)

  // Responsive detection
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobileView(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobileView(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const days = Array.from({ length: 7 }, (_, i) => addUTCDays(weekStart, i))

  const startLabel = new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(weekStart)
  const endLabel = new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(days[6])
  const weekLabel = `${startLabel} – ${endLabel}`

  function prevWeek() {
    setWeekStart((d) => {
      const prev = addUTCDays(d, -7)
      onWeekChange?.(prev)
      return prev
    })
  }
  function nextWeek() {
    setWeekStart((d) => {
      const next = addUTCDays(d, 7)
      onWeekChange?.(next)
      return next
    })
  }

  function prevDay() {
    setCurrentDay((d) => {
      const prev = new Date(d.getTime() - 86400000)
      setWeekStart(getUTCMonday(prev))
      return prev
    })
  }
  function nextDay() {
    setCurrentDay((d) => {
      const next = new Date(d.getTime() + 86400000)
      setWeekStart(getUTCMonday(next))
      return next
    })
  }

  // Group appointments by their local date in org timezone (not raw UTC slice)
  const byDate: Record<string, AppointmentSummary[]> = {}
  for (const apt of appointments) {
    const dateKey = toLocalDateKey(apt.startsAt, orgTimezone)
    if (!byDate[dateKey]) byDate[dateKey] = []
    byDate[dateKey].push(apt)
  }

  const todayKey = toLocalDateKey(new Date().toISOString(), orgTimezone)

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const apt = event.active.data.current?.appointment as AppointmentSummary | undefined
      if (!apt || !event.over) return

      const newDateKey = String(event.over.id)
      const currentDateKey = toLocalDateKey(apt.startsAt, orgTimezone)

      // Same-day drop is a no-op
      if (newDateKey === currentDateKey) return

      setRescheduleError(null)
      setSlotPicker({
        appointmentId: apt.id,
        serviceId: apt.serviceId,
        date: newDateKey,
      })
    },
    [orgTimezone],
  )

  async function handleSlotConfirm(startsAt: string) {
    if (!slotPicker) return
    setRescheduleConfirming(true)
    setRescheduleError(null)
    try {
      const result = await rescheduleAppointment({
        appointmentId: slotPicker.appointmentId,
        newStartsAt: startsAt,
      })
      onRescheduleSuccess?.(result.id, result.startsAt)
      setSlotPicker(null)
    } catch (err: unknown) {
      setRescheduleError((err as Error).message ?? 'Error al reprogramar el turno.')
    } finally {
      setRescheduleConfirming(false)
    }
  }

  // ── Mobile: single-day strip ───────────────────────────────────────────────
  if (isMobileView) {
    const currentDayKey = toUTCDateKey(currentDay)
    const dayApts = byDate[currentDayKey] ?? []
    const dayLabel = new Intl.DateTimeFormat('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: orgTimezone || 'UTC',
    }).format(currentDay)
    const isToday = currentDayKey === todayKey

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Mobile header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button
            onClick={prevDay}
            className="min-w-11 min-h-11 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            aria-label="Día anterior"
          >
            ‹
          </button>
          <span
            className={cn(
              'text-sm font-medium capitalize',
              isToday ? 'text-indigo-600' : 'text-gray-700',
            )}
          >
            {dayLabel}
          </span>
          <button
            onClick={nextDay}
            className="min-w-11 min-h-11 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            aria-label="Día siguiente"
          >
            ›
          </button>
        </div>

        {/* Single day appointments */}
        <div className="min-h-32 p-2 space-y-2" data-testid="single-day-strip">
          {dayApts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin turnos este día</p>
          ) : (
            dayApts.map((apt) => {
              const colorClass =
                STATUS_COLORS[apt.status] ?? 'bg-gray-100 border-gray-200 text-gray-700'
              return (
                <Link
                  key={apt.id}
                  to={`/booking/confirmation/${apt.id}`}
                  className={cn(
                    'block text-sm px-3 py-2 rounded border w-full',
                    colorClass,
                  )}
                >
                  <span className="font-medium block">
                    {formatSlotTime(apt.startsAt, orgTimezone)}
                  </span>
                  <span className="block truncate">{apt.serviceName}</span>
                  {showCustomerName && apt.customerName && (
                    <span className="block truncate text-xs opacity-75">{apt.customerName}</span>
                  )}
                </Link>
              )
            })
          )}
        </div>
      </div>
    )
  }

  // ── Desktop: 7-column weekly grid with DnD ─────────────────────────────────
  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button
            onClick={prevWeek}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            aria-label="Semana anterior"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-gray-700 capitalize">{weekLabel}</span>
          <button
            onClick={nextWeek}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            aria-label="Semana siguiente"
          >
            ›
          </button>
        </div>

        {/* Day header row */}
        <div className="grid grid-cols-7 border-b border-gray-100 divide-x divide-gray-100">
          {days.map((day, i) => {
            const dateKey = toUTCDateKey(day)
            const isToday = dateKey === todayKey
            return (
              <div key={dateKey} className={cn('text-center py-2', isToday && 'bg-indigo-50')}>
                <p className="text-xs text-gray-500">{DAY_LABELS[i]}</p>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    isToday ? 'text-indigo-600' : 'text-gray-700',
                  )}
                >
                  {day.getUTCDate()}
                </p>
              </div>
            )
          })}
        </div>

        {/* Appointment blocks with droppable columns */}
        <div className="grid grid-cols-7 divide-x divide-gray-100">
          {days.map((day) => {
            const dateKey = toUTCDateKey(day)
            const dayAppointments = byDate[dateKey] ?? []

            return (
              <DroppableDayColumn
                key={dateKey}
                dateKey={dateKey}
                overlay={staffScheduleOverlay}
              >
                {dayAppointments.map((apt) => {
                  if (DRAGGABLE_STATUSES.has(apt.status)) {
                    return (
                      <DraggableAppointment
                        key={apt.id}
                        apt={apt}
                        orgTimezone={orgTimezone}
                        showCustomerName={showCustomerName}
                      />
                    )
                  }
                  return (
                    <StaticAppointment
                      key={apt.id}
                      apt={apt}
                      orgTimezone={orgTimezone}
                      showCustomerName={showCustomerName}
                    />
                  )
                })}
              </DroppableDayColumn>
            )
          })}
        </div>
      </div>

      {/* Slot picker modal */}
      {slotPicker && (
        <SlotPickerModal
          serviceId={slotPicker.serviceId}
          date={slotPicker.date}
          orgTimezone={orgTimezone}
          onConfirm={handleSlotConfirm}
          onClose={() => {
            setSlotPicker(null)
            setRescheduleError(null)
          }}
          confirming={rescheduleConfirming}
          error={rescheduleError}
        />
      )}
    </DndContext>
  )
}
