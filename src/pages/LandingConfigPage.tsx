import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Navigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import {
  adminGetLandingConfig,
  adminUpsertLandingConfig,
  adminAddCarouselImage,
  adminRemoveCarouselImage,
  adminReorderCarouselImages,
  uploadMediaFile,
  deleteMediaFile,
} from '../services/adminLanding'
import { initSupabase } from '../lib/supabase'
import type { LandingConfig, CarouselImage } from '../services/landing'
import { RouteLoadingState } from '../components/routing'

// ─────────────────────────────────────────────────────────────────────────────
// Sortable carousel image item
// ─────────────────────────────────────────────────────────────────────────────

interface SortableImageItemProps {
  image: CarouselImage
  onDelete: (image: CarouselImage) => void
  deleting: boolean
}

function SortableImageItem({ image, onDelete, deleting }: SortableImageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  })

  const supabase = initSupabase()
  const publicUrl = supabase.storage.from('media').getPublicUrl(image.storagePath).data.publicUrl

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 shadow-sm"
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-400 hover:text-gray-600 text-xl select-none"
        aria-label="Arrastrar para reordenar"
        title="Arrastrar para reordenar"
      >
        ⠿
      </button>
      <img
        src={publicUrl}
        alt={image.altText ?? ''}
        className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 truncate">{image.storagePath}</p>
        {image.altText && <p className="text-xs text-gray-400 truncate">{image.altText}</p>}
      </div>
      <button
        type="button"
        onClick={() => onDelete(image)}
        disabled={deleting}
        className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-50 text-sm font-medium"
      >
        Eliminar
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Font options
// ─────────────────────────────────────────────────────────────────────────────

const FONT_OPTIONS = ['Inter', 'Playfair Display', 'Lato', 'Nunito', 'Raleway']

// ─────────────────────────────────────────────────────────────────────────────
// LandingConfigPage
// ─────────────────────────────────────────────────────────────────────────────

interface FormState {
  heroTitle: string
  heroSubtitle: string
  aboutText: string
  instagramUrl: string
  whatsappNumber: string
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  showHours: boolean
}

function configToFormState(config: LandingConfig): FormState {
  return {
    heroTitle: config.heroTitle ?? '',
    heroSubtitle: config.heroSubtitle ?? '',
    aboutText: config.aboutText ?? '',
    instagramUrl: config.instagramUrl ?? '',
    whatsappNumber: config.whatsappNumber ?? '',
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    fontFamily: config.fontFamily,
    showHours: config.showHours,
  }
}

export function LandingConfigPage() {
  const { activeRole, isLoading: authLoading } = useUser()

  const [config, setConfig] = useState<LandingConfig | null>(null)
  const [form, setForm] = useState<FormState>({
    heroTitle: '',
    heroSubtitle: '',
    aboutText: '',
    instagramUrl: '',
    whatsappNumber: '',
    primaryColor: '#f9a8d4',
    secondaryColor: '#fbcfe8',
    fontFamily: 'Inter',
    showHours: true,
  })
  const [images, setImages] = useState<CarouselImage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<CarouselImage | null>(null)

  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    let cancelled = false

    adminGetLandingConfig()
      .then((cfg) => {
        if (cancelled) return
        setConfig(cfg)
        setForm(configToFormState(cfg))
        setImages(cfg.carouselImages)
      })
      .catch(() => {
        if (!cancelled) setFeedback({ type: 'error', message: 'No se pudo cargar la configuración.' })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  if (authLoading) return <RouteLoadingState />
  if (activeRole !== 'admin') return <Navigate to="/unauthorized" replace />

  function handleFieldChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setForm((f) => ({ ...f, [name]: checked }))
    } else {
      setForm((f) => ({ ...f, [name]: value }))
    }
    setFeedback(null)
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)
    try {
      await adminUpsertLandingConfig({
        heroTitle: form.heroTitle || null,
        heroSubtitle: form.heroSubtitle || null,
        aboutText: form.aboutText || null,
        instagramUrl: form.instagramUrl || null,
        whatsappNumber: form.whatsappNumber || null,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        fontFamily: form.fontFamily,
        showHours: form.showHours,
      })
      setFeedback({ type: 'success', message: 'Configuración guardada correctamente.' })
    } catch {
      setFeedback({ type: 'error', message: 'No se pudo guardar la configuración. Intentá de nuevo.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setFeedback(null)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `carousel/${Date.now()}.${ext}`
      await uploadMediaFile('media', path, file)
      const image = await adminAddCarouselImage(path, null)
      setImages((prev) => [...prev, image])
    } catch {
      setFeedback({ type: 'error', message: 'No se pudo subir la imagen.' })
    } finally {
      setUploading(false)
      // Reset input
      e.target.value = ''
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteConfirm) return
    const image = deleteConfirm
    setDeleteConfirm(null)
    setDeletingId(image.id)
    try {
      await adminRemoveCarouselImage(image.id)
      await deleteMediaFile('media', image.storagePath)
      setImages((prev) => prev.filter((img) => img.id !== image.id))
    } catch {
      setFeedback({ type: 'error', message: 'No se pudo eliminar la imagen.' })
    } finally {
      setDeletingId(null)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = images.findIndex((img) => img.id === active.id)
    const newIndex = images.findIndex((img) => img.id === over.id)
    const reordered = arrayMove(images, oldIndex, newIndex)
    setImages(reordered)

    setReordering(true)
    try {
      await adminReorderCarouselImages(reordered.map((img) => img.id))
    } catch {
      setFeedback({ type: 'error', message: 'No se pudo guardar el orden de las imágenes.' })
      // Revert
      setImages(images)
    } finally {
      setReordering(false)
    }
  }

  if (loading) return <RouteLoadingState />

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Personalizar Landing</h1>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-pink-600 hover:underline font-medium"
        >
          Ver landing →
        </a>
      </div>

      {feedback && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Hero */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Sección principal (Hero)</h2>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="heroTitle">
              Título
            </label>
            <input
              id="heroTitle"
              name="heroTitle"
              type="text"
              value={form.heroTitle}
              onChange={handleFieldChange}
              placeholder="Bienvenida a nuestro espacio"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="heroSubtitle">
              Subtítulo
            </label>
            <input
              id="heroSubtitle"
              name="heroSubtitle"
              type="text"
              value={form.heroSubtitle}
              onChange={handleFieldChange}
              placeholder="Tu lugar de bienestar y belleza"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>
        </section>

        {/* About */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Sobre nosotros</h2>
          <textarea
            id="aboutText"
            name="aboutText"
            value={form.aboutText}
            onChange={handleFieldChange}
            rows={5}
            placeholder="Contá la historia de tu espacio..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-y"
          />
        </section>

        {/* Design */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Diseño</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="primaryColor">
                Color principal
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="primaryColor"
                  name="primaryColor"
                  type="color"
                  value={form.primaryColor}
                  onChange={handleFieldChange}
                  className="h-9 w-12 rounded cursor-pointer border border-gray-200"
                />
                <input
                  name="primaryColor"
                  type="text"
                  value={form.primaryColor}
                  onChange={handleFieldChange}
                  maxLength={7}
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="secondaryColor">
                Color secundario
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="secondaryColor"
                  name="secondaryColor"
                  type="color"
                  value={form.secondaryColor}
                  onChange={handleFieldChange}
                  className="h-9 w-12 rounded cursor-pointer border border-gray-200"
                />
                <input
                  name="secondaryColor"
                  type="text"
                  value={form.secondaryColor}
                  onChange={handleFieldChange}
                  maxLength={7}
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="fontFamily">
              Tipografía
            </label>
            <select
              id="fontFamily"
              name="fontFamily"
              value={form.fontFamily}
              onChange={handleFieldChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Social */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Redes sociales y contacto</h2>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="instagramUrl">
              URL de Instagram
            </label>
            <input
              id="instagramUrl"
              name="instagramUrl"
              type="url"
              value={form.instagramUrl}
              onChange={handleFieldChange}
              placeholder="https://instagram.com/tu_perfil"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="whatsappNumber">
              Número de WhatsApp
            </label>
            <input
              id="whatsappNumber"
              name="whatsappNumber"
              type="tel"
              value={form.whatsappNumber}
              onChange={handleFieldChange}
              placeholder="5491112345678"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
            <p className="mt-1 text-xs text-gray-400">
              Sin espacios ni guiones. Ejemplo: 5491112345678
            </p>
          </div>
        </section>

        {/* Hours toggle */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              id="showHours"
              name="showHours"
              type="checkbox"
              checked={form.showHours}
              onChange={handleFieldChange}
              className="w-5 h-5 accent-pink-400"
            />
            <div>
              <span className="font-semibold text-gray-700">Mostrar horarios en la landing</span>
              <p className="text-xs text-gray-400 mt-0.5">
                Muestra la sección de horarios de atención en la página pública.
              </p>
            </div>
          </label>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-pink-400 hover:bg-pink-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </form>

      {/* Carousel manager */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Carrusel de imágenes</h2>

        {images.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={images.map((img) => img.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {images.map((img) => (
                  <SortableImageItem
                    key={img.id}
                    image={img}
                    onDelete={setDeleteConfirm}
                    deleting={deletingId === img.id}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {reordering && (
          <p className="text-xs text-gray-400">Guardando nuevo orden...</p>
        )}

        {images.length === 0 && (
          <p className="text-sm text-gray-400">No hay imágenes en el carrusel.</p>
        )}

        <label className="block">
          <span className="sr-only">Subir imagen</span>
          <div className="flex items-center gap-3">
            <label
              className={`cursor-pointer inline-block bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
            >
              {uploading ? 'Subiendo...' : '+ Agregar imagen'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
            <p className="text-xs text-gray-400">JPEG, PNG o WebP — máx. 10 MB</p>
          </div>
        </label>
      </section>

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">¿Eliminar imagen?</h3>
            <p className="text-sm text-gray-500">
              Esta acción no se puede deshacer. Se eliminará la imagen del carrusel y del almacenamiento.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
