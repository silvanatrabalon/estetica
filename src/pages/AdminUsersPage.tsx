import { FormEvent, useEffect, useState } from 'react'
import type { ProfileRecord } from '../services/profile'
import { listProfilesForAdmin, updateProfileByAdmin } from '../services/profile'
import { normalizePhone, normalizeProfileName, validateProfileInput } from '../lib/profile'
import { commonCopy } from '../lib/uiCopy'

export function AdminUsersPage() {
  const [profiles, setProfiles] = useState<ProfileRecord[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  const selectedProfile = profiles.find((profile) => profile.userId === selectedUserId) ?? null

  const loadProfiles = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const data = await listProfilesForAdmin()
      setProfiles(data)

      if (data.length > 0) {
        setSelectedUserId((current) => current || data[0].userId)
      } else {
        setSelectedUserId('')
      }
    } catch {
      setErrorMessage('No pudimos cargar los perfiles de usuarios en este momento.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadProfiles()
  }, [])

  useEffect(() => {
    if (!selectedProfile) {
      setName('')
      setPhone('')
      return
    }

    setName(selectedProfile.name)
    setPhone(selectedProfile.phone ?? '')
  }, [selectedProfile?.name, selectedProfile?.phone, selectedProfile?.userId])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccessMessage(null)
    setErrorMessage(null)
    setNameError(null)

    if (!selectedProfile) {
      setErrorMessage('Seleccioná un perfil de usuario antes de guardar cambios.')
      return
    }

    const validation = validateProfileInput({ name, phone })
    if (!validation.valid) {
      setNameError(validation.errors.name ?? null)
      return
    }

    setIsSaving(true)

    try {
      const updatedProfile = await updateProfileByAdmin(selectedProfile.userId, {
        name: normalizeProfileName(name),
        phone: normalizePhone(phone) ?? '',
      })

      setProfiles((current) =>
        current.map((item) => (item.userId === updatedProfile.userId ? updatedProfile : item)),
      )
      setSuccessMessage('Perfil de usuario actualizado correctamente.')
    } catch {
      setErrorMessage('No pudimos actualizar este perfil de usuario en este momento.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-shell-text">Usuarios</h2>
        <p className="mt-2 text-sm text-shell-subtleText">
          Edición básica de perfil únicamente (nombre y teléfono). Cambios de rol, desactivación y analítica quedan fuera de alcance.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(220px,280px)_1fr]">
        <aside className="shell-surface rounded-2xl border p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-shell-text">Selector de usuarios</h3>

          {isLoading ? <p className="mt-3 text-sm text-shell-subtleText">Cargando usuarios...</p> : null}
          {!isLoading && profiles.length === 0 ? (
            <p className="mt-3 text-sm text-shell-subtleText">No hay perfiles de usuario disponibles.</p>
          ) : null}

          <ul className="mt-3 space-y-2">
            {profiles.map((profile) => {
              const active = profile.userId === selectedUserId
              return (
                <li key={profile.userId}>
                  <button
                    type="button"
                    onClick={() => setSelectedUserId(profile.userId)}
                    className={[
                      'w-full rounded-lg border px-3 py-2 text-left text-sm transition-micro',
                      active
                        ? 'border-brand-primary bg-teal-50 text-shell-text'
                        : 'border-shell-border bg-white text-shell-subtleText hover:bg-shell-muted',
                    ].join(' ')}
                  >
                    <p className="font-semibold">{profile.name || 'Usuario sin nombre'}</p>
                    <p className="truncate text-xs">{profile.userId}</p>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        <div className="shell-surface rounded-2xl border p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-shell-text">Editar perfil seleccionado</h3>

          {errorMessage ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>
          ) : null}
          {successMessage ? (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {successMessage}
            </p>
          ) : null}

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="admin-profile-name" className="mb-1 block text-sm font-semibold text-shell-text">
                {commonCopy.nameLabel}
              </label>
              <input
                id="admin-profile-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={!selectedProfile}
                className="w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-shell-text disabled:cursor-not-allowed disabled:bg-slate-50"
              />
              {nameError ? <p className="mt-1 text-xs text-red-600">{nameError}</p> : null}
            </div>

            <div>
              <label htmlFor="admin-profile-phone" className="mb-1 block text-sm font-semibold text-shell-text">
                {commonCopy.phoneOptionalLabel}
              </label>
              <input
                id="admin-profile-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                disabled={!selectedProfile}
                className="w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-shell-text disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!selectedProfile || isSaving}
                className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-micro hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? commonCopy.saving : 'Guardar perfil de usuario'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
