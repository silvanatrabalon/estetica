import { cn } from '../../lib/cn'

export const BOOKING_STEPS = [
  { step: 1, label: 'Servicio' },
  { step: 2, label: 'Fecha' },
  { step: 3, label: 'Horario' },
  { step: 4, label: 'Confirmar' },
] as const

interface BookingStepperProps {
  /** The current step, 1 to 4. */
  step: number
  /** Called when a step already done is pressed, to go back to it. */
  onGoTo: (step: 1 | 2 | 3) => void
}

/** Step-by-step menu of the booking: Servicio, Fecha, Horario, Confirmar. */
export function BookingStepper({ step, onGoTo }: BookingStepperProps) {
  return (
    <nav aria-label="Pasos de la reserva" className="min-w-0 flex-1">
      <ol className="flex items-start">
        {BOOKING_STEPS.map((item, index) => {
          const done = item.step < step
          const current = item.step === step
          const circle = (
            <span
              aria-hidden="true"
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors',
                done && 'border-brand-primary bg-[var(--color-lilac)] text-brand-primary',
                current && 'border-brand-primary bg-brand-primary text-white',
                !done && !current && 'border-shell-border bg-white text-shell-subtleText',
              )}
            >
              {done ? (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                item.step
              )}
            </span>
          )
          const label = (
            <span
              className={cn(
                'mt-1 block text-[11px] leading-tight',
                current ? 'font-bold text-shell-text' : done ? 'font-medium text-shell-text' : 'text-shell-subtleText',
              )}
            >
              {item.label}
            </span>
          )
          return (
            <li key={item.step} className={cn('flex items-start', index < BOOKING_STEPS.length - 1 && 'flex-1')}>
              {done ? (
                <button
                  type="button"
                  onClick={() => onGoTo(item.step as 1 | 2 | 3)}
                  aria-label={`Volver a ${item.label}`}
                  className="flex flex-col items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                >
                  {circle}
                  {label}
                </button>
              ) : (
                <div
                  aria-current={current ? 'step' : undefined}
                  className="flex flex-col items-center"
                >
                  {circle}
                  {label}
                </div>
              )}
              {index < BOOKING_STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn('mx-1 mt-3.5 h-0.5 min-w-3 flex-1 rounded-full', item.step < step ? 'bg-brand-primary' : 'bg-shell-border')}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
