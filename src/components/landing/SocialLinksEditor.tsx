import { FormEvent, useEffect, useState } from 'react'
import {
  SOCIAL_NETWORKS,
  normalizeSocialValue,
  validateSocialValue,
  type SocialNetworkKey,
} from '../../lib/socialLinks'
import { getSocialLinks, saveSocialLinks } from '../../services/socialLinks'

type Drafts = Record<SocialNetworkKey, { value: string; enabled: boolean }>

function emptyDrafts(): Drafts {
  return Object.fromEntries(SOCIAL_NETWORKS.map((n) => [n.key, { value: '', enabled: true }])) as Drafts
}

const inputCls =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300'

/**
 * Admin editor for the social links shown in the public landing footer.
 * Self-contained: loads and saves on its own, separate from the landing config form.
 */
export function SocialLinksEditor() {
  const [drafts, setDrafts] = useState<Drafts>(emptyDrafts())
  const [errors, setErrors] = useState<Partial<Record<SocialNetworkKey, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    getSocialLinks()
      .then((links) => {
        if (cancelled) return
        const next = emptyDrafts()
        for (const link of links) {
          next[link.network] = { value: link.value, enabled: link.enabled }
        }
        setDrafts(next)
      })
      .catch((err) => console.warn('Failed to load social links:', err))
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFeedback(null)

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
      // Reflect normalized values (https://, digits only) in the inputs
      setDrafts((prev) => {
        const next = { ...prev }
        for (const network of SOCIAL_NETWORKS) {
          next[network.key] = {
            ...prev[network.key],
            value: normalizeSocialValue(network.key, prev[network.key].value),
          }
        }
        return next
      })
      setFeedback({ type: 'success', message: 'Redes sociales guardadas correctamente.' })
    } catch {
      setFeedback({ type: 'error', message: 'No pudimos guardar las redes sociales. Intentá nuevamente.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5"
    >
      <div>
        <h2 className="font-semibold text-gray-700">Redes sociales</h2>
        <p className="mt-1 text-xs text-gray-500">
          Marcá las redes que querés mostrar en el pie de la página pública y completá el enlace. Las que dejes sin marcar no se muestran.
        </p>
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

      {SOCIAL_NETWORKS.map((network) => {
        const draft = drafts[network.key]
        const inputId = `social-${network.key}`
        return (
          <div key={network.key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor={inputId} className="text-sm font-medium text-gray-600">
                {network.kind === 'phone' ? `${network.label} (número con código de país)` : `${network.label} (URL)`}
              </label>
              <label className="flex items-center gap-1.5 text-xs text-gray-600">
                <input
                  type="checkbox"
                  aria-label={`Mostrar ${network.label}`}
                  checked={draft.enabled}
                  className="accent-pink-400"
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

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-600 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Guardando…' : 'Guardar redes'}
        </button>
      </div>
    </form>
  )
}
