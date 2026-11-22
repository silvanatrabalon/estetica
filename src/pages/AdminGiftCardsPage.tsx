import { useEffect, useMemo, useState } from 'react'
import { cn } from '../lib/cn'
import { Listbox } from '../components/Listbox'
import { listServices, type Service } from '../services/adminServices'
import { getBusinessSettings } from '../services/businessSettings'
import { downloadBlob, svgToPngBlob } from '../lib/couponImage'
import { loadBrandMark, type BrandMark } from '../lib/brandMark'
import {
  GIFT_CARD_HEIGHT,
  GIFT_CARD_THEMES,
  GIFT_CARD_WIDTH,
  buildGiftCardSvg,
  giftCardFileName,
  giftValidityText,
  type GiftCardThemeId,
} from '../lib/giftCardImage'

type GiftKind = 'service' | 'amount'

interface FormErrors {
  recipient?: string
  service?: string
  amount?: string
}

const fieldCls =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

/** Admin: fill in a gift card (for whom, from whom, service or amount) and download it as an image. */
export function AdminGiftCardsPage() {
  const [services, setServices] = useState<Service[]>([])
  const [businessName, setBusinessName] = useState('')
  const [logoMark, setLogoMark] = useState<BrandMark | null>(null)

  const [recipient, setRecipient] = useState('')
  const [sender, setSender] = useState('')
  const [kind, setKind] = useState<GiftKind>('service')
  const [serviceId, setServiceId] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [theme, setTheme] = useState<GiftCardThemeId>('rosa')

  const [errors, setErrors] = useState<FormErrors>({})
  const [busy, setBusy] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  useEffect(() => {
    listServices()
      .then((all) => setServices(all.filter((s) => s.isActive)))
      .catch(() => {
        // The service list stays empty: the amount option still works
      })
    getBusinessSettings()
      .then((settings) => {
        setBusinessName(settings.name)
      })
      .catch(() => {
        // The card goes without the business name
      })
    // The SB mark; the card goes without it if the file cannot be read
    void loadBrandMark().then(setLogoMark)
  }, [])

  const selectedService = services.find((s) => s.id === serviceId)
  const amountCents = Math.round(Number(amount) * 100)

  const svg = useMemo(
    () =>
      buildGiftCardSvg({
        theme,
        recipient: recipient.trim() || 'Nombre de la persona',
        sender,
        gift:
          kind === 'service'
            ? { kind: 'service', name: selectedService?.name ?? 'Servicio de regalo' }
            : { kind: 'amount', cents: Number.isFinite(amountCents) && amountCents > 0 ? amountCents : 0 },
        message,
        validity: giftValidityText(validUntil),
        businessName,
        logoMark,
      }),
    [theme, recipient, sender, kind, selectedService, amountCents, message, validUntil, businessName, logoMark],
  )
  const previewSrc = useMemo(() => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, [svg])

  const validate = (): FormErrors => {
    const found: FormErrors = {}
    if (!recipient.trim()) found.recipient = 'Escribí para quién es la gift card.'
    if (kind === 'service' && !selectedService) found.service = 'Elegí el servicio.'
    if (kind === 'amount' && !(Number.isFinite(amountCents) && amountCents > 0)) found.amount = 'Ingresá un monto mayor a cero.'
    return found
  }

  const download = async () => {
    const found = validate()
    setErrors(found)
    setDownloadError(null)
    if (Object.keys(found).length > 0) return

    setBusy(true)
    try {
      const blob = await svgToPngBlob(svg, 1, GIFT_CARD_WIDTH, GIFT_CARD_HEIGHT)
      downloadBlob(blob, `${giftCardFileName(recipient)}.png`)
    } catch {
      setDownloadError('No pudimos generar la imagen en este navegador. Probá de nuevo o desde otro navegador.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-shell-text">Gift Card</h1>
        <p className="text-sm text-shell-subtleText">
          Completá los datos y descargá la gift card como imagen para regalarla.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void download()
          }}
          className="space-y-3 rounded-2xl border border-shell-border bg-white p-4 shadow-sm"
        >
          <div>
            <label htmlFor="gc-recipient" className="mb-1 block text-sm font-medium text-gray-700">
              Para
            </label>
            <input
              id="gc-recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Nombre de quien la recibe"
              maxLength={60}
              aria-invalid={errors.recipient ? true : undefined}
              className={fieldCls}
            />
            {errors.recipient && <p className="mt-1 text-sm text-red-600">{errors.recipient}</p>}
          </div>

          <div>
            <label htmlFor="gc-sender" className="mb-1 block text-sm font-medium text-gray-700">
              De parte de <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              id="gc-sender"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="Quien la regala"
              maxLength={60}
              className={fieldCls}
            />
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-gray-700">Qué se regala</legend>
            <div className="mb-2 flex gap-2">
              {(
                [
                  ['service', 'Un servicio'],
                  ['amount', 'Un monto'],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={cn(
                    'flex flex-1 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm',
                    kind === value ? 'border-brand-primary bg-[var(--color-lilac)]/40 font-semibold' : 'border-shell-border',
                  )}
                >
                  <input
                    type="radio"
                    name="gc-kind"
                    checked={kind === value}
                    onChange={() => setKind(value)}
                    className="h-4 w-4"
                  />
                  {label}
                </label>
              ))}
            </div>
            {kind === 'service' ? (
              <div>
                <label htmlFor="gc-service" className="sr-only">
                  Servicio
                </label>
                <Listbox
                  id="gc-service"
                  value={serviceId}
                  onChange={setServiceId}
                  placeholder="Elegí el servicio"
                  options={services.map((s) => ({ value: s.id, label: s.name }))}
                />
                {errors.service && <p className="mt-1 text-sm text-red-600">{errors.service}</p>}
              </div>
            ) : (
              <div>
                <label htmlFor="gc-amount" className="sr-only">
                  Monto ($)
                </label>
                <input
                  id="gc-amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Monto en pesos"
                  aria-invalid={errors.amount ? true : undefined}
                  className={fieldCls}
                />
                {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
              </div>
            )}
          </fieldset>

          <div>
            <label htmlFor="gc-message" className="mb-1 block text-sm font-medium text-gray-700">
              Mensaje <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              id="gc-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={120}
              rows={2}
              placeholder="Una dedicatoria corta"
              className={fieldCls}
            />
          </div>

          <div>
            <label htmlFor="gc-valid" className="mb-1 block text-sm font-medium text-gray-700">
              Válida hasta <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              id="gc-valid"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="dt-field"
            />
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-gray-700">Estilo</legend>
            <div className="flex flex-wrap gap-2">
              {GIFT_CARD_THEMES.map((t) => (
                <label
                  key={t.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                    theme === t.id ? 'border-brand-primary bg-[var(--color-lilac)]/50 text-shell-text' : 'border-shell-border text-shell-subtleText',
                  )}
                >
                  <input
                    type="radio"
                    name="gc-theme"
                    value={t.id}
                    checked={theme === t.id}
                    onChange={() => setTheme(t.id)}
                    className="sr-only"
                  />
                  <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: t.swatch }} />
                  {t.label}
                </label>
              ))}
            </div>
          </fieldset>

          {downloadError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {downloadError}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
          >
            {busy ? 'Generando…' : 'Descargar imagen'}
          </button>
        </form>

        <div className="rounded-2xl border border-shell-border bg-white p-3 shadow-sm lg:self-start">
          <img
            src={previewSrc}
            alt="Vista previa de la gift card"
            className="w-full rounded-lg border border-shell-border"
          />
        </div>
      </div>
    </div>
  )
}
