import { useState, useCallback } from 'react'
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
import {
  getTopPx,
  getHeightPx,
  getGridOpenMinutes,
  getGridHeightPx,
  PX_PER_MIN,
} from '../../lib/timeAxis'
import type { AppointmentSummary } from '../../services/appointments'

// ── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 border-yellow-300 text-yellow-900',
  confirmed: 'bg-green-100 border-green-300 text-green-900',
  cancelled: 'bg-red-50 border-red-200 text-red-700',
  completed: 'bg-blue-100 border-blue-200 text-blue-800',
  no_show: 'bg-gray-100 border-gray-200 text-gray-600',
}

const DRAGGABLE_STATUSES = new Set(['pending', 'confirmed'])

// ── Helpers ──────────────────────────────────────────────────────────────────

function getUTCMonday(date: Date): Date {
  const day = date.getUTCDay()
  const offset = day === 0 ? -6 : 1 - day
  return new Date(date.getTime() + offset * 86400000)
}

function addUTCDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * 86400000)
}

function getAppointmentDurationMinutes(apt: AppointmentSummary): number {
  const startMs = new Date(apt.startsAt).getTime()
  const endMs = new Date(apt.endsAt).getTime()
  return Math.round((endMs - startMs) / 60000)
}

// ── Column layout for overlapping appointments ───────────────────────────────

interface ColumnLayout {
  apt: AppointmentSummary
  colIndex: number
  totalCols: number
}

/**
 * Assigns each appointment a column index so overlapping blocks
 * render side by side instead of stacked on top of each other.
 */
function computeColumnLayout(apts: AppointmentSummary[]): ColumnLayout[] {
  if (apts.length === 0) return []

  const sorted = [...apts].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  )

  // Greedy first-fit: assign the lowest available column to each appointment
  const colAssignments: number[] = []
  const colEndMs: number[] = []

  for (const apt of sorted) {
    const startMs = new Date(apt.startsAt).getTime()
    const endMs = new Date(apt.endsAt).getTime()
    let col = colEndMs.findIndex((t) => t <= startMs)
    if (col === -1) {
      col = colEndMs.length
      colEndMs.push(endMs)
    } else {
      colEndMs[col] = endMs
    }
    colAssignments.push(col)
  }

  // totalCols for each apt = max column index among all overlapping apts + 1
  const totalColsArr: number[] = sorted.map((_, i) => colAssignments[i] + 1)
  for (let i = 0; i < sorted.length; i++) {
    const sI = new Date(sorted[i].startsAt).getTime()
    const eI = new Date(sorted[i].endsAt).getTime()
    for (let j = 0; j < sorted.length; j++) {
      if (i === j) continue
      const sJ = new Date(sorted[j].startsAt).getTime()
      const eJ = new Date(sorted[j].endsAt).getTime()
      if (sI < eJ && eI > sJ) {
        totalColsArr[i] = Math.max(totalColsArr[i], colAssignments[j] + 1)
      }
    }
  }

  return sorted.map((apt, i) => ({
    apt,
    colIndex: colAssignments[i],
    totalCols: totalColsArr[i],
  }))
}

// ── Draggable time block ─────────────────────────────────────────────────────

interface DraggableTimeBlockProps {
  apt: AppointmentSummary
  orgTimezone: string
  showCustomerName?: boolean
  top: number
  height: number
  colIndex: number
  totalCols: number
  onAppointmentClick?: (id: string) => void
}

function DraggableTimeBlock({
  apt,
  orgTimezone,
  showCustomerName,
  top,
  height,
  colIndex,
  totalCols,
  onAppointmentClick,
}: DraggableTimeBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: apt.id,
    data: { appointment: apt },
  })

  const colWidth = 100 / totalCols
  const style: React.CSSProperties = {
    position: 'absolute',
    top,
    height,
    left: `calc(${colIndex * colWidth}% + 2px)`,
    width: `calc(${colWidth}% - 4px)`,
    ...(transform ? { transform: CSS.Translate.toString(transform), zIndex: 50 } : {}),
  }

  const colorClass = STATUS_COLORS[apt.status] ?? 'bg-gray-100 border-gray-200 text-gray-700'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      data-draggable="true"
      data-testid="time-block"
      onClick={(e) => { if (!isDragging) { e.stopPropagation(); onAppointmentClick?.(apt.id) } }}
      className={cn(
        'text-xs px-1.5 py-0.5 rounded border overflow-hidden cursor-grab active:cursor-grabbing select-none',
        colorClass,
        isDragging && 'opacity-50 ring-2 ring-indigo-400',
      )}
      title={`${apt.serviceName} · ${formatSlotTime(apt.startsAt, orgTimezone)}`}
    >
      <span className="font-medium block truncate">{formatSlotTime(apt.startsAt, orgTimezone)}</span>
      <span className="block truncate">{apt.serviceName}</span>
      {showCustomerName && apt.customerName && (
        <span className="block truncate text-xs opacity-75">{apt.customerName}</span>
      )}
    </div>
  )
}

// ── Static (non-draggable) time block ────────────────────────────────────────

interface StaticTimeBlockProps {
  apt: AppointmentSummary
  orgTimezone: string
  showCustomerName?: boolean
  top: number
  height: number
  colIndex: number
  totalCols: number
  onAppointmentClick?: (id: string) => void
}

function StaticTimeBlock({ apt, orgTimezone, showCustomerName, top, height, colIndex, totalCols, onAppointmentClick }: StaticTimeBlockProps) {
  const colorClass = STATUS_COLORS[apt.status] ?? 'bg-gray-100 border-gray-200 text-gray-700'
  const colWidth = 100 / totalCols
  return (
    <div
      data-testid="time-block"
      style={{
        position: 'absolute',
        top,
        height,
        left: `calc(${colIndex * colWidth}% + 2px)`,
        width: `calc(${colWidth}% - 4px)`,
      }}
      onClick={() => onAppointmentClick?.(apt.id)}
      className={cn(
        'text-xs px-1.5 py-0.5 rounded border overflow-hidden cursor-pointer',
        colorClass,
      )}
      title={`${apt.serviceName} · ${formatSlotTime(apt.startsAt, orgTimezone)}`}
    >
      <span className="font-medium block truncate">{formatSlotTime(apt.startsAt, orgTimezone)}</span>
      <span className="block truncate">{apt.serviceName}</span>
      {showCustomerName && apt.customerName && (
        <span className="block truncate text-xs opacity-75">{apt.customerName}</span>
      )}
    </div>
  )
}

// ── Droppable time column ────────────────────────────────────────────────────

interface DroppableTimeColumnProps {
  dateKey: string
  children: React.ReactNode
  height: number
}

function DroppableTimeColumn({ dateKey, children, height }: DroppableTimeColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: dateKey })

  return (
    <div
      ref={setNodeRef}
      className={cn('relative border-l border-gray-100', isOver && 'bg-indigo-50')}
      style={{ height }}
      data-testid={`time-column-${dateKey}`}
    >
      {children}
    </div>
  )
}

// ── TimeAxisWeeklyCalendar ────────────────────────────────────────────────────

export interface TimeAxisWeeklyCalendarProps {
  appointments: AppointmentSummary[]
  orgTimezone: string
  /** Grid open time in "HH:MM" format, e.g. "08:00" */
  openTime?: string
  /** Grid close time in "HH:MM" format, e.g. "20:00" */
  closeTime?: string
  currentDate?: Date
  showCustomerName?: boolean
  onRescheduleSuccess?: (appointmentId: string, newStartsAt: string) => void
  onWeekChange?: (weekStart: Date) => void
  onAppointmentClick?: (id: string) => void
}

export function TimeAxisWeeklyCalendar({
  appointments,
  orgTimezone,
  openTime = '08:00',
  closeTime = '20:00',
  currentDate: initialDate,
  showCustomerName = false,
  onRescheduleSuccess,
  onWeekChange,
  onAppointmentClick,
}: TimeAxisWeeklyCalendarProps) {
  const [weekStart, setWeekStart] = useState(() =>
    getUTCMonday(initialDate ?? new Date()),
  )

  const [slotPicker, setSlotPicker] = useState<{
    appointmentId: string
    serviceId: string
    date: string
  } | null>(null)
  const [rescheduleError, setRescheduleError] = useState<string | null>(null)
  const [rescheduleConfirming, setRescheduleConfirming] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const tz = orgTimezone || 'UTC'
  const gridOpenMinutes = getGridOpenMinutes(openTime)
  const gridHeightPx = getGridHeightPx(openTime, closeTime)
  const openHour = Math.floor(gridOpenMinutes / 60)
  const closeHour = Math.ceil(getGridOpenMinutes(closeTime) / 60)
  const hourLabels = Array.from({ length: closeHour - openHour }, (_, i) => openHour + i)

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

  // Group appointments by local date key, sorted by start time within each day
  const byDate: Record<string, AppointmentSummary[]> = {}
  for (const apt of appointments) {
    const dateKey = toLocalDateKey(apt.startsAt, tz)
    if (!byDate[dateKey]) byDate[dateKey] = []
    byDate[dateKey].push(apt)
  }
  for (const key of Object.keys(byDate)) {
    byDate[key].sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  }

  const todayKey = toLocalDateKey(new Date().toISOString(), tz)

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

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const apt = event.active.data.current?.appointment as AppointmentSummary | undefined
      if (!apt || !event.over) return

      const newDateKey = String(event.over.id)
      const currentDateKey = toLocalDateKey(apt.startsAt, tz)

      // Same-day drop is a no-op
      if (newDateKey === currentDateKey) return

      setRescheduleError(null)
      setSlotPicker({
        appointmentId: apt.id,
        serviceId: apt.serviceId,
        date: newDateKey,
      })
    },
    [tz],
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

  // Derive UTC date key for each day column (used for matching appointments in UTC-centric storage)
  function getDayDateKey(day: Date): string {
    const y = day.getUTCFullYear()
    const m = String(day.getUTCMonth() + 1).padStart(2, '0')
    const d = String(day.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Navigation header */}
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
        <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
          <div /> {/* empty time-label header cell */}
          {days.map((day, i) => {
            const utcDateKey = getDayDateKey(day)
            const isToday = toLocalDateKey(day.toISOString(), tz) === todayKey
            return (
              <div key={utcDateKey} className={cn('text-center py-2 border-l border-gray-100', isToday && 'bg-indigo-50')}>
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

        {/* Scrollable time-axis grid */}
        <div className="overflow-y-auto max-h-[640px]">
          <div className="grid" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
            {/* Time-label column */}
            <div
              className="relative border-r border-gray-100 flex-shrink-0"
              style={{ height: gridHeightPx }}
            >
              {hourLabels.map((hour, idx) => (
                <div
                  key={hour}
                  className="absolute right-1 text-xs text-gray-400 select-none leading-none"
                  style={{ top: idx * 60 * PX_PER_MIN - 6 }}
                >
                  {String(hour).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Seven day columns */}
            {days.map((day) => {
              const utcDateKey = getDayDateKey(day)
              // Match appointments by local date key (timezone-aware grouping)
              const localKey = toLocalDateKey(day.toISOString(), tz)
              const dayAppointments = byDate[localKey] ?? []

              return (
                <DroppableTimeColumn
                  key={utcDateKey}
                  dateKey={utcDateKey}
                  height={gridHeightPx}
                >
                  {/* Hour lines */}
                  {hourLabels.map((_, idx) => (
                    <div
                      key={idx}
                      className="absolute left-0 right-0 border-t border-gray-100 pointer-events-none"
                      style={{ top: idx * 60 * PX_PER_MIN }}
                    />
                  ))}

                  {/* Appointment blocks */}
                  {computeColumnLayout(dayAppointments).map(({ apt, colIndex, totalCols }) => {
                    const duration = getAppointmentDurationMinutes(apt)
                    const top = getTopPx(apt.startsAt, gridOpenMinutes, tz)
                    const height = getHeightPx(duration)

                    if (DRAGGABLE_STATUSES.has(apt.status)) {
                      return (
                        <DraggableTimeBlock
                          key={apt.id}
                          apt={apt}
                          orgTimezone={tz}
                          showCustomerName={showCustomerName}
                          top={top}
                          height={height}
                          colIndex={colIndex}
                          totalCols={totalCols}
                          onAppointmentClick={onAppointmentClick}
                        />
                      )
                    }

                    return (
                      <StaticTimeBlock
                        key={apt.id}
                        apt={apt}
                        orgTimezone={tz}
                        showCustomerName={showCustomerName}
                        top={top}
                        height={height}
                        colIndex={colIndex}
                        totalCols={totalCols}
                        onAppointmentClick={onAppointmentClick}
                      />
                    )
                  })}
                </DroppableTimeColumn>
              )
            })}
          </div>
        </div>
      </div>

      {/* Slot picker modal */}
      {slotPicker && (
        <SlotPickerModal
          serviceId={slotPicker.serviceId}
          date={slotPicker.date}
          orgTimezone={tz}
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
