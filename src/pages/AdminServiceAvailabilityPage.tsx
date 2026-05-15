import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  addServiceAvailableDate,
  listServiceAvailableDates,
  removeServiceAvailableDate,
  type ServiceAvailableDate,
} from '../services/adminServiceAvailability'

type AddMode = 'single' | 'range' | 'always'

function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = []
  const current = new Date(start + 'T00:00:00')
  const last = new Date(end + 'T00:00:00')
  while (current <= last) {
    dates.push(current.toISOString().slice(0, 10))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

export function AdminServiceAvailabilityPage() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const navigate = useNavigate()

  const [dates, setDates] = useState<ServiceAvailableDate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [addMode, setAddMode] = useState<AddMode>('single')
  const [alwaysConfirmed, setAlwaysConfirmed] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  async function loadDates() {
    if (!serviceId) return
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const data = await listServiceAvailableDates(serviceId)
      setDates(data)
    } catch {
      setErrorMessage('No pudimos cargar las fechas disponibles.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadDates()
  }, [serviceId])

  const handleAddDate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!serviceId) return

    setSuccessMessage(null)
    setErrorMessage(null)

    if (addMode === 'range') {
      if (!rangeStart || !rangeEnd) return
      if (rangeEnd < rangeStart) {
        setErrorMessage('La fecha de fin debe ser igual o posterior a la fecha de inicio.')
        return
      }
      const rangeDates = getDatesInRange(rangeStart, rangeEnd)
      if (rangeDates.length > 90) {
        setErrorMessage('El rango no puede superar los 90 días.')
        return
      }
    } else {
      if (!newDate) return
    }

    setIsAdding(true)

    try {
      if (addMode === 'single') {
        await addServiceAvailableDate(serviceId, newDate)
        setNewDate('')
      } else {
        const rangeDates = getDatesInRange(rangeStart, rangeEnd)
        for (const date of rangeDates) {
          try {
            await addServiceAvailableDate(serviceId, date)
          } catch {
            // skip already-existing dates
          }
        }
        setRangeStart('')
        setRangeEnd('')
      }
      await loadDates()
      setSuccessMessage(
        addMode === 'single' ? 'Fecha agregada correctamente.' : 'Rango de fechas agregado correctamente.',
      )
    } catch {
      setErrorMessage('No pudimos agregar la fecha disponible.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveDate = async (date: string) => {
    if (!serviceId) return

    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      await removeServiceAvailableDate(serviceId, date)
      await loadDates()
      setSuccessMessage('Fecha eliminada correctamente.')
    } catch {
      setErrorMessage('No pudimos eliminar la fecha disponible.')
    }
  }

  const handleClearAll = async () => {
    if (!serviceId) return

    setSuccessMessage(null)
    setErrorMessage(null)
    setIsClearing(true)

    try {
      for (const entry of dates) {
        await removeServiceAvailableDate(serviceId, entry.availableDate)
      }
      await loadDates()
      setAlwaysConfirmed(false)
      setSuccessMessage('El servicio ahora está disponible cualquier día.')
    } catch {
      setErrorMessage('No pudimos limpiar las fechas.')
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          className="rounded-lg border border-shell-border px-3 py-2 text-sm font-medium text-shell-text"
          onClick={() => navigate('/admin/services')}
          type="button"
        >
          ← Volver a servicios
        </button>
        <h2 className="font-heading text-2xl font-semibold text-shell-text">
          Disponibilidad del servicio
        </h2>
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      <section className="shell-surface rounded-2xl border p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-shell-text">Disponibilidad</h3>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              addMode === 'single'
                ? 'border-shell-text bg-shell-text text-white'
                : 'border-shell-border text-shell-text'
            }`}
            onClick={() => setAddMode('single')}
            type="button"
          >
            Fecha única
          </button>
          <button
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              addMode === 'range'
                ? 'border-shell-text bg-shell-text text-white'
                : 'border-shell-border text-shell-text'
            }`}
            onClick={() => setAddMode('range')}
            type="button"
          >
            Rango de fechas
          </button>
          <button
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              addMode === 'always'
                ? 'border-shell-text bg-shell-text text-white'
                : 'border-shell-border text-shell-text'
            }`}
            onClick={() => { setAddMode('always'); setAlwaysConfirmed(false) }}
            type="button"
          >
            Siempre disponible
          </button>
        </div>

        {addMode === 'always' ? (
          <div className="mt-4 rounded-xl border border-shell-border p-4">
            {dates.length === 0 ? (
              <p className="text-sm text-emerald-700">
                ✓ Este servicio ya está disponible cualquier día. No hay restricciones de fechas.
              </p>
            ) : (
              <>
                <p className="text-sm text-shell-text">
                  Hay <strong>{dates.length}</strong> fecha{dates.length !== 1 ? 's' : ''} configurada{dates.length !== 1 ? 's' : ''}. Al activar "siempre disponible" se eliminarán todas.
                </p>
                {!alwaysConfirmed ? (
                  <button
                    className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800"
                    onClick={() => setAlwaysConfirmed(true)}
                    type="button"
                  >
                    Entendido, quiero que esté siempre disponible
                  </button>
                ) : (
                  <button
                    className="mt-3 rounded-lg bg-shell-text px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    disabled={isClearing}
                    onClick={() => void handleClearAll()}
                    type="button"
                  >
                    {isClearing ? 'Eliminando fechas…' : 'Confirmar: eliminar fechas y activar siempre disponible'}
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={handleAddDate}>
            {addMode === 'single' ? (
              <label className="flex-1 text-sm text-shell-text">
                Fecha
                <input
                  className="mt-1 w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm"
                  onChange={(event) => setNewDate(event.target.value)}
                  type="date"
                  value={newDate}
                />
              </label>
            ) : (
              <>
                <label className="flex-1 min-w-[160px] text-sm text-shell-text">
                  Fecha inicio
                  <input
                    className="mt-1 w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm"
                    onChange={(event) => setRangeStart(event.target.value)}
                    type="date"
                    value={rangeStart}
                  />
                </label>
                <label className="flex-1 min-w-[160px] text-sm text-shell-text">
                  Fecha fin
                  <input
                    className="mt-1 w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm"
                    onChange={(event) => setRangeEnd(event.target.value)}
                    type="date"
                    value={rangeEnd}
                  />
                </label>
              </>
            )}
            <button
              className="rounded-lg bg-shell-text px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              disabled={
                isAdding ||
                (addMode === 'single' ? !newDate : !rangeStart || !rangeEnd)
              }
              type="submit"
            >
              {addMode === 'single' ? 'Agregar fecha' : 'Agregar rango'}
            </button>
          </form>
        )}
      </section>

      <section className="shell-surface rounded-2xl border p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-shell-text">Fechas configuradas</h3>

        {isLoading ? (
          <p className="mt-4 text-sm text-shell-subtleText">Cargando fechas disponibles...</p>
        ) : dates.length === 0 ? (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="mt-0.5 text-emerald-500" aria-hidden="true">✓</span>
            <div>
              <p className="text-sm font-semibold text-emerald-800">Disponible cualquier día</p>
              <p className="mt-0.5 text-sm text-emerald-700">
                Este servicio no tiene fechas específicas configuradas. Los clientes pueden reservarlo en cualquier fecha disponible.
              </p>
            </div>
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {dates.map((entry) => (
              <li
                key={entry.availableDate}
                className="flex items-center justify-between rounded-xl border border-shell-border px-4 py-3"
              >
                <span className="text-sm font-medium text-shell-text">{entry.availableDate}</span>
                <button
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700"
                  onClick={() => void handleRemoveDate(entry.availableDate)}
                  type="button"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}
