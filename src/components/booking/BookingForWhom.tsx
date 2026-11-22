import { cn } from '../../lib/cn'
import type { BookingTarget } from '../../lib/bookingTarget'
import { clientLabel, type BookingClient } from '../../services/bookingClients'
import { Select } from '../Select'

interface BookingForWhomProps {
  value: BookingTarget
  onChange: (target: BookingTarget) => void
  clients: BookingClient[]
  loading: boolean
  error: string | null
  /** Validation message to show under the fields. */
  validationError?: string | null
}

const OPTIONS: { kind: BookingTarget['kind']; label: string }[] = [
  { kind: 'me', label: 'Para mí' },
  { kind: 'client', label: 'Para un cliente' },
  { kind: 'guest', label: 'Otra persona' },
]

const fieldCls =
  'w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm text-shell-text focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]'

/** Only shown to admin and staff: who is this appointment for? */
export function BookingForWhom({ value, onChange, clients, loading, error, validationError }: BookingForWhomProps) {
  const pick = (kind: BookingTarget['kind']) => {
    if (kind === value.kind) return
    if (kind === 'me') onChange({ kind: 'me' })
    else if (kind === 'client') onChange({ kind: 'client', userId: '' })
    else onChange({ kind: 'guest', name: '', phone: '', email: '' })
  }

  return (
    <div className="mb-4 rounded-3xl border border-shell-border bg-white p-4">
      <p className="mb-2 text-sm font-medium text-shell-text">¿Para quién es la reserva?</p>

      <div role="radiogroup" aria-label="¿Para quién es la reserva?" className="grid grid-cols-3 gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.kind}
            type="button"
            role="radio"
            aria-checked={value.kind === opt.kind}
            onClick={() => pick(opt.kind)}
            className={cn(
              'rounded-xl border px-2 py-2 text-sm font-medium transition-colors',
              value.kind === opt.kind
                ? 'border-brand-primary bg-[var(--color-lilac)]/50 text-shell-text'
                : 'border-shell-border bg-white text-shell-text hover:bg-shell-muted',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {value.kind === 'me' && (
        <p className="mt-2 text-xs text-shell-subtleText">El turno queda a tu nombre.</p>
      )}

      {value.kind === 'client' && (
        <div className="mt-3">
          <label htmlFor="booking-client" className="mb-1 block text-xs font-medium text-shell-subtleText">
            Cliente
          </label>
          {error ? (
            <p role="alert" className="text-sm text-red-600">{error}</p>
          ) : (
            <Select
              id="booking-client"
              value={value.userId}
              disabled={loading}
              onChange={(e) => {
                const picked = e.target.value
                if (picked.startsWith('guest:')) {
                  // A person without account booked before: switch to "Otra persona" with their data
                  const guest = clients[Number(picked.slice('guest:'.length))]
                  if (guest) {
                    onChange({ kind: 'guest', name: guest.name, phone: guest.phone ?? '', email: guest.email ?? '' })
                    return
                  }
                }
                onChange({ kind: 'client', userId: picked })
              }}
              className={fieldCls}
            >
              <option value="">{loading ? 'Cargando clientes…' : 'Elegí un cliente'}</option>
              {clients.map((c, index) => (
                <option key={c.userId ?? `guest-${index}`} value={c.userId ?? `guest:${index}`}>
                  {clientLabel(c)}
                </option>
              ))}
            </Select>
          )}
          {!loading && !error && clients.length === 0 && (
            <p className="mt-1 text-xs text-shell-subtleText">
              Todavía no hay clientes. Usá “Otra persona” para cargar el nombre.
            </p>
          )}
          <p className="mt-2 text-xs text-shell-subtleText">
            El turno queda a nombre del cliente, no tuyo. Las personas “sin cuenta” son las que ya cargaste antes.
          </p>
        </div>
      )}

      {value.kind === 'guest' && (
        <div className="mt-3 space-y-2">
          <div>
            <label htmlFor="booking-guest-name" className="mb-1 block text-xs font-medium text-shell-subtleText">
              Nombre
            </label>
            <input
              id="booking-guest-name"
              value={value.name}
              onChange={(e) => onChange({ ...value, name: e.target.value })}
              className={fieldCls}
              placeholder="Ej: Rosa Gómez"
              autoComplete="off"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="booking-guest-phone" className="mb-1 block text-xs font-medium text-shell-subtleText">
                Teléfono <span className="font-normal">(opcional)</span>
              </label>
              <input
                id="booking-guest-phone"
                value={value.phone}
                onChange={(e) => onChange({ ...value, phone: e.target.value })}
                className={fieldCls}
                inputMode="tel"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="booking-guest-email" className="mb-1 block text-xs font-medium text-shell-subtleText">
                Email <span className="font-normal">(opcional)</span>
              </label>
              <input
                id="booking-guest-email"
                value={value.email}
                onChange={(e) => onChange({ ...value, email: e.target.value })}
                className={fieldCls}
                inputMode="email"
                autoComplete="off"
              />
            </div>
          </div>
          <p className="text-xs text-shell-subtleText">
            No necesita cuenta. Si cargás el email, le avisamos por correo.
          </p>
        </div>
      )}

      {validationError && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {validationError}
        </p>
      )}
    </div>
  )
}
