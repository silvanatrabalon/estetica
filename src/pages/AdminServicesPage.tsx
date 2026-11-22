import { FormEvent, useEffect, useRef, useState } from 'react'
import { ActionButton, ActionRow } from '../components/ActionButton'
import { useNavigate, useParams } from 'react-router-dom'
import { ServiceAvailabilityModal } from '../components/admin/ServiceAvailabilityModal'
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
import { Tabs } from '../components/Tabs'

type FormMode = 'create' | 'edit' | null

interface FormData {
  name: string
  durationMinutes: string
  durationHours: string
  durationMins: string
  priceCents: string
  imageUrl: string | null
  maxConcurrentBookings: string
  description: string
  categoryId: string
}

const EMPTY_FORM: FormData = {
  name: '',
  durationMinutes: '',
  durationHours: '0',
  durationMins: '30',
  priceCents: '0',
  imageUrl: null,
  // New services default to one booking at a time; clearing the field means unlimited
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

  const duration = Number(data.durationHours) * 60 + Number(data.durationMins)
  if (!Number.isInteger(duration) || duration < 1 || duration > 480) {
    errors.durationMinutes = 'La duración debe ser entre 1 y 480 minutos (hasta 8 horas).'
  }

  const price = Number(data.priceCents)
  if (isNaN(price) || price < 0) {
    errors.priceCents = 'El precio debe ser un número mayor o igual a cero.'
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
  // "Disponibilidad" opens a pop-up over the list; /admin/services/:serviceId/availability opens it directly
  const { serviceId: routeServiceId } = useParams<{ serviceId: string }>()
  const [availabilityServiceId, setAvailabilityServiceId] = useState<string | null>(routeServiceId ?? null)
  const closeAvailability = () => {
    setAvailabilityServiceId(null)
    if (routeServiceId) navigate('/admin/services', { replace: true })
  }
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

  const [tab, setTab] = useState<'services' | 'categories'>('services')
  // 'all' shows every service (also the ones without category), 'none' only those without one
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  // Creating a category without leaving the service form
  const [isInlineCategoryOpen, setIsInlineCategoryOpen] = useState(false)
  const [inlineCategoryName, setInlineCategoryName] = useState('')
  const [inlineCategoryError, setInlineCategoryError] = useState<string | null>(null)
  const [isSavingInlineCategory, setIsSavingInlineCategory] = useState(false)

  const [formMode, setFormMode] = useState<FormMode>(null)
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<ValidationErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  // Image upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Escape closes the pop-up (not while it is saving or uploading)
  useEffect(() => {
    if (formMode === null) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving && !isUploading) closeForm()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formMode, isSaving, isUploading])

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
      durationHours: String(Math.floor(service.durationMinutes / 60)),
      durationMins: String(service.durationMinutes % 60),
      priceCents: String(service.priceCents / 100),
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
    setIsInlineCategoryOpen(false)
    setInlineCategoryName('')
    setInlineCategoryError(null)
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
          durationMinutes: Number(formData.durationHours) * 60 + Number(formData.durationMins),
          priceCents: Math.round(Number(formData.priceCents) * 100),
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
          durationMinutes: Number(formData.durationHours) * 60 + Number(formData.durationMins),
          priceCents: Math.round(Number(formData.priceCents) * 100),
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
    showConfirm(
      service.isActive ? 'Desactivar servicio' : 'Reactivar servicio',
      service.isActive
        ? 'Este servicio no aparecerá en el sistema de turnos y los clientes no podrán reservarlo. Los turnos existentes no se cancelan automáticamente.'
        : `¿Confirmás reactivar el servicio "${service.name}"?`,
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

  const NEW_CATEGORY_VALUE = '__new__'

  const handleCategorySelect = (value: string) => {
    if (value === NEW_CATEGORY_VALUE) {
      setIsInlineCategoryOpen(true)
      setInlineCategoryError(null)
      return
    }
    setIsInlineCategoryOpen(false)
    setFormData((prev) => ({ ...prev, categoryId: value }))
  }

  const handleCreateInlineCategory = async () => {
    const trimmed = inlineCategoryName.trim()
    if (!trimmed) {
      setInlineCategoryError('Escribí el nombre de la categoría.')
      return
    }
    setIsSavingInlineCategory(true)
    setInlineCategoryError(null)
    try {
      const created = await adminCreateCategory(trimmed, categories.length)
      setCategories((prev) => [...prev, created])
      setFormData((prev) => ({ ...prev, categoryId: created.id }))
      setIsInlineCategoryOpen(false)
      setInlineCategoryName('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setInlineCategoryError(
        msg.includes('unique') || msg.includes('duplicate') || msg.toLowerCase().includes('ya existe')
          ? 'Ya existe una categoría con ese nombre.'
          : 'No se pudo crear la categoría.',
      )
    } finally {
      setIsSavingInlineCategory(false)
    }
  }

  const visibleServices = services.filter((svc) =>
    categoryFilter === 'all' ? true : categoryFilter === 'none' ? !svc.categoryId : svc.categoryId === categoryFilter,
  )

  const handleUpdateCategory = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return
    const trimmed = editCategoryName.trim()
    if (!trimmed) return
    setCategoryError(null)
    setCategorySuccess(null)
    setIsSavingCategory(true)
    try {
      const updated = await adminUpdateCategory(editingCategory.id, trimmed, editingCategory.displayOrder)
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      setEditingCategory(null)
      setEditCategoryName('')
      setCategorySuccess('Categoría actualizada.')
    } catch {
      setCategoryError('No se pudo actualizar la categoría.')
    } finally {
      setIsSavingCategory(false)
    }
  }

  const categoryModalOpen = isCategoryFormOpen || editingCategory !== null
  const closeCategoryModal = () => {
    setIsCategoryFormOpen(false)
    setNewCategoryName('')
    setEditingCategory(null)
    setEditCategoryName('')
    setCategoryError(null)
  }

  // Escape closes the category pop-up (not while it is saving)
  useEffect(() => {
    if (!categoryModalOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSavingCategory) closeCategoryModal()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryModalOpen, isSavingCategory])

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

  const categoryFilterOptions = [
    { value: 'all', label: 'Todos' },
    ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
    { value: 'none', label: 'Sin categoría' },
  ]

  return (
    <>
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-semibold text-shell-text">Servicios</h1>

        <Tabs
          ariaLabel="Servicios y categorías"
          active={tab}
          onChange={setTab}
          tabs={[
            { key: 'services', label: 'Servicios' },
            { key: 'categories', label: 'Categorías' },
          ]}
        />

        {errorMessage && formMode === null && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        {tab === 'services' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <Listbox
                  id="service-category-filter"
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={categoryFilterOptions}
                />
              </div>
              <button
                type="button"
                onClick={openCreateForm}
                className="shrink-0 rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:bg-brand-strong transition-colors"
              >
                + Agregar servicio
              </button>
            </div>

      {formMode !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-form-title"
          className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl"
        >
          <h2 id="service-form-title" className="mb-3 text-base font-semibold text-shell-text">
            {formMode === 'create' ? 'Nuevo servicio' : 'Editar servicio'}
          </h2>
          <form onSubmit={(e) => void handleFormSubmit(e)} noValidate className="space-y-3">
            <div className="grid grid-cols-[minmax(0,1fr)_8.5rem] items-start gap-3">
              <div>
                <label htmlFor="service-name" className="mb-1 block text-sm font-medium text-gray-700">
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
                {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
              </div>

              <div>
                <label htmlFor="service-category" className="mb-1 block text-sm font-medium text-gray-700">
                  Categoría
                </label>
                <Listbox
                  id="service-category"
                  value={isInlineCategoryOpen ? NEW_CATEGORY_VALUE : formData.categoryId}
                  onChange={handleCategorySelect}
                  options={[
                    { value: '', label: 'Sin categoría' },
                    ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
                    { value: NEW_CATEGORY_VALUE, label: '+ Crear categoría nueva' },
                  ]}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-start gap-3">
              <label className="w-16 shrink-0">
                <span className="text-xs font-medium text-gray-600">Horas</span>
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={formData.durationHours}
                  onChange={handleField('durationHours')}
                  className="mt-1 w-full border border-gray-300 rounded-md px-2 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </label>
              <label className="w-16 shrink-0">
                <span className="text-xs font-medium text-gray-600">Minutos</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={formData.durationMins}
                  onChange={handleField('durationMins')}
                  className="mt-1 w-full border border-gray-300 rounded-md px-2 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="30"
                />
              </label>
              <div className="min-w-[8rem] flex-1">
                <label htmlFor="service-price" className="text-xs font-medium text-gray-600">
                  Precio ($)
                </label>
                <input
                  id="service-price"
                  type="number"
                  min="0"
                  step="any"
                  value={formData.priceCents}
                  onChange={handleField('priceCents')}
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 20000"
                />
              </div>
              {formErrors.durationMinutes && (
                <p className="basis-full text-sm text-red-600">{formErrors.durationMinutes}</p>
              )}
              {formData.priceCents !== '' && !formErrors.priceCents && (
                <p className="basis-full text-xs text-gray-500">
                  Vista previa: {formatPriceARS(Math.round(Number(formData.priceCents) * 100))}
                </p>
              )}
              {formErrors.priceCents && (
                <p className="basis-full text-sm text-red-600">{formErrors.priceCents}</p>
              )}
            </div>

            <div>
              <label htmlFor="service-description" className="mb-1 block text-sm font-medium text-gray-700">
                Descripción <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <textarea
                id="service-description"
                value={formData.description}
                onChange={handleField('description')}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describí el servicio para tus clientes..."
              />
            </div>

            {isInlineCategoryOpen && (
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <input
                    autoFocus
                    aria-label="Nombre de la nueva categoría"
                    value={inlineCategoryName}
                    onChange={(e) => setInlineCategoryName(e.target.value)}
                    placeholder="Nombre de la categoría"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {inlineCategoryError && <p className="mt-1 text-sm text-red-600">{inlineCategoryError}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => void handleCreateInlineCategory()}
                  disabled={isSavingInlineCategory}
                  className="rounded-md bg-brand-primary px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                >
                  {isSavingInlineCategory ? 'Creando...' : 'Crear categoría'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsInlineCategoryOpen(false)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* Image upload — only available in edit mode */}
            <div>
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


            <details
              open={formData.maxConcurrentBookings !== '' || !!formErrors.maxConcurrentBookings ? true : undefined}
              className="rounded-md border border-gray-200 px-3 py-2"
            >
              <summary className="cursor-pointer text-sm font-medium text-gray-700">Opciones avanzadas</summary>
              <div className="mt-3">
                <label htmlFor="service-capacity" className="mb-1 block text-sm font-medium text-gray-700">
                  Límite por recurso compartido <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <input
                  id="service-capacity"
                  type="number"
                  min="1"
                  value={formData.maxConcurrentBookings}
                  onChange={handleField('maxConcurrentBookings')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Vacío = lo limitan las agendas"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Normalmente se deja vacío: cada profesional atiende un cliente a la vez y la capacidad sale de sus agendas. Completalo solo si hay algo compartido que limita, como una única cabina o un solo aparato. Ej: Camilla solar.
                </p>
                {formErrors.maxConcurrentBookings && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.maxConcurrentBookings}</p>
                )}
              </div>
            </details>

            {errorMessage && (
              <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            )}

            <div className="flex gap-3 pt-1">
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
                disabled={isSaving || isUploading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
        </div>
      )}

            {services.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <p className="mb-2 text-lg">No hay servicios registrados todavía.</p>
                <p className="text-sm">Usá el botón &quot;Agregar servicio&quot; para crear el primero.</p>
              </div>
            ) : visibleServices.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">No hay servicios en esta categoría.</div>
            ) : (
              <>
          {/* Cards on every screen size (no table on desktop) */}
          <div className="max-w-2xl space-y-3">
            {visibleServices.map((service) => (
              <div key={service.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{service.name}</p>
                    {service.categoryName && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                        {service.categoryName}
                      </span>
                    )}
                  </div>
                  <span
                    className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                      service.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {service.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="mt-2 flex gap-4 text-sm text-gray-500">
                  <span>{service.durationMinutes} min</span>
                  <span>{formatPriceARS(service.priceCents)}</span>
                </div>
                <ActionRow className="mt-3">
                  <ActionButton onClick={() => openEditForm(service)}>Editar</ActionButton>
                  <ActionButton onClick={() => setAvailabilityServiceId(service.id)}>Disponibilidad</ActionButton>
                  <ActionButton tone="neutral" onClick={() => handleToggleActive(service)}>
                    {service.isActive ? 'Desactivar' : 'Reactivar'}
                  </ActionButton>
                </ActionRow>
              </div>
            ))}
          </div>

              </>
            )}
          </div>
        )}

        {tab === 'categories' && (
          <section className="shell-surface rounded-2xl border p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm text-shell-subtleText">Agrupan los servicios en la página de reservas.</p>
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null)
                  setNewCategoryName('')
                  setIsCategoryFormOpen(true)
                  setCategoryError(null)
                  setCategorySuccess(null)
                }}
                className="shrink-0 rounded-lg border border-shell-border px-3 py-1.5 text-xs font-medium text-shell-text hover:bg-shell-muted transition-colors"
              >
                + Nueva categoría
              </button>
            </div>
            {categoryError && !categoryModalOpen && <p className="mb-2 text-sm text-red-600">{categoryError}</p>}
            {categorySuccess && <p className="mb-2 text-sm text-emerald-600">{categorySuccess}</p>}

            {categories.length === 0 && (
              <p className="text-sm text-shell-subtleText italic">Sin categorías todavía.</p>
            )}

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center gap-0.5 rounded-full bg-shell-muted py-1 pl-3 pr-1 text-sm text-shell-text"
                >
                  {cat.name}
                  <button
                    type="button"
                    aria-label={`Editar ${cat.name}`}
                    title="Editar"
                    onClick={() => {
                      setIsCategoryFormOpen(false)
                      setEditingCategory(cat)
                      setEditCategoryName(cat.name)
                      setCategoryError(null)
                      setCategorySuccess(null)
                    }}
                    className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-shell-subtleText transition-colors hover:bg-white hover:text-shell-text"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label={`Eliminar ${cat.name}`}
                    title="Eliminar"
                    onClick={() => void handleDeleteCategory(cat.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-shell-subtleText transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </section>
        )}
      </div>

      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-4">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-form-title"
            noValidate
            onSubmit={(e) => void (editingCategory ? handleUpdateCategory(e) : handleCreateCategory(e))}
            className="max-h-[92dvh] w-full max-w-sm space-y-3 overflow-y-auto rounded-t-2xl bg-white p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl"
          >
            <h2 id="category-form-title" className="text-base font-semibold text-shell-text">
              {editingCategory ? 'Editar categoría' : 'Nueva categoría'}
            </h2>
            <div>
              <label htmlFor="category-name" className="mb-1 block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <input
                id="category-name"
                autoFocus
                value={editingCategory ? editCategoryName : newCategoryName}
                onChange={(e) => (editingCategory ? setEditCategoryName(e.target.value) : setNewCategoryName(e.target.value))}
                placeholder="Ej: Manos"
                autoComplete="off"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {categoryError && (
              <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {categoryError}
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={isSavingCategory || !(editingCategory ? editCategoryName : newCategoryName).trim()}
                className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-50"
              >
                {isSavingCategory ? 'Guardando...' : editingCategory ? 'Guardar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={closeCategoryModal}
                disabled={isSavingCategory}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {availabilityServiceId && (
        <ServiceAvailabilityModal
          key={availabilityServiceId}
          serviceId={availabilityServiceId}
          serviceName={services.find((s) => s.id === availabilityServiceId)?.name}
          onClose={closeAvailability}
        />
      )}

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
