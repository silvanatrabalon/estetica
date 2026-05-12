import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import {
  deleteBusinessClosure,
  getBusinessSettings,
  saveBusinessClosure,
  saveBusinessSettings,
  type BusinessClosureRecord,
  type BusinessHoursRecord,
} from '../services/businessSettings'
import type { BusinessClosureType, BusinessHoursInput } from '../lib/businessSettings'
import { commonCopy } from '../lib/uiCopy'
import { useUser } from '../hooks/useUser'

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
  const [weeklyHours, setWeeklyHours] = useState<BusinessHoursRecord[]>([])
  const [closures, setClosures] = useState<BusinessClosureRecord[]>([])
  const [closureDraft, setClosureDraft] = useState<ClosureDraft>(emptyClosureDraft())
  const [missingReadiness, setMissingReadiness] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isSavingClosure, setIsSavingClosure] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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

  const handleClosedToggle = (dayOfWeek: number, event: ChangeEvent<HTMLInputElement>) => {
    setWeeklyHours((current) =>
      current.map((hour) =>
        hour.dayOfWeek === dayOfWeek
          ? {
              ...hour,
              isClosed: event.target.checked,
              opensAt: event.target.checked ? null : hour.opensAt,
              closesAt: event.target.checked ? null : hour.closesAt,
            }
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

  const handleDeleteClosure = async (closureId: string) => {
    if (!window.confirm('¿Confirmas eliminar este cierre excepcional?')) {
      return
    }

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
  }

  if (isLoading) {
    return <p className="text-sm text-shell-subtleText">{commonCopy.loading}</p>
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-shell-text">Negocio</h2>
        <p className="mt-2 text-sm text-shell-subtleText">
          Configura la identidad del salon, la zona horaria canónica, los horarios generales y los cierres excepcionales.
        </p>
      </div>

      {!organizationId ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Aun no se pudo resolver el negocio principal. Reintenta la carga.
        </p>
      ) : null}

      {missingReadiness.length > 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Configuracion incompleta. Falta definir: {missingReadiness.map(missingLabel).join(', ')}.
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>
      ) : null}

      {successMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{successMessage}</p>
      ) : null}

      <form className="space-y-6" onSubmit={handleSaveSettings}>
        <section className="shell-surface rounded-2xl border p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-shell-text">Identidad y branding</h3>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-shell-text">
              Nombre del negocio
              <input
                className="mt-1 w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>

            <label className="text-sm text-shell-text">
              Zona horaria (IANA)
              <input
                className="mt-1 w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
              />
            </label>

            <label className="text-sm text-shell-text">
              URL del logo
              <input
                className="mt-1 w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm"
                value={logoUrl}
                onChange={(event) => setLogoUrl(event.target.value)}
              />
            </label>

            <label className="text-sm text-shell-text">
              Color principal (#RRGGBB)
              <input
                className="mt-1 w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm"
                value={primaryColor}
                onChange={(event) => setPrimaryColor(event.target.value)}
              />
            </label>

            <label className="text-sm text-shell-text">
              Titulo del header de reservas
              <input
                className="mt-1 w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm"
                value={bookingHeaderText}
                onChange={(event) => setBookingHeaderText(event.target.value)}
              />
            </label>

            <label className="text-sm text-shell-text">
              Subtitulo del header de reservas
              <input
                className="mt-1 w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm"
                value={bookingSubtitleText}
                onChange={(event) => setBookingSubtitleText(event.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="shell-surface rounded-2xl border p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-shell-text">Horarios del negocio</h3>
          <div className="mt-4 space-y-3">
            {weeklyHours.map((hour) => (
              <div key={hour.dayOfWeek} className="grid gap-3 rounded-xl border border-shell-border p-3 md:grid-cols-[140px_120px_1fr_1fr] md:items-center">
                <p className="text-sm font-medium text-shell-text">{dayLabels[hour.dayOfWeek]}</p>

                <label className="flex items-center gap-2 text-sm text-shell-text">
                  <input
                    checked={hour.isClosed}
                    onChange={(event) => handleClosedToggle(hour.dayOfWeek, event)}
                    type="checkbox"
                  />
                  Cerrado
                </label>

                <label className="text-sm text-shell-text">
                  Apertura
                  <input
                    aria-label={`Apertura ${dayLabels[hour.dayOfWeek]}`}
                    className="mt-1 w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm"
                    disabled={hour.isClosed}
                    onChange={(event) => handleHourChange(hour.dayOfWeek, 'opensAt', event.target.value)}
                    type="time"
                    value={hour.opensAt ?? ''}
                  />
                </label>

                <label className="text-sm text-shell-text">
                  Cierre
                  <input
                    aria-label={`Cierre ${dayLabels[hour.dayOfWeek]}`}
                    className="mt-1 w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm"
                    disabled={hour.isClosed}
                    onChange={(event) => handleHourChange(hour.dayOfWeek, 'closesAt', event.target.value)}
                    type="time"
                    value={hour.closesAt ?? ''}
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <button
            className="rounded-lg bg-shell-text px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={isSavingSettings}
            type="submit"
          >
            {isSavingSettings ? commonCopy.saving : 'Guardar configuracion del negocio'}
          </button>
        </div>
      </form>

      <section className="shell-surface rounded-2xl border p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-shell-text">Cierres excepcionales</h3>
            <p className="mt-1 text-sm text-shell-subtleText">
              Registra cierres de dia completo o media jornada para feriados, capacitaciones o mantenimiento.
            </p>
          </div>
        </div>

        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSaveClosure}>
          <label className="text-sm text-shell-text">
            Fecha
            <input
              className="mt-1 w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm"
              onChange={(event) => setClosureDraft((current) => ({ ...current, closureDate: event.target.value }))}
              type="date"
              value={closureDraft.closureDate}
            />
          </label>

          <label className="text-sm text-shell-text">
            Tipo de cierre
            <select
              className="mt-1 w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm"
              onChange={(event) =>
                setClosureDraft((current) => ({
                  ...current,
                  closureType: event.target.value as BusinessClosureType,
                }))
              }
              value={closureDraft.closureType}
            >
              <option value="full_day">Dia completo</option>
              <option value="half_day">Media jornada</option>
            </select>
          </label>

          {closureDraft.closureType === 'half_day' ? (
            <>
              <label className="text-sm text-shell-text">
                Inicio del cierre
                <input
                  className="mt-1 w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm"
                  onChange={(event) => setClosureDraft((current) => ({ ...current, startsAt: event.target.value }))}
                  type="time"
                  value={closureDraft.startsAt}
                />
              </label>

              <label className="text-sm text-shell-text">
                Fin del cierre
                <input
                  className="mt-1 w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm"
                  onChange={(event) => setClosureDraft((current) => ({ ...current, endsAt: event.target.value }))}
                  type="time"
                  value={closureDraft.endsAt}
                />
              </label>
            </>
          ) : null}

          <label className="text-sm text-shell-text md:col-span-2">
            Motivo (opcional)
            <input
              className="mt-1 w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm"
              onChange={(event) => setClosureDraft((current) => ({ ...current, reason: event.target.value }))}
              value={closureDraft.reason}
            />
          </label>

          <div className="md:col-span-2 flex gap-3">
            <button
              className="rounded-lg bg-shell-text px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              disabled={isSavingClosure}
              type="submit"
            >
              {isSavingClosure ? commonCopy.saving : closureDraft.id ? 'Actualizar cierre' : 'Guardar cierre'}
            </button>

            {closureDraft.id ? (
              <button
                className="rounded-lg border border-shell-border px-4 py-2 text-sm font-medium text-shell-text"
                onClick={() => setClosureDraft(emptyClosureDraft())}
                type="button"
              >
                Cancelar edicion
              </button>
            ) : null}
          </div>
        </form>

        {closures.length === 0 ? (
          <p className="mt-4 text-sm text-shell-subtleText">Todavia no hay cierres excepcionales configurados.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {closures.map((closure) => (
              <li key={closure.id} className="flex flex-col gap-3 rounded-xl border border-shell-border p-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-shell-text">{closure.closureDate}</p>
                  <p className="text-sm text-shell-subtleText">
                    {closure.closureType === 'full_day'
                      ? 'Dia completo'
                      : `Media jornada (${closure.startsAt ?? '--'} a ${closure.endsAt ?? '--'})`}
                    {closure.reason ? ` · ${closure.reason}` : ''}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    className="rounded-lg border border-shell-border px-3 py-2 text-sm font-medium text-shell-text"
                    onClick={() => setClosureDraft(toDraft(closure))}
                    type="button"
                  >
                    Editar
                  </button>
                  <button
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700"
                    onClick={() => void handleDeleteClosure(closure.id)}
                    type="button"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}