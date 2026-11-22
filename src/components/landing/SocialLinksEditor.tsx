import { useEffect, useState } from 'react'
import {
  SOCIAL_NETWORKS,
  normalizeSocialValue,
  validateSocialValue,
  type SocialNetworkKey,
} from '../../lib/socialLinks'
import { getSocialLinks, saveSocialLinks } from '../../services/socialLinks'
import { EditPopup, NotSet, SectionCard } from '../appearance/SectionCard'

type Drafts = Record<SocialNetworkKey, { value: string; enabled: boolean }>

function emptyDrafts(): Drafts {
  return Object.fromEntries(SOCIAL_NETWORKS.map((n) => [n.key, { value: '', enabled: true }])) as Drafts
}

const inputCls =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]'

/**
 * Social links shown in the public page footer: a block with what is shown now and a pop-up to edit.
 * Self-contained: loads and saves on its own, separate from the landing config.
 */
export function SocialLinksEditor() {
  const [saved, setSaved] = useState<Drafts>(emptyDrafts())
  const [drafts, setDrafts] = useState<Drafts>(emptyDrafts())
  const [isOpen, setIsOpen] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<SocialNetworkKey, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [popupError, setPopupError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getSocialLinks()
      .then((links) => {
        if (cancelled) return
        const next = emptyDrafts()
        for (const link of links) {
          next[link.network] = { value: link.value, enabled: link.enabled }
        }
        setSaved(next)
      })
      .catch((err) => console.warn('Failed to load social links:', err))
    return () => {
      cancelled = true
    }
  }, [])

  const open = () => {
    setDrafts(saved)
    setErrors({})
    setPopupError(null)
    setSuccess(null)
    setIsOpen(true)
  }

  const handleSave = async () => {
    setPopupError(null)

    const nextErrors: Partial<Record<SocialNetworkKey, string>> = {}
    for (const network of SOCIAL_NETWORKS) {
      const message = validateSocialValue(network.key, drafts[network.key].value)
      if (message) nextErrors[network.key] = message
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSaving(true)
    try {
      await saveSocialLinks(
        SOCIAL_NETWORKS.map((network) => ({
          network: network.key,
          value: drafts[network.key].value,
          enabled: drafts[network.key].enabled,
        })),
      )
      // Keep the normalized values (https://, digits only)
      const normalized = { ...drafts }
      for (const network of SOCIAL_NETWORKS) {
        normalized[network.key] = {
          ...drafts[network.key],
          value: normalizeSocialValue(network.key, drafts[network.key].value),
        }
      }
      setSaved(normalized)
      setSuccess('Redes sociales guardadas correctamente.')
      setIsOpen(false)
    } catch {
      setPopupError('No pudimos guardar las redes sociales. Intentá nuevamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const shown = SOCIAL_NETWORKS.filter((n) => saved[n.key].enabled && saved[n.key].value.trim() !== '')

  return (
    <>
      {success && (
        <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      )}

      <SectionCard
        title="Redes sociales"
        description="Los enlaces del pie de la página pública."
        onEdit={open}
      >
        {shown.length > 0 ? shown.map((n) => n.label).join(', ') : <NotSet>No se muestra ninguna red</NotSet>}
      </SectionCard>

      {isOpen && (
        <EditPopup
          title="Editar redes sociales"
          onClose={() => setIsOpen(false)}
          onSubmit={handleSave}
          isSaving={isSaving}
          error={popupError}
          submitLabel="Guardar redes"
        >
          <p className="text-xs text-gray-500">
            Marcá las redes que querés mostrar y completá el enlace. Las que dejes sin marcar no se muestran.
          </p>

          {SOCIAL_NETWORKS.map((network) => {
            const draft = drafts[network.key]
            const inputId = `social-${network.key}`
            return (
              <div key={network.key} className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
                    {network.kind === 'phone' ? `${network.label} (número con código de país)` : `${network.label} (URL)`}
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      aria-label={`Mostrar ${network.label}`}
                      checked={draft.enabled}
                      className="h-4 w-4"
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [network.key]: { ...prev[network.key], enabled: e.target.checked } }))
                      }
                    />
                    Mostrar
                  </label>
                </div>
                <input
                  id={inputId}
                  className={inputCls}
                  type={network.kind === 'phone' ? 'tel' : 'text'}
                  inputMode={network.kind === 'phone' ? 'tel' : 'url'}
                  value={draft.value}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [network.key]: { ...prev[network.key], value: e.target.value } }))
                  }
                  placeholder={network.placeholder}
                />
                {errors[network.key] && <p className="text-xs text-red-600">{errors[network.key]}</p>}
              </div>
            )
          })}
        </EditPopup>
      )}
    </>
  )
}
