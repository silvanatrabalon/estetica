import { useEffect, useState } from 'react'
import { buildLogoPath, validateLogoFile } from '../../lib/logoUpload'
import { getBrandSettings, saveBrandSettings } from '../../services/brand'
import { uploadMediaFile } from '../../services/adminLanding'
import { EditPopup, NotSet, SectionCard } from './SectionCard'

const inputCls =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]'

interface Brand {
  logoUrl: string
  header: string
  subtitle: string
}

/** The brand: today only the logo, in a block with its own pop-up. Self-contained: loads and saves on its own. */
export function BrandSettingsForm() {
  const [saved, setSaved] = useState<Brand>({ logoUrl: '', header: '', subtitle: '' })
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState<Brand>(saved)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [popupError, setPopupError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getBrandSettings()
      .then((brand) => {
        if (cancelled) return
        setSaved({
          logoUrl: brand.logoUrl ?? '',
          header: brand.bookingHeaderText ?? '',
          subtitle: brand.bookingSubtitleText ?? '',
        })
      })
      .catch((err) => console.warn('Failed to load brand settings:', err))
    return () => {
      cancelled = true
    }
  }, [])

  const open = () => {
    setDraft(saved)
    setLogoError(null)
    setPopupError(null)
    setSuccess(null)
    setIsOpen(true)
  }

  const close = () => setIsOpen(false)

  const handleLogoFile = async (file: File | undefined) => {
    if (!file) return
    setLogoError(null)

    const validationError = validateLogoFile(file)
    if (validationError) {
      setLogoError(validationError)
      return
    }

    setIsUploading(true)
    try {
      const publicUrl = await uploadMediaFile('media', buildLogoPath(file.name), file)
      setDraft((d) => ({ ...d, logoUrl: publicUrl }))
    } catch {
      setLogoError('No se pudo subir el logo. Intentá de nuevo.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    setPopupError(null)

    // Only the logo changes; the booking texts stored before are kept as they were
    const next: Brand = { ...saved, logoUrl: draft.logoUrl }

    setIsSaving(true)
    try {
      await saveBrandSettings({ logoUrl: next.logoUrl, bookingHeaderText: next.header, bookingSubtitleText: next.subtitle })
      setSaved(next)
      setSuccess('Logo guardado correctamente.')
      close()
    } catch {
      setPopupError('No pudimos guardar los cambios. Intentá nuevamente.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {success && (
        <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      )}

      <SectionCard title="Logo" description="Se muestra en la barra superior de la app." onEdit={open}>
        {saved.logoUrl ? (
          <img
            src={saved.logoUrl}
            alt="Logo actual"
            className="h-12 w-12 rounded-lg border border-shell-border bg-white object-contain"
          />
        ) : (
          <NotSet>Sin logo</NotSet>
        )}
      </SectionCard>

      {isOpen && (
        <EditPopup title="Editar logo" onClose={close} onSubmit={handleSave} isSaving={isSaving || isUploading} error={popupError}>
          <div>
            <label htmlFor="brand-logo-file" className="mb-1 block text-sm font-medium text-gray-700">
              Subir logo
            </label>
            {draft.logoUrl && (
              <div className="mb-2 flex items-center gap-3">
                <img
                  src={draft.logoUrl}
                  alt="Logo elegido"
                  className="h-14 w-14 rounded-lg border border-gray-200 bg-white object-contain"
                />
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, logoUrl: '' }))}
                  className="text-xs font-semibold text-red-500 hover:text-red-700 hover:underline"
                >
                  Quitar logo
                </button>
              </div>
            )}
            <input
              id="brand-logo-file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,.svg"
              disabled={isUploading}
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-lilac)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-primary"
              onChange={(e) => {
                void handleLogoFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <p className="mt-1 text-xs text-gray-400">
              {isUploading ? 'Subiendo…' : 'JPG, PNG, WEBP, GIF o SVG. Máximo 2 MB.'}
            </p>
            {logoError && <p className="mt-1 text-xs text-red-600">{logoError}</p>}
          </div>

          <div>
            <label htmlFor="brand-logo-url" className="mb-1 block text-sm font-medium text-gray-700">
              O pegá la URL del logo
            </label>
            <input
              id="brand-logo-url"
              type="url"
              className={inputCls}
              value={draft.logoUrl}
              onChange={(e) => setDraft((d) => ({ ...d, logoUrl: e.target.value }))}
              placeholder="https://…"
            />
          </div>
        </EditPopup>
      )}
    </div>
  )
}
