import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { updateMyProfile } from '../services/profile'
import { normalizePhone, normalizeProfileName, validateProfileInput } from '../lib/profile'
import { commonCopy } from '../lib/uiCopy'

export function ProfilePage() {
  const { profile, profileStatus, refreshProfile } = useUser()

  const [name, setName] = useState(profile?.name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [nameError, setNameError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    setName(profile?.name ?? '')
    setPhone(profile?.phone ?? '')
  }, [profile?.name, profile?.phone])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNameError(null)
    setFormError(null)
    setIsSaved(false)

    const validation = validateProfileInput({ name, phone })
    if (!validation.valid) {
      setNameError(validation.errors.name ?? null)
      return
    }

    setIsSaving(true)

    try {
      await updateMyProfile({
        name: normalizeProfileName(name),
        phone: normalizePhone(phone) ?? '',
      })
      await refreshProfile()
      setIsSaved(true)
    } catch {
      setFormError('No pudimos guardar tu perfil en este momento. Intentá nuevamente.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-2xl">
      <div className="shell-surface rounded-2xl border p-6 shadow-sm">
        <h2 className="font-heading text-2xl font-semibold text-shell-text">Perfil</h2>
        <p className="mt-2 text-sm text-shell-subtleText">Actualizá los datos básicos de tu cuenta.</p>

        {profileStatus === 'incomplete' ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Tu perfil está incompleto. También podés completarlo desde{' '}
            <Link to="/profile/setup" className="font-semibold underline">
              configuración de perfil
            </Link>
            .
          </p>
        ) : null}

        {profileStatus === 'load-error' ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            No pudimos cargar la última versión de tu perfil. Igual podés editar y guardar tus datos.
          </p>
        ) : null}

        {formError ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>
        ) : null}

        {isSaved ? (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            Perfil guardado correctamente.
          </p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="profile-name" className="mb-1 block text-sm font-semibold text-shell-text">
              {commonCopy.nameLabel}
            </label>
            <input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              className="w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-shell-text"
            />
            {nameError ? <p className="mt-1 text-xs text-red-600">{nameError}</p> : null}
          </div>

          <div>
            <label htmlFor="profile-phone" className="mb-1 block text-sm font-semibold text-shell-text">
              {commonCopy.phoneOptionalLabel}
            </label>
            <input
              id="profile-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="tel"
              className="w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-shell-text"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-micro hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? commonCopy.saving : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
