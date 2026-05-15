import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatPriceARS } from '../lib/formatPrice'
import {
  createService,
  listServices,
  setServiceActive,
  updateService,
  type Service,
} from '../services/adminServices'

type FormMode = 'create' | 'edit' | null

interface FormData {
  name: string
  durationMinutes: string
  priceCents: string
  imageUrl: string
  maxConcurrentBookings: string
}

const EMPTY_FORM: FormData = {
  name: '',
  durationMinutes: '',
  priceCents: '0',
  imageUrl: '',
  maxConcurrentBookings: '',
}

interface ValidationErrors {
  name?: string
  durationMinutes?: string
  priceCents?: string
  imageUrl?: string
  maxConcurrentBookings?: string
}

function validateForm(data: FormData): ValidationErrors {
  const errors: ValidationErrors = {}

  if (data.name.trim().length < 2) {
    errors.name = 'El nombre debe tener al menos 2 caracteres.'
  }

  const duration = Number(data.durationMinutes)
  if (!Number.isInteger(duration) || duration < 1 || duration > 480) {
    errors.durationMinutes = 'La duración debe ser un número entero entre 1 y 480 minutos.'
  }

  const price = Number(data.priceCents)
  if (!Number.isInteger(price) || price < 0) {
    errors.priceCents = 'El precio debe ser un número entero mayor o igual a cero (en centavos).'
  }

  if (data.imageUrl.trim() !== '') {
    try {
      new URL(data.imageUrl.trim())
    } catch {
      errors.imageUrl = 'La URL de imagen no tiene un formato válido.'
    }
  }

  if (data.maxConcurrentBookings.trim() !== '') {
    const capacity = Number(data.maxConcurrentBookings)
    if (!Number.isInteger(capacity) || capacity < 1) {
      errors.maxConcurrentBookings = 'La capacidad debe ser un número entero mayor a cero.'
    }
  }

  return errors
}

function hasErrors(errors: ValidationErrors): boolean {
  return Object.values(errors).some((v) => v !== undefined)
}

export function AdminServicesPage() {
  const navigate = useNavigate()
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [formMode, setFormMode] = useState<FormMode>(null)
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<ValidationErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  const loadServices = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const data = await listServices()
      setServices(data)
    } catch {
      setErrorMessage('No pudimos cargar el catálogo de servicios en este momento.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadServices()
  }, [])

  const openCreateForm = () => {
    setFormMode('create')
    setEditingServiceId(null)
    setFormData(EMPTY_FORM)
    setFormErrors({})
    setSuccessMessage(null)
    setErrorMessage(null)
  }

  const openEditForm = (service: Service) => {
    setFormMode('edit')
    setEditingServiceId(service.id)
    setFormData({
      name: service.name,
      durationMinutes: String(service.durationMinutes),
      priceCents: String(service.priceCents),
      imageUrl: service.imageUrl ?? '',
      maxConcurrentBookings:
        service.maxConcurrentBookings !== null ? String(service.maxConcurrentBookings) : '',
    })
    setFormErrors({})
    setSuccessMessage(null)
    setErrorMessage(null)
  }

  const closeForm = () => {
    setFormMode(null)
    setEditingServiceId(null)
    setFormData(EMPTY_FORM)
    setFormErrors({})
  }

  const handleField =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    }

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccessMessage(null)
    setErrorMessage(null)

    const errors = validateForm(formData)
    if (hasErrors(errors)) {
      setFormErrors(errors)
      return
    }

    setIsSaving(true)

    const imageUrl = formData.imageUrl.trim() === '' ? null : formData.imageUrl.trim()
    const maxConcurrentBookings =
      formData.maxConcurrentBookings.trim() === ''
        ? null
        : Number(formData.maxConcurrentBookings)

    try {
      if (formMode === 'create') {
        const created = await createService({
          name: formData.name.trim(),
          durationMinutes: Number(formData.durationMinutes),
          priceCents: Number(formData.priceCents),
          imageUrl,
          maxConcurrentBookings,
        })
        setServices((current) =>
          [...current, created].sort((a, b) => a.name.localeCompare(b.name)),
        )
        setSuccessMessage('Servicio creado correctamente.')
        closeForm()
      } else if (formMode === 'edit' && editingServiceId) {
        const updated = await updateService({
          serviceId: editingServiceId,
          name: formData.name.trim(),
          durationMinutes: Number(formData.durationMinutes),
          priceCents: Number(formData.priceCents),
          imageUrl,
          maxConcurrentBookings,
        })
        setServices((current) => current.map((s) => (s.id === updated.id ? updated : s)))
        setSuccessMessage('Servicio actualizado correctamente.')
        closeForm()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (
        message.includes('duplicate') ||
        message.includes('unique') ||
        message.includes('unique_violation')
      ) {
        setErrorMessage('Ya existe un servicio con ese nombre.')
      } else {
        setErrorMessage('No pudimos guardar los cambios. Intentá de nuevo.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (service: Service) => {
    const action = service.isActive ? 'desactivar' : 'reactivar'
    const confirmed = window.confirm(`¿Confirmás ${action} el servicio "${service.name}"?`)
    if (!confirmed) return

    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      await setServiceActive(service.id, !service.isActive)
      setServices((current) =>
        current.map((s) => (s.id === service.id ? { ...s, isActive: !service.isActive } : s)),
      )
      setSuccessMessage(
        service.isActive
          ? `"${service.name}" fue desactivado.`
          : `"${service.name}" fue reactivado.`,
      )
    } catch {
      setErrorMessage('No pudimos actualizar el estado del servicio.')
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Cargando servicios...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Servicios</h1>
        {formMode === null && (
          <button
            type="button"
            onClick={openCreateForm}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Agregar servicio
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          {successMessage}
        </div>
      )}

      {formMode !== null && (
        <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
          <h2 className="text-lg font-medium text-gray-800 mb-4">
            {formMode === 'create' ? 'Nuevo servicio' : 'Editar servicio'}
          </h2>
          <form onSubmit={(e) => void handleFormSubmit(e)} noValidate>
            <div className="mb-4">
              <label
                htmlFor="service-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nombre
              </label>
              <input
                id="service-name"
                type="text"
                value={formData.name}
                onChange={handleField('name')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Corte de cabello"
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="service-duration"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Duración (minutos)
              </label>
              <input
                id="service-duration"
                type="number"
                min="1"
                max="480"
                value={formData.durationMinutes}
                onChange={handleField('durationMinutes')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 60"
              />
              {formErrors.durationMinutes && (
                <p className="mt-1 text-sm text-red-600">{formErrors.durationMinutes}</p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="service-price"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Precio (centavos)
              </label>
              <input
                id="service-price"
                type="number"
                min="0"
                value={formData.priceCents}
                onChange={handleField('priceCents')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 500000 (= $5.000,00)"
              />
              {formData.priceCents !== '' && !formErrors.priceCents && (
                <p className="mt-1 text-xs text-gray-500">
                  Vista previa: {formatPriceARS(Number(formData.priceCents))}
                </p>
              )}
              {formErrors.priceCents && (
                <p className="mt-1 text-sm text-red-600">{formErrors.priceCents}</p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="service-image-url"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                URL de imagen{' '}
                <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                id="service-image-url"
                type="url"
                value={formData.imageUrl}
                onChange={handleField('imageUrl')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://ejemplo.com/imagen.jpg"
              />
              {formErrors.imageUrl && (
                <p className="mt-1 text-sm text-red-600">{formErrors.imageUrl}</p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="service-capacity"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Capacidad simult&aacute;nea{' '}
                <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                id="service-capacity"
                type="number"
                min="1"
                value={formData.maxConcurrentBookings}
                onChange={handleField('maxConcurrentBookings')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Dejar vacío = sin límite"
              />
              {formErrors.maxConcurrentBookings && (
                <p className="mt-1 text-sm text-red-600">{formErrors.maxConcurrentBookings}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {services.length === 0 && formMode === null ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No hay servicios registrados todavía.</p>
          <p className="text-sm">
            Usá el botón &quot;Agregar servicio&quot; para crear el primero.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-600">
                <th className="pb-3 pr-4 font-medium">Imagen</th>
                <th className="pb-3 pr-4 font-medium">Nombre</th>
                <th className="pb-3 pr-4 font-medium">Duración</th>
                <th className="pb-3 pr-4 font-medium">Precio</th>
                <th className="pb-3 pr-4 font-medium">Capacidad</th>
                <th className="pb-3 pr-4 font-medium">Estado</th>
                <th className="pb-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 pr-4">
                    <ServiceImage imageUrl={service.imageUrl} name={service.name} />
                  </td>
                  <td className="py-3 pr-4 font-medium text-gray-900">{service.name}</td>
                  <td className="py-3 pr-4 text-gray-600">{service.durationMinutes} min</td>
                  <td className="py-3 pr-4 text-gray-600">{formatPriceARS(service.priceCents)}</td>
                  <td className="py-3 pr-4 text-gray-600">
                    {service.maxConcurrentBookings !== null
                      ? `Cap: ${service.maxConcurrentBookings}`
                      : 'Sin límite'}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        service.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {service.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(service)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(service)}
                        className="text-gray-600 hover:text-gray-800 text-xs font-medium"
                      >
                        {service.isActive ? 'Desactivar' : 'Reactivar'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/admin/services/${service.id}/availability`)
                        }
                        className="text-purple-600 hover:text-purple-800 text-xs font-medium"
                      >
                        Gestionar disponibilidad
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ServiceImage — thumbnail or placeholder icon
// ─────────────────────────────────────────────────────────────────────────────

function ServiceImage({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  const [hasError, setHasError] = useState(false)

  if (!imageUrl || hasError) {
    return (
      <div
        aria-label="Sin imagen"
        className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 3l18 18"
          />
        </svg>
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      className="w-10 h-10 rounded object-cover"
      onError={() => setHasError(true)}
    />
  )
}
