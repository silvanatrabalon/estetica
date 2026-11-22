import { ChangeEvent, useEffect, useState } from 'react'
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
import { Select } from '../components/Select'
import { EditPopup, NotSet, SectionCard } from '../components/appearance/SectionCard'

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

const FONT_OPTIONS = [
  'Inter',
  'Playfair Display',
  'Lato',
  'Nunito',
  'Raleway',
  'DM Sans',
  'Cormorant Garamond',
  'Josefin Sans',
  'Montserrat',
  'Libre Baskerville',
  'Poppins',
  'Open Sans',
  'Roboto',
  'Source Sans 3',
  'Work Sans',
  'Merriweather',
  'EB Garamond',
  'Crimson Text',
  'Cinzel',
  'Great Vibes',
  'Pacifico',
  'Dancing Script',
  'Sacramento',
  'Quicksand',
  'Outfit',
]

// ─────────────────────────────────────────────────────────────────────────────
// LandingConfigPage
// ─────────────────────────────────────────────────────────────────────────────

interface FormState {
  heroTitle: string
  heroSubtitle: string
  aboutText: string
  instagramUrl: string
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
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    fontFamily: config.fontFamily,
    showHours: config.showHours,
  }
}

type SectionKey = 'hero' | 'about' | 'design' | 'hours' | 'carousel'

const SECTION_TITLES: Record<SectionKey, string> = {
  hero: 'Sección principal',
  about: 'Sobre nosotros',
  design: 'Diseño',
  hours: 'Horarios',
  carousel: 'Carrusel de imágenes',
}

const inputCls =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]'

export function LandingConfigPage() {
  const { activeRole, isLoading: authLoading } = useUser()

  const [, setConfig] = useState<LandingConfig | null>(null)
  const [form, setForm] = useState<FormState>({
    heroTitle: '',
    heroSubtitle: '',
    aboutText: '',
    instagramUrl: '',
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
  // Which section's pop-up is open, and its working copy (the page keeps what is saved)
  const [editing, setEditing] = useState<SectionKey | null>(null)
  const [draft, setDraft] = useState<FormState | null>(null)
  const [popupError, setPopupError] = useState<string | null>(null)
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

  useEffect(() => {
    const families = FONT_OPTIONS.map((f) => f.replace(/ /g, '+')).join('&family=')
    const href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`
    if (document.querySelector(`link[href="${href}"]`)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
  }, [])

  if (authLoading) return <RouteLoadingState />
  if (activeRole !== 'admin') return <Navigate to="/unauthorized" replace />

  function openSection(key: SectionKey) {
    setDraft(form)
    setPopupError(null)
    setFeedback(null)
    setEditing(key)
  }

  function closeSection() {
    setEditing(null)
    setDraft(null)
    setPopupError(null)
  }

  function handleFieldChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    const next = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setDraft((d) => (d ? { ...d, [name]: next } : d))
  }

  async function handleSave() {
    if (!draft) return
    setSaving(true)
    setPopupError(null)
    try {
      // The draft is a copy of everything saved plus this section's edits
      await adminUpsertLandingConfig({
        heroTitle: draft.heroTitle || null,
        heroSubtitle: draft.heroSubtitle || null,
        aboutText: draft.aboutText || null,
        instagramUrl: draft.instagramUrl || null,
        primaryColor: draft.primaryColor,
        secondaryColor: draft.secondaryColor,
        fontFamily: draft.fontFamily,
        showHours: draft.showHours,
      })
      setForm(draft)
      setFeedback({ type: 'success', message: `${SECTION_TITLES[editing ?? 'hero']} guardado correctamente.` })
      closeSection()
    } catch {
      setPopupError('No se pudo guardar. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setPopupError(null)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `carousel/${Date.now()}.${ext}`
      await uploadMediaFile('media', path, file)
      const image = await adminAddCarouselImage(path, null)
      setImages((prev) => [...prev, image])
    } catch {
      setPopupError('No se pudo subir la imagen.')
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
      setPopupError('No se pudo eliminar la imagen.')
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
      setPopupError('No se pudo guardar el orden de las imágenes.')
      // Revert
      setImages(images)
    } finally {
      setReordering(false)
    }
  }

  if (loading) return <RouteLoadingState />

  const aboutPreview = form.aboutText.length > 110 ? `${form.aboutText.slice(0, 110)}…` : form.aboutText

  return (
    // Rendered inside the Apariencia page, which provides the title and layout
    <div className="space-y-3">
      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <SectionCard title="Sección principal" description="Lo primero que se ve al entrar." onEdit={() => openSection('hero')}>
        {form.heroTitle || form.heroSubtitle ? (
          <>
            <p className="font-medium">{form.heroTitle || <NotSet>Sin título</NotSet>}</p>
            <p className="text-shell-subtleText">{form.heroSubtitle || 'Sin subtítulo'}</p>
          </>
        ) : (
          <NotSet>Textos predeterminados</NotSet>
        )}
      </SectionCard>

      <SectionCard title="Sobre nosotros" description="La historia de tu espacio." onEdit={() => openSection('about')}>
        {aboutPreview ? <p className="whitespace-pre-line">{aboutPreview}</p> : <NotSet>Sin texto</NotSet>}
      </SectionCard>

      <SectionCard title="Diseño" description="Colores y tipografía de la página." onEdit={() => openSection('design')}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-4 w-4 rounded-full border border-shell-border"
              style={{ backgroundColor: form.primaryColor }}
            />
            Principal
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-4 w-4 rounded-full border border-shell-border"
              style={{ backgroundColor: form.secondaryColor }}
            />
            Secundario
          </span>
          <span style={{ fontFamily: form.fontFamily }}>{form.fontFamily}</span>
        </div>
      </SectionCard>

      <SectionCard title="Horarios" description="Los horarios de atención en la página pública." onEdit={() => openSection('hours')}>
        {form.showHours ? 'Se muestran' : <NotSet>No se muestran</NotSet>}
      </SectionCard>

      <SectionCard title="Carrusel de imágenes" description="Las fotos que rotan en la página pública." onEdit={() => openSection('carousel')}>
        {images.length === 0 ? <NotSet>Sin imágenes</NotSet> : `${images.length} ${images.length === 1 ? 'imagen' : 'imágenes'}`}
      </SectionCard>

      {editing === 'hero' && draft && (
        <EditPopup title="Editar sección principal" onClose={closeSection} onSubmit={handleSave} isSaving={saving} error={popupError}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="heroTitle">
              Título
            </label>
            <input
              id="heroTitle"
              name="heroTitle"
              type="text"
              value={draft.heroTitle}
              onChange={handleFieldChange}
              placeholder="Bienvenida a nuestro espacio"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="heroSubtitle">
              Subtítulo
            </label>
            <input
              id="heroSubtitle"
              name="heroSubtitle"
              type="text"
              value={draft.heroSubtitle}
              onChange={handleFieldChange}
              placeholder="Tu lugar de bienestar y belleza"
              className={inputCls}
            />
          </div>
        </EditPopup>
      )}

      {editing === 'about' && draft && (
        <EditPopup title="Editar sobre nosotros" onClose={closeSection} onSubmit={handleSave} isSaving={saving} error={popupError}>
          <label className="sr-only" htmlFor="aboutText">
            Sobre nosotros
          </label>
          <textarea
            id="aboutText"
            name="aboutText"
            value={draft.aboutText}
            onChange={handleFieldChange}
            rows={6}
            placeholder="Contá la historia de tu espacio..."
            className={`${inputCls} resize-y`}
          />
        </EditPopup>
      )}

      {editing === 'design' && draft && (
        <EditPopup title="Editar diseño" onClose={closeSection} onSubmit={handleSave} isSaving={saving} error={popupError}>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { name: 'primaryColor', label: 'Color principal' },
                { name: 'secondaryColor', label: 'Color secundario' },
              ] as const
            ).map((field) => (
              <div key={field.name}>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor={field.name}>
                  {field.label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={field.name}
                    name={field.name}
                    type="color"
                    value={draft[field.name]}
                    onChange={handleFieldChange}
                    className="h-9 w-10 shrink-0 cursor-pointer rounded border border-gray-200"
                  />
                  <input
                    name={field.name}
                    aria-label={`${field.label} (código)`}
                    type="text"
                    value={draft[field.name]}
                    onChange={handleFieldChange}
                    maxLength={7}
                    className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="-mt-1 text-xs text-gray-500">
            El principal tiñe la portada y los botones; el secundario, el fondo de tarjetas y acentos.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="fontFamily">
              Tipografía
            </label>
            <Select
              id="fontFamily"
              name="fontFamily"
              value={draft.fontFamily}
              onChange={(e) => setDraft((d) => (d ? { ...d, fontFamily: e.target.value } : d))}
              className={inputCls}
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </Select>
            <p
              style={{ fontFamily: draft.fontFamily, fontSize: '1.0625rem' }}
              className="mt-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-gray-600"
            >
              El rápido zorro marrón salta sobre el perro perezoso
            </p>
          </div>
        </EditPopup>
      )}

      {editing === 'hours' && draft && (
        <EditPopup title="Editar horarios" onClose={closeSection} onSubmit={handleSave} isSaving={saving} error={popupError}>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              id="showHours"
              name="showHours"
              type="checkbox"
              checked={draft.showHours}
              onChange={handleFieldChange}
              className="mt-0.5 h-5 w-5"
            />
            <span>
              <span className="block text-sm font-semibold text-gray-700">Mostrar horarios en la página pública</span>
              <span className="block text-xs text-gray-500">Muestra la sección de horarios de atención.</span>
            </span>
          </label>
        </EditPopup>
      )}

      {editing === 'carousel' && (
        <EditPopup title="Editar carrusel de imágenes" onClose={closeSection} error={popupError}>
          <p className="text-xs text-gray-500">Los cambios se aplican al momento. Arrastrá para cambiar el orden.</p>

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

          {reordering && <p className="text-xs text-gray-400">Guardando nuevo orden...</p>}

          {images.length === 0 && <p className="text-sm text-gray-400">No hay imágenes en el carrusel.</p>}

          <div className="flex items-center gap-3">
            <label
              className={`inline-block cursor-pointer rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-strong ${uploading ? 'pointer-events-none opacity-60' : ''}`}
            >
              {uploading ? 'Subiendo...' : '+ Agregar imagen'}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            <p className="text-xs text-gray-400">JPEG, PNG o WebP — máx. 10 MB</p>
          </div>
        </EditPopup>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-semibold text-gray-800">¿Eliminar imagen?</h3>
            <p className="text-sm text-gray-500">
              Esta acción no se puede deshacer. Se eliminará la imagen del carrusel y del almacenamiento.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
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
