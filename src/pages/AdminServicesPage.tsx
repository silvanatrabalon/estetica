import { FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatPriceARS } from '../lib/formatPrice'
import {
  createService,
  listServices,
  setServiceActive,
  updateService,
  type Service,
} from '../services/adminServices'
import {
  adminListCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  type ServiceCategory,
} from '../services/adminCategories'
import { uploadMediaFile, deleteMediaFile } from '../services/adminLanding'
import { ConfirmModal } from '../components/ConfirmModal'
import { Listbox } from '../components/Listbox'

type FormMode = 'create' | 'edit' | null

interface FormData {
  name: string
  durationMinutes: string
  priceCents: string
  imageUrl: string | null
  maxConcurrentBookings: string
  description: string
  categoryId: string
}

const EMPTY_FORM: FormData = {
  name: '',
  durationMinutes: '',
  priceCents: '0',
  imageUrl: null,
  maxConcurrentBookings: '',
  description: '',
  categoryId: '',
}

interface ValidationErrors {
  name?: string
  durationMinutes?: string
  priceCents?: string
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

  // Category state
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [categorySuccess, setCategorySuccess] = useState<string | null>(null)

  const [formMode, setFormMode] = useState<FormMode>(null)
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<ValidationErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  // Image upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLDivElement>(null)

  // Confirm modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    message: string
    title: string
    destructive: boolean
    onConfirm: () => void
  }>({ isOpen: false, message: '', title: 'Confirmar', destructive: false, onConfirm: () => {} })

  const showConfirm = (title: string, message: string, onConfirm: () => void, destructive = false) => {
    setConfirmState({ isOpen: true, title, message, destructive, onConfirm })
  }

  const closeConfirm = () => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }))
  }

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

  const loadCategories = async () => {
    try {
      const data = await adminListCategories()
      setCategories(data)
    } catch {
      // Non-critical: categories will simply be empty
    }
  }

  useEffect(() => {
    void loadServices()
    void loadCategories()
  }, [])

  useEffect(() => {
    if (formMode !== null && formRef.current) {
      formRef.current.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    }
  }, [formMode])

  const openCreateForm = () => {
    setFormMode('create')
    setEditingServiceId(null)
    setFormData(EMPTY_FORM)
    setFormErrors({})
    setSuccessMessage(null)
    setErrorMessage(null)
    setUploadError(null)
  }

  const openEditForm = (service: Service) => {
    setFormMode('edit')
    setEditingServiceId(service.id)
    setFormData({
      name: service.name,
      durationMinutes: String(service.durationMinutes),
      priceCents: String(service.priceCents),
      imageUrl: service.imageUrl,
      maxConcurrentBookings:
        service.maxConcurrentBookings !== null ? String(service.maxConcurrentBookings) : '',
      description: service.description ?? '',
      categoryId: service.categoryId ?? '',
    })
    setFormErrors({})
    setSuccessMessage(null)
    setErrorMessage(null)
    setUploadError(null)
  }

  const closeForm = () => {
    setFormMode(null)
    setEditingServiceId(null)
    setFormData(EMPTY_FORM)
    setFormErrors({})
    setUploadError(null)
  }

  const handleField =
    (field: keyof Omit<FormData, 'imageUrl'>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    }

  const handleImageUpload = async (file: File) => {
    if (!editingServiceId) return
    setIsUploading(true)
    setUploadError(null)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `services/${editingServiceId}.${ext}`
    try {
      const publicUrl = await uploadMediaFile('media', path, file)
      setFormData((prev) => ({ ...prev, imageUrl: publicUrl }))
    } catch {
      setUploadError('No se pudo subir la imagen. Intentá de nuevo.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!editingServiceId || !formData.imageUrl) return
    setIsUploading(true)
    setUploadError(null)
    const url = formData.imageUrl
    const match = url.match(/\/object\/public\/media\/(.+)$/)
    const path = match ? match[1] : `services/${editingServiceId}`
    try {
      await deleteMediaFile('media', path)
      setFormData((prev) => ({ ...prev, imageUrl: null }))
    } catch {
      setUploadError('No se pudo eliminar la imagen. Intentá de nuevo.')
    } finally {
      setIsUploading(false)
    }
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

    const maxConcurrentBookings =
      formData.maxConcurrentBookings.trim() === ''
        ? null
        : Number(formData.maxConcurrentBookings)
    const description = formData.description.trim() === '' ? null : formData.description.trim()
    const categoryId = formData.categoryId === '' ? null : formData.categoryId

    try {
      if (formMode === 'create') {
        const created = await createService({
          name: formData.name.trim(),
          durationMinutes: Number(formData.durationMinutes),
          priceCents: Number(formData.priceCents),
          imageUrl: formData.imageUrl,
          maxConcurrentBookings,
          description,
          categoryId,
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
          imageUrl: formData.imageUrl,
          maxConcurrentBookings,
          description,
          categoryId,
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

  const handleToggleActive = (service: Service) => {
    const action = service.isActive ? 'desactivar' : 'reactivar'
    showConfirm(
      service.isActive ? 'Desactivar servicio' : 'Reactivar servicio',
      `¿Confirmás ${action} el servicio "${service.name}"?`,
      async () => {
        closeConfirm()
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
      },
    )
  }

  const handleCreateCategory = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = newCategoryName.trim()
    if (!trimmed) return
    setIsSavingCategory(true)
    setCategoryError(null)
    setCategorySuccess(null)
    try {
      const created = await adminCreateCategory(trimmed, categories.length)
      setCategories((prev) => [...prev, created])
      setNewCategoryName('')
      setIsCategoryFormOpen(false)
      setCategorySuccess('Categoría creada correctamente.')
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : err !== null && typeof err === 'object' && 'message' in err
            ? String((err as { message: unknown }).message)
            : ''
      if (msg.includes('unique') || msg.includes('duplicate') || msg.toLowerCase().includes('ya existe')) {
        setCategoryError('Ya existe una categoría con ese nombre.')
      } else {
        setCategoryError('No se pudo crear la categoría.')
      }
    } finally {
      setIsSavingCategory(false)
    }
  }

  const handleUpdateCategory = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return
    const trimmed = editCategoryName.trim()
    if (!trimmed) return
    setCategoryError(null)
    setCategorySuccess(null)
    try {
      const updated = await adminUpdateCategory(editingCategory.id, trimmed, editingCategory.displayOrder)
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      setEditingCategory(null)
      setEditCategoryName('')
      setCategorySuccess('Categoría actualizada.')
    } catch {
      setCategoryError('No se pudo actualizar la categoría.')
    }
  }

  const handleDeleteCategory = (id: string) => {
    const cat = categories.find((c) => c.id === id)
    showConfirm(
      'Eliminar categoría',
      `¿Eliminás la categoría “${cat?.name ?? ''}”? Esta acción no se puede deshacer.`,
      async () => {
        closeConfirm()
        setCategoryError(null)
        setCategorySuccess(null)
        try {
          await adminDeleteCategory(id)
          setCategories((prev) => prev.filter((c) => c.id !== id))
          setCategorySuccess('Categoría eliminada.')
        } catch (err) {
          const msg =
            err instanceof Error
              ? err.message
              : err !== null && typeof err === 'object' && 'message' in err
                ? String((err as { message: unknown }).message)
                : ''
          if (msg.includes('servicios asignados')) {
            setCategoryError(msg)
          } else {
            setCategoryError('No se pudo eliminar la categoría.')
          }
        }
      },
      true,
    )
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Cargando servicios...</p>
      </div>
    )
  }

  return (
    <>
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

      {/* ── Categorías ───────────────────────────────────────────── */}
      <div className="mb-6 p-4 border border-gray-200 rounded-md bg-white">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h2 className="text-base font-medium text-gray-800 flex-shrink-0">Categorías</h2>
          {!isCategoryFormOpen && !editingCategory && (
            <button
              type="button"
              onClick={() => { setIsCategoryFormOpen(true); setCategoryError(null); setCategorySuccess(null) }}
              className="text-xs px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 text-gray-700 font-medium whitespace-nowrap"
            >
              + Nueva categoría
            </button>
          )}
        </div>

        {categoryError && (
          <p className="mb-2 text-sm text-red-600">{categoryError}</p>
        )}
        {categorySuccess && (
          <p className="mb-2 text-sm text-green-600">{categorySuccess}</p>
        )}

        {categories.length === 0 && !isCategoryFormOpen && (
          <p className="text-sm text-gray-400 italic">Sin categorías todavía.</p>
        )}

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) =>
            editingCategory?.id === cat.id ? (
              <form
                key={cat.id}
                onSubmit={(e) => void handleUpdateCategory(e)}
                className="flex flex-wrap items-center gap-2 w-full sm:w-auto"
              >
                <input
                  autoFocus
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  className="flex-1 min-w-0 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-1">
                  <button type="submit" className="text-xs px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Guardar
                  </button>
                  <button type="button" onClick={() => setEditingCategory(null)} className="text-xs px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-100">
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <span key={cat.id} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                {cat.name}
                <button
                  type="button"
                  aria-label={`Editar ${cat.name}`}
                  onClick={() => { setEditingCategory(cat); setEditCategoryName(cat.name); setCategoryError(null); setCategorySuccess(null) }}
                  className="text-gray-400 hover:text-gray-700 ml-1 leading-none"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  aria-label={`Eliminar ${cat.name}`}
                  onClick={() => void handleDeleteCategory(cat.id)}
                  className="text-gray-400 hover:text-red-500 leading-none"
                >
                  ✕
                </button>
              </span>
            )
          )}
        </div>

        {isCategoryFormOpen && (
          <form
            onSubmit={(e) => void handleCreateCategory(e)}
            className="flex flex-col sm:flex-row gap-2 mt-3"
          >
            <input
              autoFocus
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nombre de la categoría..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSavingCategory || !newCategoryName.trim()}
                className="flex-1 sm:flex-none text-xs px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSavingCategory ? 'Guardando...' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => { setIsCategoryFormOpen(false); setNewCategoryName('') }}
                className="flex-1 sm:flex-none text-xs px-4 py-1.5 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {formMode !== null && (
        <div ref={formRef} className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
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

            {/* Description */}
            <div className="mb-4">
              <label
                htmlFor="service-description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Descripción{' '}
                <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                id="service-description"
                value={formData.description}
                onChange={handleField('description')}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describí el servicio para tus clientes..."
              />
            </div>

            {/* Category */}
            {categories.length > 0 && (
              <div className="mb-4 w-full">
                <label
                  htmlFor="service-category"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Categoría{' '}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <Listbox
                  id="service-category"
                  value={formData.categoryId}
                  onChange={(val) => setFormData((prev) => ({ ...prev, categoryId: val }))}
                  options={[
                    { value: '', label: 'Sin categoría' },
                    ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
                  ]}
                />
              </div>
            )}

            {/* Image upload — only available in edit mode */}
            <div className="mb-4">
              <p className="block text-sm font-medium text-gray-700 mb-1">
                Imagen{' '}
                <span className="text-gray-400 font-normal">(opcional)</span>
              </p>

              {formMode === 'create' && (
                <p className="text-xs text-gray-500 italic">
                  Podés subir una imagen después de crear el servicio.
                </p>
              )}

              {formMode === 'edit' && (
                <div>
                  <ServiceImagePreview imageUrl={formData.imageUrl} />

                  {uploadError && (
                    <p className="mt-1 text-sm text-red-600">{uploadError}</p>
                  )}

                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      {isUploading ? 'Subiendo...' : 'Subir imagen'}
                    </button>
                    {formData.imageUrl && (
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => void handleRemoveImage()}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50"
                      >
                        Eliminar imagen
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    aria-label="Subir imagen"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void handleImageUpload(file)
                      e.target.value = ''
                    }}
                  />
                </div>
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
                disabled={isSaving || isUploading}
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
                <th className="pb-3 pr-4 font-medium">Categoría</th>
                <th className="pb-3 pr-4 font-medium">Descripción</th>
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
                  <td className="py-3 pr-4 text-gray-500 text-xs">
                    {service.categoryName ?? <span className="text-gray-300 italic">Sin categoría</span>}
                  </td>
                  <td className="py-3 pr-4 text-gray-500 max-w-xs">
                    {service.description ? (
                      <span className="line-clamp-2 text-xs">{service.description}</span>
                    ) : (
                      <span className="text-gray-300 text-xs italic">Sin descripción</span>
                    )}
                  </td>
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
                        onClick={() => handleToggleActive(service)}
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

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        destructive={confirmState.destructive}
        confirmLabel="Confirmar"
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />
    </>
  )
}

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

// ─────────────────────────────────────────────────────────────────────────────
// ServiceImagePreview — larger thumbnail for the edit form
// ─────────────────────────────────────────────────────────────────────────────

function ServiceImagePreview({ imageUrl }: { imageUrl: string | null }) {
  const [hasError, setHasError] = useState(false)

  if (!imageUrl || hasError) {
    return (
      <div
        aria-label="Sin imagen"
        className="w-24 h-24 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8"
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
      alt="Imagen del servicio"
      className="w-24 h-24 rounded-md object-cover border border-gray-200"
      onError={() => setHasError(true)}
    />
  )
}
