import { FormEvent, useEffect, useState } from 'react'
import { ActionButton } from '../components/ActionButton'
import { cn } from '../lib/cn'
import { ShiftsFields } from '../components/availability'
import { toDayShifts, validateShifts, type DayShifts } from '../lib/shifts'
import {
  setSplitShifts,
  deleteBusinessClosure,
  getBusinessSettings,
  saveBusinessClosure,
  saveBusinessSettings,
  saveNotificationSettings,
  updateBookingPolicy,
  type BusinessClosureRecord,
  type BusinessHoursRecord,
} from '../services/businessSettings'
import { adminDeleteAllAppointments } from '../services/adminAppointments'
import { validateNotificationEmail } from '../lib/businessSettings'
import type { BusinessClosureType, BusinessHoursInput } from '../lib/businessSettings'
import { commonCopy } from '../lib/uiCopy'
import { useUser } from '../hooks/useUser'
import { ConfirmModal } from '../components/ConfirmModal'
import {
  describeClosureType,
  formatClosureDate,
  noticeOptions,
} from '../lib/businessSettingsFormat'
import { FeedbackToast } from '../components/FeedbackToast'
import { Select } from '../components/Select'

const dayLabels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

interface ClosureDraft {
  id?: string
  closureDate: string
  closureType: BusinessClosureType
  startsAt: string
  endsAt: string
  reason: string
}

function emptyClosureDraft(): ClosureDraft {
  return {
    closureDate: '',
    closureType: 'full_day',
    startsAt: '',
    endsAt: '',
    reason: '',
  }
}

function toHoursInput(hours: BusinessHoursRecord[]): BusinessHoursInput[] {
  return hours.map((hour) => ({
    dayOfWeek: hour.dayOfWeek,
    isClosed: hour.isClosed,
    opensAt: hour.opensAt,
    closesAt: hour.closesAt,
    pmOpensAt: hour.pmOpensAt,
    pmClosesAt: hour.pmClosesAt,
  }))
}

function missingLabel(missing: string): string {
  if (missing === 'name') return 'nombre visible'
  if (missing === 'timezone') return 'zona horaria'
  return 'horarios semanales'
}

function toDraft(closure: BusinessClosureRecord): ClosureDraft {
  return {
    id: closure.id,
    closureDate: closure.closureDate,
    closureType: closure.closureType,
    startsAt: closure.startsAt ?? '',
    endsAt: closure.endsAt ?? '',
    reason: closure.reason ?? '',
  }
}

function sameHours(a: BusinessHoursRecord[], b: BusinessHoursRecord[]): boolean {
  if (a.length !== b.length) return false
  return a.every((hour, i) => {
    const other = b[i]
    return (
      hour.dayOfWeek === other.dayOfWeek &&
      hour.isClosed === other.isClosed &&
      (hour.opensAt ?? null) === (other.opensAt ?? null) &&
      (hour.closesAt ?? null) === (other.closesAt ?? null) &&
      (hour.pmOpensAt ?? null) === (other.pmOpensAt ?? null) &&
      (hour.pmClosesAt ?? null) === (other.pmClosesAt ?? null)
    )
  })
}

interface PolicySnapshot {
  minNotice: number
  maxHorizon: number
  email: string
  enabled: boolean
}

export function BusinessSettingsPage() {
  const { isLoading: isUserLoading } = useUser()
  const [organizationId, setOrganizationId] = useState<string>('')
  const [name, setName] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const [notificationEmail, setNotificationEmail] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [bookingMinNoticeMinutes, setBookingMinNoticeMinutes] = useState(60)
  const [bookingMaxHorizonDays, setBookingMaxHorizonDays] = useState(60)
  const [bookingPolicyError, setBookingPolicyError] = useState<string | null>(null)
  const [splitShifts, setSplitShiftsState] = useState(false)
  const [isSwitchingMode, setIsSwitchingMode] = useState(false)
  const [hourErrors, setHourErrors] = useState<Record<number, string | null>>({})
  const [weeklyHours, setWeeklyHours] = useState<BusinessHoursRecord[]>([])
  const [closures, setClosures] = useState<BusinessClosureRecord[]>([])
  // What is stored in the database: used to tell which tab has unsaved edits
  const [savedGeneral, setSavedGeneral] = useState({ name: '', timezone: 'UTC' })
  const [savedHours, setSavedHours] = useState<BusinessHoursRecord[]>([])
  const [savedPolicy, setSavedPolicy] = useState<PolicySnapshot>({ minNotice: 60, maxHorizon: 60, email: '', enabled: true })
  const [closureDraft, setClosureDraft] = useState<ClosureDraft>(emptyClosureDraft())
  // "Agregar cierre" and "Editar" open the form in a pop-up; its errors show inside it
  const [closureModalOpen, setClosureModalOpen] = useState(false)
  const [closureError, setClosureError] = useState<string | null>(null)
  const [missingReadiness, setMissingReadiness] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'identity' | 'hours' | 'closures' | 'policy' | 'danger'>('identity')
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isSavingClosure, setIsSavingClosure] = useState(false)
  const [isSavingPolicy, setIsSavingPolicy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    message: string
    title: string
    onConfirm: () => void
    destructive?: boolean
    confirmLabel?: string
    cancelLabel?: string
  }>({ isOpen: false, message: '', title: 'Confirmar', onConfirm: () => {} })

  // ── Danger zone state ──────────────────────────────────────────────────────
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: { destructive?: boolean; confirmLabel?: string; cancelLabel?: string },
  ) => {
    setConfirmState({ isOpen: true, title, message, onConfirm, ...options })
  }
  const closeConfirm = () => setConfirmState((prev) => ({ ...prev, isOpen: false }))

  const applyLoadedData = awaitableApplyLoadedData

  async function loadBusinessSettings() {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const data = await getBusinessSettings()
      applyLoadedData(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('Failed to load business settings:', message)
      setErrorMessage('No pudimos cargar los datos del negocio en este momento. Probá de nuevo en unos minutos.')
    } finally {
      setIsLoading(false)
    }
  }

  function awaitableApplyLoadedData(data: Awaited<ReturnType<typeof getBusinessSettings>>) {
    setOrganizationId(data.organizationId)
    setName(data.name)
    setTimezone(data.timezone)
    setNotificationEmail(data.notificationEmail ?? '')
    setNotificationsEnabled(data.notificationsEnabled ?? true)
    setBookingMinNoticeMinutes(data.bookingMinNoticeMinutes)
    setBookingMaxHorizonDays(data.bookingMaxHorizonDays)
    setWeeklyHours(data.weeklyHours)
    setSplitShiftsState(data.splitShifts)
    setClosures(data.closures)
    setMissingReadiness(data.readiness.missing)
    setSavedGeneral({ name: data.name, timezone: data.timezone })
    setSavedHours(data.weeklyHours)
    setSavedPolicy({
      minNotice: data.bookingMinNoticeMinutes,
      maxHorizon: data.bookingMaxHorizonDays,
      email: data.notificationEmail ?? '',
      enabled: data.notificationsEnabled ?? true,
    })
  }

  useEffect(() => {
    // Wait until user session is loaded before attempting to fetch business settings
    if (!isUserLoading) {
      void loadBusinessSettings()
    }
  }, [isUserLoading])

  const handleShiftsChange = (dayOfWeek: number, shifts: DayShifts) => {
    setHourErrors((current) => ({ ...current, [dayOfWeek]: null }))
    setWeeklyHours((current) =>
      current.map((hour) =>
        hour.dayOfWeek === dayOfWeek
          ? {
              ...hour,
              opensAt: shifts.am?.start ?? null,
              closesAt: shifts.am?.end ?? null,
              pmOpensAt: shifts.pm?.start ?? null,
              pmClosesAt: shifts.pm?.end ?? null,
            }
          : hour,
      ),
    )
  }

  const applyShiftMode = async (enabled: boolean) => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSwitchingMode(true)
    try {
      await setSplitShifts(enabled)
      await loadBusinessSettings()
      setSuccessMessage(enabled ? 'Ahora el negocio trabaja en dos turnos.' : 'Ahora el negocio trabaja de corrido.')
    } catch {
      setErrorMessage('No pudimos cambiar la forma de trabajo. Intentá de nuevo.')
    } finally {
      setIsSwitchingMode(false)
    }
  }

  const handleModeChange = (enabled: boolean) => {
    if (enabled === splitShifts || isSwitchingMode) return
    // Changing the mode reloads the hours from the database: unsaved edits would be lost
    if (hoursDirty) {
      showConfirm(
        'Tenés horarios sin guardar',
        'Cambiar la forma de trabajo recarga los horarios y se pierden los cambios que todavía no guardaste. Volvé y guardalos con el botón "Guardar" de abajo antes de cambiar.',
        () => {
          closeConfirm()
          setWeeklyHours(savedHours)
          // After dropping the edits, go on with the change the person asked for
          handleModeChangeConfirmed(enabled)
        },
        { destructive: true, confirmLabel: 'Cambiar y descartar', cancelLabel: 'Volver y guardar' },
      )
      return
    }
    handleModeChangeConfirmed(enabled)
  }

  const handleModeChangeConfirmed = (enabled: boolean) => {
    if (enabled) {
      void applyShiftMode(true)
      return
    }
    showConfirm(
      'Pasar a jornada corrida',
      'Cada día va a quedar como un solo horario, desde el primer turno hasta el último. Esto también cambia los horarios de los profesionales y sus días especiales. ¿Continuar?',
      () => {
        closeConfirm()
        void applyShiftMode(false)
      },
      { confirmLabel: 'Sí, pasar a corrida' },
    )
  }

  const handleClosedSet = (dayOfWeek: number, closed: boolean) => {
    setWeeklyHours((current) =>
      current.map((hour) =>
        hour.dayOfWeek === dayOfWeek
          ? {
              ...hour,
              isClosed: closed,
              opensAt: closed ? null : hour.opensAt ?? '09:00',
              closesAt: closed ? null : hour.closesAt ?? (splitShifts ? '13:00' : '18:00'),
              pmOpensAt: closed ? null : hour.pmOpensAt,
              pmClosesAt: closed ? null : hour.pmClosesAt,
            }
          : hour,
      ),
    )
  }

  // General and Horarios save independently: each one writes only its own edits and
  // leaves the other tab's unsaved changes alone.
  const saveSection = async (section: 'general' | 'hours') => {
    setErrorMessage(null)
    setSuccessMessage(null)

    if (section === 'hours') {
      const errors: Record<number, string | null> = {}
      for (const hour of weeklyHours) {
        if (hour.isClosed) continue
        errors[hour.dayOfWeek] = validateShifts(
          toDayShifts(hour.opensAt, hour.closesAt, hour.pmOpensAt, hour.pmClosesAt),
        )
      }
      setHourErrors(errors)
      if (Object.values(errors).some(Boolean)) return
    }
    setIsSavingSettings(true)

    try {
      const updated = await saveBusinessSettings({
        name: section === 'general' ? name : savedGeneral.name,
        timezone: section === 'general' ? timezone : savedGeneral.timezone,
        weeklyHours: toHoursInput(section === 'hours' ? weeklyHours : savedHours),
      })

      setClosures(updated.closures)
      setMissingReadiness(updated.readiness.missing)
      if (section === 'general') {
        setName(updated.name)
        setTimezone(updated.timezone)
        setSavedGeneral({ name: updated.name, timezone: updated.timezone })
        setSuccessMessage('Datos del negocio guardados.')
      } else {
        setWeeklyHours(updated.weeklyHours)
        setSavedHours(updated.weeklyHours)
        setSuccessMessage('Horarios guardados.')
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No pudimos guardar los cambios. Intentá de nuevo.')
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handleSaveGeneral = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void saveSection('general')
  }

  const handleSaveHours = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void saveSection('hours')
  }

  const generalDirty = name !== savedGeneral.name || timezone !== savedGeneral.timezone
  const hoursDirty = !sameHours(weeklyHours, savedHours)
  const policyDirty =
    bookingMinNoticeMinutes !== savedPolicy.minNotice ||
    bookingMaxHorizonDays !== savedPolicy.maxHorizon ||
    notificationEmail !== savedPolicy.email ||
    notificationsEnabled !== savedPolicy.enabled
  const dirtyByTab: Record<string, boolean> = {
    identity: generalDirty,
    hours: hoursDirty,
    closures: false,
    policy: policyDirty,
  }

  const TAB_NAMES: Record<string, string> = {
    identity: 'General',
    hours: 'Horarios',
    policy: 'Política',
  }

  // Edits are never saved on their own: leaving a section with unsaved changes asks first
  const discardTabEdits = (tab: string) => {
    if (tab === 'identity') {
      setName(savedGeneral.name)
      setTimezone(savedGeneral.timezone)
    } else if (tab === 'hours') {
      setWeeklyHours(savedHours)
    } else if (tab === 'policy') {
      setBookingMinNoticeMinutes(savedPolicy.minNotice)
      setBookingMaxHorizonDays(savedPolicy.maxHorizon)
      setNotificationEmail(savedPolicy.email)
      setNotificationsEnabled(savedPolicy.enabled)
    }
  }

  const goToTab = (next: typeof activeTab) => {
    if (next === activeTab) return
    const leaving = activeTab
    if (!dirtyByTab[leaving]) {
      setActiveTab(next)
      return
    }
    showConfirm(
      `Tenés cambios sin guardar en ${TAB_NAME_OF(leaving)}`,
      'Los cambios no se guardan solos. Volvé y apretá "Guardar" antes de salir de esta sección, o se pierden.',
      () => {
        closeConfirm()
        discardTabEdits(leaving)
        setActiveTab(next)
      },
      { destructive: true, confirmLabel: 'Salir sin guardar', cancelLabel: 'Volver y guardar' },
    )
  }
  const TAB_NAME_OF = (tab: string) => TAB_NAMES[tab] ?? tab

  // Closing or reloading the page with unsaved edits: the browser asks first
  const anyDirty = generalDirty || hoursDirty || policyDirty
  useEffect(() => {
    if (!anyDirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [anyDirty])

  // Closures change on their own: refresh just them, so unsaved edits in other tabs survive
  const refreshClosures = async () => {
    const updated = await getBusinessSettings()
    setClosures(updated.closures)
    setMissingReadiness(updated.readiness.missing)
  }

  const handleSaveClosure = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setClosureError(null)
    setIsSavingClosure(true)

    try {
      await saveBusinessClosure({
        id: closureDraft.id,
        closureDate: closureDraft.closureDate,
        closureType: closureDraft.closureType,
        startsAt: closureDraft.closureType === 'half_day' ? closureDraft.startsAt || null : null,
        endsAt: closureDraft.closureType === 'half_day' ? closureDraft.endsAt || null : null,
        reason: closureDraft.reason || null,
      })

      await refreshClosures()
      setClosureDraft(emptyClosureDraft())
      setClosureModalOpen(false)
      setSuccessMessage('Cierre excepcional guardado correctamente.')
    } catch (error) {
      setClosureError(error instanceof Error ? error.message : 'No pudimos guardar el cierre excepcional.')
    } finally {
      setIsSavingClosure(false)
    }
  }

  const openAddClosure = () => {
    setClosureDraft(emptyClosureDraft())
    setClosureError(null)
    setClosureModalOpen(true)
  }

  const openEditClosure = (closure: BusinessClosureRecord) => {
    setClosureDraft(toDraft(closure))
    setClosureError(null)
    setClosureModalOpen(true)
  }

  const closeClosureModal = () => {
    setClosureModalOpen(false)
    setClosureDraft(emptyClosureDraft())
    setClosureError(null)
  }

  // Escape closes the pop-up (not while it is saving)
  useEffect(() => {
    if (!closureModalOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSavingClosure) closeClosureModal()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [closureModalOpen, isSavingClosure])

  const handleDeleteClosure = (closureId: string) => {
    showConfirm(
      'Eliminar cierre excepcional',
      '¿Confirmás eliminar este cierre excepcional?',
      async () => {
        closeConfirm()
        setErrorMessage(null)
        setSuccessMessage(null)
        try {
          await deleteBusinessClosure(closureId)
          await refreshClosures()
          setClosureDraft((current) => (current.id === closureId ? emptyClosureDraft() : current))
          setSuccessMessage('Cierre excepcional eliminado correctamente.')
        } catch {
          setErrorMessage('No pudimos eliminar el cierre excepcional.')
        }
      },
      { destructive: true, confirmLabel: 'Eliminar cierre' },
    )
  }

  const handleSaveBookingPolicy = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBookingPolicyError(null)
    setSuccessMessage(null)

    if (bookingMinNoticeMinutes < 0 || bookingMinNoticeMinutes > 10080) {
      setBookingPolicyError('La anticipación mínima debe estar entre 0 y 10080 minutos.')
      return
    }

    if (bookingMaxHorizonDays < 1 || bookingMaxHorizonDays > 365) {
      setBookingPolicyError('El horizonte de reservas debe estar entre 1 y 365 días.')
      return
    }

    const notificationEmailError = validateNotificationEmail(notificationEmail)
    if (notificationEmailError) {
      setBookingPolicyError(notificationEmailError)
      return
    }

    setIsSavingPolicy(true)

    try {
      await updateBookingPolicy(bookingMinNoticeMinutes, bookingMaxHorizonDays)
      await saveNotificationSettings({ notificationEmail, notificationsEnabled })
      setSavedPolicy({
        minNotice: bookingMinNoticeMinutes,
        maxHorizon: bookingMaxHorizonDays,
        email: notificationEmail,
        enabled: notificationsEnabled,
      })
      setSuccessMessage('Política de reservas actualizada.')
    } catch {
      setBookingPolicyError('No se pudo guardar la configuración.')
    } finally {
      setIsSavingPolicy(false)
    }
  }

  if (isLoading) {
    return <p className="text-sm text-shell-subtleText">{commonCopy.loading}</p>
  }

  const fieldCls =
    'min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base text-gray-900 sm:text-sm focus:border-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-primary transition-colors'
  const saveBtnCls =
    'min-h-11 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong transition-colors disabled:opacity-50'

  const TABS = [
    {
      key: 'identity' as const,
      label: 'General',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="12" cy="10" r="3" /><path d="M6 20c0-3 2-5 6-5s6 2 6 5" />
        </svg>
      ),
    },
    {
      key: 'hours' as const,
      label: 'Horarios',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
        </svg>
      ),
    },
    {
      key: 'closures' as const,
      label: 'Cierres',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="M9 16l2 2 4-4" />
        </svg>
      ),
    },
    {
      key: 'policy' as const,
      label: 'Política',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l9 4v6c0 5-3.5 9.7-9 11-5.5-1.3-9-6-9-11V6l9-4z" />
        </svg>
      ),
    },
    {
      key: 'danger' as const,
      label: 'Historial',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" />
        </svg>
      ),
    },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Alerts */}
      <div className="space-y-2 mb-4">
        {!organizationId ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Todavía no pudimos encontrar tu negocio. Recargá la página para intentar de nuevo.
          </p>
        ) : null}
        {missingReadiness.length > 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Configuración incompleta. Falta definir: {missingReadiness.map(missingLabel).join(', ')}.
          </p>
        ) : null}
      </div>

      {/* Page header */}
      <div className="mb-4">
        <h2 className="font-heading text-2xl font-semibold text-shell-text">Negocio</h2>
        <p className="mt-1 text-sm text-shell-subtleText">
          Configurá los datos, los horarios y las reglas de reserva de tu salón.
        </p>
      </div>

      {/* Tab bar (not sticky: the shell's <main> is the scroll container and never scrolls) */}
      <div className="pt-2 pb-4">
        <div
          role="tablist"
          aria-label="Secciones de Negocio"
          className="flex gap-1 overflow-x-auto rounded-2xl bg-white border border-shell-border p-1 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => goToTab(tab.key)}
              className={cn(
                'relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 whitespace-nowrap rounded-xl px-1 py-1.5 text-[11px] font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-primary sm:min-h-11 sm:flex-row sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm',
                activeTab === tab.key
                  ? tab.key === 'danger'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-brand-primary text-white shadow-sm'
                  : tab.key === 'danger'
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
              )}
            >
              {/* Phones: icon above the label so the five tabs fit; larger screens: icon beside it */}
              <span className="inline-flex">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.key !== 'danger' && dirtyByTab[tab.key] && (
                <>
                  <span aria-hidden="true" className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-400" />
                  <span className="sr-only"> (con cambios sin guardar)</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── GENERAL ── */}
      <div className={activeTab !== 'identity' ? 'hidden' : ''}>
        <form onSubmit={handleSaveGeneral} className="space-y-4">
          <div className="bg-white rounded-2xl border border-shell-border shadow-sm p-5 space-y-4">
            <div className="space-y-3">
              <div>
                <label htmlFor="business-name" className="mb-1.5 block text-sm font-medium text-gray-700">Nombre del negocio</label>
                <input
                  id="business-name"
                  className={fieldCls}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Estética Luminosa"
                />
              </div>

              <div>
                <label htmlFor="business-timezone" className="mb-1.5 block text-sm font-medium text-gray-700">Zona horaria</label>
                <Select
                  id="business-timezone"
                  className={fieldCls}
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  <option value="America/Argentina/Buenos_Aires">Buenos Aires (ART)</option>
                  <option value="America/Santiago">Santiago (CLT)</option>
                  <option value="America/Bogota">Bogotá (COT)</option>
                  <option value="America/Mexico_City">Ciudad de México (CST)</option>
                  <option value="America/Lima">Lima (PET)</option>
                  <option value="UTC">UTC</option>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {generalDirty && <span className="text-sm text-amber-700">Hay cambios sin guardar</span>}
            <button type="submit" disabled={isSavingSettings} aria-label="Guardar datos del negocio" className={saveBtnCls}>
              {isSavingSettings ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>

      {/* ── HORARIOS ── */}
      <div className={activeTab !== 'hours' ? 'hidden' : ''}>
        {hoursDirty && (
          <p role="status" className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Tenés cambios sin guardar. Apretá <strong>Guardar</strong> abajo antes de salir de esta sección o de cambiar la forma de trabajo: no se guardan solos.
          </p>
        )}
        <form onSubmit={handleSaveHours} className="space-y-4">
          <div className="bg-white rounded-2xl border border-shell-border shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 text-sm">Horarios del negocio</h3>
            <p className="mt-1 mb-3 text-sm text-gray-500">
              Elegí cómo trabaja el negocio. Los profesionales siguen la misma forma de trabajo.
            </p>
            <p
              role="note"
              className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900"
            >
              <strong className="font-semibold">Estos horarios tienen prioridad sobre los de los profesionales.</strong> Si el local
              está cerrado un día, o fuera de este horario, el cliente no puede reservar, aunque el profesional esté
              disponible. Un profesional solo puede ofrecer turnos dentro de estos horarios; los cierres de la pestaña
              Cierres también quitan turnos.
            </p>
            <div role="radiogroup" aria-label="Forma de trabajo" className="mb-5 grid grid-cols-2 gap-2 sm:max-w-sm">
              {[
                { value: false, label: 'Jornada corrida' },
                { value: true, label: 'Dos turnos' },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  role="radio"
                  aria-checked={splitShifts === opt.value}
                  disabled={isSwitchingMode}
                  onClick={() => handleModeChange(opt.value)}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60',
                    splitShifts === opt.value
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'border-shell-border bg-white text-shell-text hover:bg-shell-muted',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {weeklyHours.map((hour) => {
                const isOpen = !hour.isClosed
                return (
                  <div
                    key={hour.dayOfWeek}
                    className="flex flex-col gap-2 border-b border-gray-100 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:gap-3 sm:border-0 sm:pb-0"
                  >
                    <div className="flex items-center gap-3 sm:w-40 sm:shrink-0">
                      <span className="w-24 shrink-0 text-sm text-gray-700 font-medium">
                        {dayLabels[hour.dayOfWeek]}
                      </span>
                      {/* Toggle switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isOpen}
                        aria-label={`${dayLabels[hour.dayOfWeek]}: abierto`}
                        onClick={() => handleClosedSet(hour.dayOfWeek, isOpen)}
                        className="inline-flex h-11 w-14 shrink-0 items-center justify-center rounded-full focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
                      >
                        <span
                          className={cn(
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                            isOpen ? 'bg-brand-primary' : 'bg-gray-300',
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                              isOpen ? 'translate-x-5' : 'translate-x-0.5',
                            )}
                          />
                        </span>
                      </button>
                      {!isOpen && <span className="text-sm text-gray-500">Cerrado</span>}
                    </div>
                    {isOpen && (
                      <div className="min-w-0 sm:flex-1">
                        <ShiftsFields
                          split={splitShifts}
                          label={dayLabels[hour.dayOfWeek]}
                          value={toDayShifts(hour.opensAt, hour.closesAt, hour.pmOpensAt, hour.pmClosesAt)}
                          onChange={(shifts) => handleShiftsChange(hour.dayOfWeek, shifts)}
                          error={hourErrors[hour.dayOfWeek]}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
              {hoursDirty && <span className="text-sm text-amber-700">Hay cambios sin guardar</span>}
              <button type="submit" disabled={isSavingSettings} aria-label="Guardar horarios" className={saveBtnCls}>
                {isSavingSettings ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── CIERRES ── */}
      <div className={activeTab !== 'closures' ? 'hidden' : ''}>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-shell-border shadow-sm p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-gray-900 text-sm">Cierres excepcionales</h3>
              <button type="button" onClick={openAddClosure} className={cn(saveBtnCls, 'shrink-0 !px-4')}>
                + Agregar cierre
              </button>
            </div>
            {/* Under the title and button, across the whole width, so it takes less height on phones */}
            <p className="mt-2 text-sm text-gray-500">
              Para feriados, vacaciones o un día que no atendés. Un cierre tiene prioridad sobre tus horarios de la semana.
            </p>
          </div>

          {closures.length > 0 && (
            <div className="bg-white rounded-2xl border border-shell-border shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm">Cierres programados</h3>
              </div>
              <ul className="divide-y divide-gray-50">
                {closures.map((closure) => (
                  <li key={closure.id} className="flex items-start justify-between gap-4 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{formatClosureDate(closure.closureDate)}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {describeClosureType(closure.closureType, closure.startsAt, closure.endsAt)}
                        {closure.reason ? ` · ${closure.reason}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <ActionButton
                        aria-label={`Editar cierre del ${formatClosureDate(closure.closureDate)}`}
                        onClick={() => openEditClosure(closure)}
                      >
                        Editar
                      </ActionButton>
                      <ActionButton
                        tone="danger"
                        aria-label={`Eliminar cierre del ${formatClosureDate(closure.closureDate)}`}
                        onClick={() => handleDeleteClosure(closure.id)}
                      >
                        Eliminar
                      </ActionButton>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {closures.length === 0 && (
            <p className="text-center py-6 text-sm text-gray-500">Todavía no cargaste ningún cierre excepcional.</p>
          )}
        </div>
      </div>

      {/* ── POLÍTICA ── */}
      <div className={activeTab !== 'policy' ? 'hidden' : ''}>
        <form onSubmit={handleSaveBookingPolicy} className="space-y-4">
          <div className="bg-white rounded-2xl border border-shell-border shadow-sm p-5 space-y-5">
            <h3 className="font-semibold text-gray-900 text-sm">Configuración de reservas</h3>

            {bookingPolicyError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {bookingPolicyError}
              </p>
            )}

            <div>
              <p className="text-sm text-gray-500 mb-3">
                Cuánto antes del turno tiene que reservar una clienta. Por ejemplo, con 2 horas no se puede reservar un turno que empieza en 1 hora.
              </p>
              <label htmlFor="notice-minutes" className="mb-1.5 block text-sm font-medium text-gray-700">
                Anticipación mínima para reservar
              </label>
              <Select
                id="notice-minutes"
                className={fieldCls}
                wrapperClassName="max-w-xs"
                value={bookingMinNoticeMinutes}
                onChange={(e) => setBookingMinNoticeMinutes(Number(e.target.value))}
              >
                {noticeOptions(bookingMinNoticeMinutes).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <p className="text-sm text-gray-500 mb-3">
                Hasta qué fecha pueden reservar tus clientas, contando desde hoy.
              </p>
              <label htmlFor="horizon-days" className="mb-1.5 block text-sm font-medium text-gray-700">
                Cuántos días hacia adelante se puede reservar
              </label>
              <input
                id="horizon-days"
                className={cn(fieldCls, 'max-w-[10rem]')}
                type="number"
                min="1"
                max="365"
                value={bookingMaxHorizonDays}
                onChange={(e) => setBookingMaxHorizonDays(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-shell-border bg-white p-5 shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">Notificaciones</h3>
            <label className="flex min-h-11 items-start gap-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 shrink-0"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
              <span>
                Enviar notificaciones por email
                <span className="block text-sm text-gray-500">
                  Desactivalo mientras hacés pruebas para que no se envíen emails reales a clientes.
                </span>
              </span>
            </label>
            <div>
              <label htmlFor="business-notification-email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Email para notificaciones del negocio
              </label>
              <input
                id="business-notification-email"
                className={fieldCls}
                type="email"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                placeholder="negocio@ejemplo.com"
              />
              <p className="mt-1.5 text-sm text-gray-500">
                Recibirás una copia de cada turno confirmado, cancelado y reprogramado. Es opcional.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {policyDirty && <span className="text-sm text-amber-700">Hay cambios sin guardar</span>}
            <button type="submit" disabled={isSavingPolicy} aria-label="Guardar política" className={saveBtnCls}>
              {isSavingPolicy ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>

      {closureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="closure-modal-title"
            className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl"
          >
            <h3 id="closure-modal-title" className="mb-3 text-base font-semibold text-gray-900">
              {closureDraft.id ? 'Editar cierre' : 'Agregar cierre'}
            </h3>
            <form onSubmit={handleSaveClosure} noValidate className="space-y-3">
              <div>
                <label htmlFor="closure-date" className="block text-sm text-gray-700">Fecha</label>
                <input
                  id="closure-date"
                  className="dt-field mt-1"
                  type="date"
                  value={closureDraft.closureDate}
                  onChange={(e) => setClosureDraft((d) => ({ ...d, closureDate: e.target.value }))}
                />
              </div>

              <div>
                <label htmlFor="closure-type" className="block text-sm text-gray-700">Tipo de cierre</label>
                <Select
                  id="closure-type"
                  className={fieldCls}
                  wrapperClassName="mt-1"
                  value={closureDraft.closureType}
                  onChange={(e) =>
                    setClosureDraft((d) => ({
                      ...d,
                      closureType: e.target.value as BusinessClosureType,
                    }))
                  }
                >
                  <option value="full_day">Todo el día</option>
                  <option value="half_day">Media jornada</option>
                </Select>
              </div>

              {closureDraft.closureType === 'half_day' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="closure-starts" className="block text-sm text-gray-700">Cierra desde</label>
                    <input
                      id="closure-starts"
                      className="dt-field mt-1"
                      type="time"
                      value={closureDraft.startsAt}
                      onChange={(e) => setClosureDraft((d) => ({ ...d, startsAt: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="closure-ends" className="block text-sm text-gray-700">Reabre a las</label>
                    <input
                      id="closure-ends"
                      className="dt-field mt-1"
                      type="time"
                      value={closureDraft.endsAt}
                      onChange={(e) => setClosureDraft((d) => ({ ...d, endsAt: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="closure-reason" className="block text-sm text-gray-700">Motivo (opcional)</label>
                <input
                  id="closure-reason"
                  className={cn(fieldCls, 'mt-1')}
                  type="text"
                  value={closureDraft.reason}
                  onChange={(e) => setClosureDraft((d) => ({ ...d, reason: e.target.value }))}
                  placeholder="Ej: Feriado nacional"
                />
              </div>

              {closureError && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {closureError}
                </p>
              )}

              <div className="flex gap-3">
                <button type="submit" disabled={isSavingClosure} className={saveBtnCls}>
                  {isSavingClosure ? 'Guardando…' : closureDraft.id ? 'Actualizar cierre' : 'Guardar cierre'}
                </button>
                <button
                  type="button"
                  onClick={closeClosureModal}
                  disabled={isSavingClosure}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <FeedbackToast
        success={successMessage}
        error={errorMessage}
        onDismiss={() => {
          setSuccessMessage(null)
          setErrorMessage(null)
        }}
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        destructive={confirmState.destructive}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        onCancel={closeConfirm}
      />

      {/* ── HISTORIAL (borrar reservas) ── */}
      <div className={activeTab !== 'danger' ? 'hidden' : ''}>
        <div className="space-y-3 rounded-2xl border border-red-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-red-700">Historial</h3>
          {deleteSuccess && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {deleteSuccess}
            </p>
          )}

          <div>
            <p className="text-sm font-semibold text-gray-900">Eliminar historial de reservas</p>
            <p className="mt-1 text-sm text-gray-500">
              Elimina permanentemente todos los turnos del sistema. Esta acción no se puede deshacer.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setDeleteStep(1); setDeleteSuccess(null); setDeleteError(null) }}
            className="w-full rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 sm:w-auto"
          >
            Eliminar historial
          </button>
        </div>
      </div>

      {/* First confirmation dialog */}
      {deleteStep === 1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div role="dialog" aria-modal="true" className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Eliminar historial de reservas</h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Esta acción eliminará permanentemente todas las reservas. El historial es irrecuperable.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteStep(0)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => { setDeleteStep(2); setDeleteConfirmText('') }}
                className="px-4 py-2 text-sm rounded-lg font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Second confirmation dialog — requires typing CONFIRMAR */}
      {deleteStep === 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div role="dialog" aria-modal="true" className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Confirmación final</h2>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Para confirmar, escribí <span className="font-mono font-bold">CONFIRMAR</span> en el campo de abajo.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="CONFIRMAR"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono mb-4 focus:outline-none focus:ring-2 focus:ring-red-300"
              autoFocus
            />
            {deleteError && (
              <p className="text-sm text-red-600 mb-4">{deleteError}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setDeleteStep(0); setDeleteConfirmText('') }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== 'CONFIRMAR' || isDeleting}
                onClick={async () => {
                  setIsDeleting(true)
                  setDeleteError(null)
                  try {
                    const count = await adminDeleteAllAppointments()
                    setDeleteSuccess(`Se eliminaron ${count} turno${count !== 1 ? 's' : ''} correctamente.`)
                    setDeleteStep(0)
                    setDeleteConfirmText('')
                  } catch {
                    setDeleteError('Ocurrió un error al eliminar los turnos. Intentá nuevamente.')
                  } finally {
                    setIsDeleting(false)
                  }
                }}
                className="px-4 py-2 text-sm rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? 'Eliminando…' : 'Eliminar todo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
