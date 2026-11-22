import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import {
  COUPON_THEMES,
  buildCouponSvg,
  couponFileName,
  downloadBlob,
  loadImageAsDataUrl,
  svgToPngBlob,
  type CouponImageInput,
  type CouponThemeId,
} from '../../lib/couponImage'

interface CouponImageModalProps {
  isOpen: boolean
  /** Everything but the theme (picked here) and the logo (loaded here from `logoUrl`). */
  coupon: Omit<CouponImageInput, 'theme' | 'logoDataUrl'> | null
  /** The business logo; the image goes without it if it cannot be loaded. */
  logoUrl?: string | null
  onClose: () => void
}

/** Pick a theme, see the coupon as an image and download it (PNG to share). */
export function CouponImageModal({ isOpen, coupon, logoUrl, onClose }: CouponImageModalProps) {
  const [theme, setTheme] = useState<CouponThemeId>('base')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLogoDataUrl(null)
    if (isOpen && logoUrl) {
      void loadImageAsDataUrl(logoUrl).then((data) => {
        if (!cancelled) setLogoDataUrl(data)
      })
    }
    return () => {
      cancelled = true
    }
  }, [isOpen, logoUrl])

  useEffect(() => {
    if (isOpen) {
      setError(null)
      closeRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const svg = useMemo(() => (coupon ? buildCouponSvg({ ...coupon, theme, logoDataUrl }) : ''), [coupon, theme, logoDataUrl])
  const previewSrc = useMemo(() => (svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : ''), [svg])

  if (!isOpen || !coupon) return null

  const fileName = couponFileName(coupon.code, theme)

  const downloadPng = async () => {
    setBusy(true)
    setError(null)
    try {
      downloadBlob(await svgToPngBlob(svg), `${fileName}.png`)
    } catch {
      setError('No pudimos generar la imagen en este navegador. Probá de nuevo o desde otro navegador.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coupon-image-title"
        className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-shell-border px-4 py-3">
          <h2 id="coupon-image-title" className="text-base font-semibold text-shell-text">
            Imagen del cupón {coupon.code}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg px-2 py-1 text-xl leading-none text-shell-subtleText hover:bg-shell-muted"
          >
            ×
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto p-4">
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-shell-text">Tema</legend>
            <div className="flex flex-wrap gap-2">
              {COUPON_THEMES.map((t) => (
                <label
                  key={t.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                    theme === t.id ? 'border-brand-primary bg-[var(--color-lilac)]/50 text-shell-text' : 'border-shell-border text-shell-subtleText',
                  )}
                >
                  <input
                    type="radio"
                    name="coupon-theme"
                    value={t.id}
                    checked={theme === t.id}
                    onChange={() => setTheme(t.id)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-3.5 rounded-full border border-black/10"
                    style={{ background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})` }}
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </fieldset>

          <img
            src={previewSrc}
            alt={`Vista previa del cupón ${coupon.code} con el tema ${COUPON_THEMES.find((t) => t.id === theme)?.label}`}
            className="mx-auto max-h-[52vh] w-auto rounded-xl border border-shell-border shadow-sm"
          />

          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-2 border-t border-shell-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => void downloadPng()}
            disabled={busy}
            className="flex-1 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
          >
            {busy ? 'Generando…' : 'Descargar imagen'}
          </button>
        </div>
      </div>
    </div>
  )
}
