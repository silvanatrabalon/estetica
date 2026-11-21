import { FormEvent, useEffect, useState } from 'react'
import { BOOKING_HEADER_MAX, BOOKING_SUBTITLE_MAX, DEFAULT_BOOKING_HEADER, DEFAULT_BOOKING_SUBTITLE, validateBrandTexts } from '../../lib/brand'
import { buildLogoPath, validateLogoFile } from '../../lib/logoUpload'
import { getBrandSettings, saveBrandSettings } from '../../services/brand'
import { uploadMediaFile } from '../../services/adminLanding'

const inputCls =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300'

/** Logo and booking-screen texts. Self-contained: loads and saves on its own. */
export function BrandSettingsForm() {
  const [logoUrl, setLogoUrl] = useState('')
  const [header, setHeader] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    getBrandSettings()
      .then((brand) => {
        if (cancelled) return
        setLogoUrl(brand.logoUrl ?? '')
        setHeader(brand.bookingHeaderText ?? '')
        setSubtitle(brand.bookingSubtitleText ?? '')
      })
      .catch((err) => console.warn('Failed to load brand settings:', err))
    return () => {
      cancelled = true
    }
  }, [])

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
      setLogoUrl(publicUrl)
      setFeedback({ type: 'success', message: 'Logo subido. Guardá los cambios para aplicarlo.' })
    } catch {
      setLogoError('No se pudo subir el logo. Intentá de nuevo.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFeedback(null)

    const textError = validateBrandTexts({ bookingHeaderText: header, bookingSubtitleText: subtitle })
    if (textError) {
      setFeedback({ type: 'error', message: textError })
      return
    }

    setIsSaving(true)
    try {
      await saveBrandSettings({ logoUrl, bookingHeaderText: header, bookingSubtitleText: subtitle })
      setFeedback({ type: 'success', message: 'Marca guardada correctamente.' })
    } catch {
      setFeedback({ type: 'error', message: 'No pudimos guardar los cambios. Intentá nuevamente.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5"
    >
      <div>
        <h2 className="font-semibold text-gray-700">Logo</h2>
        <p className="mt-1 text-xs text-gray-500">Se muestra en la barra superior de la app.</p>
      </div>

      {feedback && (
        <p
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {feedback.message}
        </p>
      )}

      <div>
        <label htmlFor="brand-logo-file" className="mb-1.5 block text-sm font-medium text-gray-600">
          Subir logo
        </label>
        {logoUrl && (
          <div className="mb-2 flex items-center gap-3">
            <img src={logoUrl} alt="Logo actual" className="h-14 w-14 rounded-lg border border-gray-200 object-contain bg-white" />
            <button type="button" onClick={() => setLogoUrl('')} className="text-xs font-medium text-red-600 hover:underline">
              Quitar logo
            </button>
          </div>
        )}
        <input
          id="brand-logo-file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={isUploading}
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-pink-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-pink-700 hover:file:bg-pink-100"
          onChange={(e) => {
            void handleLogoFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <p className="mt-1.5 text-xs text-gray-400">
          {isUploading ? 'Subiendo…' : 'JPG, PNG, WEBP o GIF. Máximo 2 MB.'}
        </p>
        {logoError && <p className="mt-1.5 text-xs text-red-600">{logoError}</p>}
      </div>

      <div>
        <label htmlFor="brand-logo-url" className="mb-1.5 block text-sm font-medium text-gray-600">
          O pegá la URL del logo
        </label>
        <input
          id="brand-logo-url"
          type="url"
          className={inputCls}
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://…"
        />
      </div>

      <div className="border-t border-gray-100 pt-5 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-700">Pantalla de reservas</h2>
          <p className="mt-1 text-xs text-gray-500">
            Los textos que ven tus clientes al reservar. Si los dejás vacíos se usan los predeterminados.
          </p>
        </div>
        <div>
          <label htmlFor="brand-header" className="mb-1.5 block text-sm font-medium text-gray-600">
            Título de la reserva
          </label>
          <input
            id="brand-header"
            className={inputCls}
            maxLength={BOOKING_HEADER_MAX + 20}
            value={header}
            onChange={(e) => setHeader(e.target.value)}
            placeholder={DEFAULT_BOOKING_HEADER}
          />
        </div>
        <div>
          <label htmlFor="brand-subtitle" className="mb-1.5 block text-sm font-medium text-gray-600">
            Subtítulo de la reserva
          </label>
          <input
            id="brand-subtitle"
            className={inputCls}
            maxLength={BOOKING_SUBTITLE_MAX + 20}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder={DEFAULT_BOOKING_SUBTITLE}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-600 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Guardando…' : 'Guardar marca'}
        </button>
      </div>
    </form>
  )
}
