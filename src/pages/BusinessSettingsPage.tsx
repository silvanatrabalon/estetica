import { FormEvent, useEffect, useState } from 'react'
import { cn } from '../lib/cn'
import {
  deleteBusinessClosure,
  getBusinessSettings,
  saveBusinessClosure,
  saveBusinessSettings,
  updateBookingPolicy,
  type BusinessClosureRecord,
  type BusinessHoursRecord,
} from '../services/businessSettings'
import { adminDeleteAllAppointments } from '../services/adminAppointments'
import type { BusinessClosureType, BusinessHoursInput } from '../lib/businessSettings'
import { commonCopy } from '../lib/uiCopy'
import { useUser } from '../hooks/useUser'
import { ConfirmModal } from '../components/ConfirmModal'
import { Select } from '../components/Select'

const dayLabels = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

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

export function BusinessSettingsPage() {
  const { isLoading: isUserLoading } = useUser()
  const [organizationId, setOrganizationId] = useState<string>('')
  const [name, setName] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const [logoUrl, setLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('')
  const [bookingHeaderText, setBookingHeaderText] = useState('')
  const [bookingSubtitleText, setBookingSubtitleText] = useState('')
  const [notificationEmail, setNotificationEmail] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [bookingMinNoticeMinutes, setBookingMinNoticeMinutes] = useState(60)
  const [bookingMaxHorizonDays, setBookingMaxHorizonDays] = useState(60)
  const [bookingPolicyError, setBookingPolicyError] = useState<string | null>(null)
  const [weeklyHours, setWeeklyHours] = useState<BusinessHoursRecord[]>([])
  const [closures, setClosures] = useState<BusinessClosureRecord[]>([])
  const [closureDraft, setClosureDraft] = useState<ClosureDraft>(emptyClosureDraft())
  const [missingReadiness, setMissingReadiness] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'identity' | 'hours' | 'closures' | 'policy'>('identity')
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isSavingClosure, setIsSavingClosure] = useState(false)
  const [isSavingPolicy, setIsSavingPolicy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean; message: string; title: string; onConfirm: () => void
  }>({ isOpen: false, message: '', title: 'Confirmar', onConfirm: () => {} })

  // ── Danger zone state ──────────────────────────────────────────────────────
  const [dangerOpen, setDangerOpen] = useState(false)
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({ isOpen: true, title, message, onConfirm })
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
      setErrorMessage('No pudimos cargar la configuracion del negocio en este momento.')
    } finally {
      setIsLoading(false)
    }
  }

  function awaitableApplyLoadedData(data: Awaited<ReturnType<typeof getBusinessSettings>>) {
    setOrganizationId(data.organizationId)
    setName(data.name)
    setTimezone(data.timezone)
    setLogoUrl(data.logoUrl ?? '')
    setPrimaryColor(data.primaryColor ?? '')
    setBookingHeaderText(data.bookingHeaderText ?? '')
    setBookingSubtitleText(data.bookingSubtitleText ?? '')
    setNotificationEmail(data.notificationEmail ?? '')
    setNotificationsEnabled(data.notificationsEnabled ?? true)
    setBookingMinNoticeMinutes(data.bookingMinNoticeMinutes)
    setBookingMaxHorizonDays(data.bookingMaxHorizonDays)
    setWeeklyHours(data.weeklyHours)
    setClosures(data.closures)
    setMissingReadiness(data.readiness.missing)
  }

  useEffect(() => {
    // Wait until user session is loaded before attempting to fetch business settings
    if (!isUserLoading) {
      void loadBusinessSettings()
    }
  }, [isUserLoading])

  const handleHourChange = (dayOfWeek: number, field: 'opensAt' | 'closesAt', value: string) => {
    setWeeklyHours((current) =>
      current.map((hour) =>
        hour.dayOfWeek === dayOfWeek
          ? {
              ...hour,
              [field]: value || null,
            }
          : hour,
      ),
    )
  }

  const handleClosedSet = (dayOfWeek: number, closed: boolean) => {
    setWeeklyHours((current) =>
      current.map((hour) =>
        hour.dayOfWeek === dayOfWeek
          ? { ...hour, isClosed: closed, opensAt: closed ? null : hour.opensAt, closesAt: closed ? null : hour.closesAt }
          : hour,
      ),
    )
  }

  const handleSaveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSavingSettings(true)

    try {
      const updated = await saveBusinessSettings({
        name,
        timezone,
        logoUrl,
        primaryColor,
        bookingHeaderText,
        bookingSubtitleText,
        notificationEmail,
        notificationsEnabled,
        weeklyHours: toHoursInput(weeklyHours),
      })

      applyLoadedData(updated)
      setSuccessMessage('Configuracion del negocio guardada correctamente.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No pudimos guardar la configuracion del negocio.')
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handleSaveClosure = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
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

      const updated = await getBusinessSettings()
      applyLoadedData(updated)
      setClosureDraft(emptyClosureDraft())
      setSuccessMessage('Cierre excepcional guardado correctamente.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No pudimos guardar el cierre excepcional.')
    } finally {
      setIsSavingClosure(false)
    }
  }

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
          const updated = await getBusinessSettings()
          applyLoadedData(updated)
          setClosureDraft((current) => (current.id === closureId ? emptyClosureDraft() : current))
          setSuccessMessage('Cierre excepcional eliminado correctamente.')
        } catch {
          setErrorMessage('No pudimos eliminar el cierre excepcional.')
        }
      },
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

    setIsSavingPolicy(true)

    try {
      await updateBookingPolicy(bookingMinNoticeMinutes, bookingMaxHorizonDays)
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
    'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-colors'
  const saveBtnCls =
    'rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong transition-colors disabled:opacity-50'

  const TABS = [
    {
      key: 'identity' as const,
      label: 'Identidad',
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
  ]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Alerts */}
      <div className="space-y-2 mb-4">
        {!organizationId ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Aun no se pudo resolver el negocio principal. Reintenta la carga.
          </p>
        ) : null}
        {missingReadiness.length > 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Configuracion incompleta. Falta definir: {missingReadiness.map(missingLabel).join(', ')}.
          </p>
        ) : null}
        {errorMessage ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
        ) : null}
        {successMessage ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p>
        ) : null}
      </div>

      {/* Page header */}
      <div className="mb-4">
        <h2 className="font-heading text-2xl font-semibold text-shell-text">Negocio</h2>
        <p className="mt-1 text-sm text-shell-subtleText">
          Configura la identidad, horarios y política de reservas del salón.
        </p>
      </div>

      {/* Sticky tab bar */}
      <div className="sticky top-0 z-10 -mx-6 px-6 pt-2 pb-4 bg-shell-base/95 backdrop-blur-sm">
        <div className="flex gap-1 rounded-2xl bg-white border border-shell-border p-1 shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-medium transition-all',
                activeTab === tab.key
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── IDENTIDAD ── */}
      <div className={activeTab !== 'identity' ? 'hidden' : ''}>
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="bg-white rounded-2xl border border-shell-border shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">Identidad y branding</h3>

            <div className="space-y-3">
              <div>
                <label htmlFor="business-name" className="mb-1.5 block text-xs font-medium text-gray-600">Nombre del negocio</label>
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
                <label htmlFor="business-timezone" className="mb-1.5 block text-xs font-medium text-gray-600">Zona horaria</label>
                <Select
                  id="business-timezone"
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

              <div>
                <label htmlFor="business-logo" className="mb-1.5 block text-xs font-medium text-gray-600">URL del logo</label>
                <input
                  id="business-logo"
                  className={fieldCls}
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>

              <div>
                <label htmlFor="business-color" className="mb-1.5 block text-xs font-medium text-gray-600">Color principal (hex)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-9 w-14 cursor-pointer rounded-lg border border-gray-200 bg-white p-0.5"
                  />
                  <input
                    id="business-color"
                    className={cn(fieldCls, 'flex-1')}
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#0f766e"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-shell-border shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">Textos de reserva</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Título principal</label>
                <input
                  className={fieldCls}
                  type="text"
                  value={bookingHeaderText}
                  onChange={(e) => setBookingHeaderText(e.target.value)}
                  placeholder="Ej: Reserva tu turno"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Subtítulo</label>
                <input
                  className={fieldCls}
                  type="text"
                  value={bookingSubtitleText}
                  onChange={(e) => setBookingSubtitleText(e.target.value)}
                  placeholder="Ej: Elegí el servicio y horario"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">Notificaciones</h3>
            <label className="flex items-start gap-2.5 text-sm text-gray-700">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
              <span>
                Enviar notificaciones por email
                <span className="block text-xs text-gray-400">
                  Desactivalo mientras hacés pruebas para que no se envíen emails reales a clientes.
                </span>
              </span>
            </label>
            <div>
              <label htmlFor="business-notification-email" className="mb-1.5 block text-xs font-medium text-gray-600">
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
              <p className="mt-1.5 text-xs text-gray-400">
                Recibirás una copia de cada turno confirmado, cancelado y reprogramado. Es opcional.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={isSavingSettings} className={saveBtnCls}>
              {isSavingSettings ? 'Guardando…' : 'Guardar configuracion del negocio'}
            </button>
          </div>
        </form>
      </div>

      {/* ── HORARIOS ── */}
      <div className={activeTab !== 'hours' ? 'hidden' : ''}>
      {true && (
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="bg-white rounded-2xl border border-shell-border shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Horarios del negocio</h3>
            <div className="space-y-3">
              {weeklyHours.map((hour) => {
                const isOpen = !hour.isClosed
                return (
                  <div key={hour.dayOfWeek} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-sm text-gray-700 font-medium">
                      {dayLabels[hour.dayOfWeek]}
                    </span>
                    {/* Toggle switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isOpen}
                      onClick={() => handleClosedSet(hour.dayOfWeek, isOpen)}
                      className={cn(
                        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-300',
                        isOpen ? 'bg-brand-primary' : 'bg-gray-200',
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                          isOpen ? 'translate-x-4' : 'translate-x-0.5',
                        )}
                      />
                    </button>
                    {isOpen ? (
                      <div className="flex flex-1 items-center gap-1 min-w-0">
                        <input
                          type="time"
                          value={hour.opensAt ?? ''}
                          onChange={(e) => handleHourChange(hour.dayOfWeek, 'opensAt', e.target.value)}
                          className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none"
                        />
                        <span className="text-gray-300 text-xs shrink-0">—</span>
                        <input
                          type="time"
                          value={hour.closesAt ?? ''}
                          onChange={(e) => handleHourChange(hour.dayOfWeek, 'closesAt', e.target.value)}
                          className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Cerrado</span>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end mt-5">
              <button type="submit" disabled={isSavingSettings} className={saveBtnCls}>
                {isSavingSettings ? 'Guardando…' : 'Guardar horarios'}
              </button>
            </div>
          </div>
        </form>
      )}
      </div>

      {/* ── CIERRES ── */}
      <div className={activeTab !== 'closures' ? 'hidden' : ''}>
      {true && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-shell-border shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Cierres excepcionales</h3>
            <form onSubmit={handleSaveClosure} className="space-y-3">
              <div>
                <label htmlFor="closure-date" className="block text-sm text-gray-700">Fecha</label>
                <input
                  id="closure-date"
                  className={cn(fieldCls, 'mt-1')}
                  type="date"
                  value={closureDraft.closureDate}
                  onChange={(e) => setClosureDraft((d) => ({ ...d, closureDate: e.target.value }))}
                />
              </div>

              <div>
                <label htmlFor="closure-type" className="block text-sm text-gray-700">Tipo de cierre</label>
                <Select
                  id="closure-type"
                  wrapperClassName="mt-1"
                  value={closureDraft.closureType}
                  onChange={(e) =>
                    setClosureDraft((d) => ({
                      ...d,
                      closureType: e.target.value as BusinessClosureType,
                    }))
                  }
                >
                  <option value="full_day">Dia completo</option>
                  <option value="half_day">Media jornada</option>
                </Select>
              </div>

              {closureDraft.closureType === 'half_day' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="closure-starts" className="block text-sm text-gray-700">Inicio del cierre</label>
                    <input
                      id="closure-starts"
                      className={cn(fieldCls, 'mt-1')}
                      type="time"
                      value={closureDraft.startsAt}
                      onChange={(e) => setClosureDraft((d) => ({ ...d, startsAt: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="closure-ends" className="block text-sm text-gray-700">Fin del cierre</label>
                    <input
                      id="closure-ends"
                      className={cn(fieldCls, 'mt-1')}
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

              <div className="flex gap-3">
                <button type="submit" disabled={isSavingClosure} className={saveBtnCls}>
                  {isSavingClosure ? 'Guardando…' : closureDraft.id ? 'Actualizar cierre' : 'Guardar cierre'}
                </button>
                {closureDraft.id && (
                  <button
                    type="button"
                    onClick={() => setClosureDraft(emptyClosureDraft())}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
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
                      <p className="text-sm font-medium text-gray-900">{closure.closureDate}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {closure.closureType === 'full_day'
                          ? 'Dia completo'
                          : `Media jornada (${closure.startsAt ?? '--'} a ${closure.endsAt ?? '--'})`}
                        {closure.reason ? ` · ${closure.reason}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setClosureDraft(toDraft(closure))}
                        className="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClosure(closure.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {closures.length === 0 && (
            <p className="text-center py-6 text-sm text-gray-400">Todavia no hay cierres excepcionales configurados.</p>
          )}
        </div>
      )}
      </div>

      {/* ── POLÍTICA ── */}
      <div className={activeTab !== 'policy' ? 'hidden' : ''}>
      {true && (
        <form onSubmit={handleSaveBookingPolicy} className="space-y-4">
          <div className="bg-white rounded-2xl border border-shell-border shadow-sm p-5 space-y-5">
            <h3 className="font-semibold text-gray-900 text-sm">Configuración de reservas</h3>

            {bookingPolicyError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {bookingPolicyError}
              </p>
            )}

            <div>
              <p className="text-xs text-gray-500 mb-3">
                Tiempo mínimo antes del turno para que un cliente pueda reservar.
              </p>
              <label htmlFor="notice-minutes" className="mb-1.5 block text-xs font-medium text-gray-600">
                Anticipación mínima (minutos)
              </label>
              <input
                id="notice-minutes"
                className={cn(fieldCls, 'max-w-[10rem]')}
                type="number"
                min="0"
                max="10080"
                value={bookingMinNoticeMinutes}
                onChange={(e) => setBookingMinNoticeMinutes(Number(e.target.value))}
              />
            </div>

            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs text-gray-500 mb-3">
                Cuántos días hacia el futuro puede reservar un cliente.
              </p>
              <label htmlFor="horizon-days" className="mb-1.5 block text-xs font-medium text-gray-600">
                Horizonte de reservas (días)
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

          <div className="flex justify-end">
            <button type="submit" disabled={isSavingPolicy} className={saveBtnCls}>
              {isSavingPolicy ? 'Guardando…' : 'Guardar política'}
            </button>
          </div>
        </form>
      )}
      </div>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />

      {/* ── ZONA DE PELIGRO ── */}
      <div className="mt-8">
        <button
          type="button"
          onClick={() => setDangerOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors"
        >
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Zona de peligro
          </span>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={cn('transition-transform', dangerOpen ? 'rotate-180' : '')}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {dangerOpen && (
          <div className="mt-2 rounded-xl border border-red-200 bg-white p-5 space-y-4">
            {deleteSuccess && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {deleteSuccess}
              </p>
            )}

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Eliminar historial de reservas</p>
                <p className="text-xs text-gray-500 mt-1">
                  Elimina permanentemente todos los turnos del sistema. Esta acción no se puede deshacer.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setDeleteStep(1); setDeleteSuccess(null); setDeleteError(null) }}
                className="shrink-0 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
              >
                Eliminar historial
              </button>
            </div>
          </div>
        )}
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
