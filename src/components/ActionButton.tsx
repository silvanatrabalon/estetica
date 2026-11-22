import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type Tone = 'primary' | 'neutral' | 'danger'

interface ActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /**
   * primary: go to or change something (Editar, Editar roles, Vincular cuenta, Disponibilidad, Cambiar nombre).
   * neutral: switch a state (Desactivar, Reactivar, Activar).
   * danger: remove something (Eliminar, Quitar).
   */
  tone?: Tone
}

const TONE_CLASS: Record<Tone, string> = {
  primary: 'text-brand-primary hover:underline',
  neutral: 'text-shell-subtleText hover:text-shell-text hover:underline',
  danger: 'text-red-500 hover:text-red-700 hover:underline',
}

/** The text action under a card or row. Same size, weight and colors in every screen. */
export function ActionButton({ tone = 'primary', className, ...props }: ActionButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cn('py-1 text-xs font-semibold transition-colors disabled:opacity-60', TONE_CLASS[tone], className)}
    />
  )
}

/** The row that holds the actions: primary first, then state, then destructive. */
export function ActionRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mt-2 flex flex-wrap items-center gap-x-4 gap-y-0.5', className)}>{children}</div>
}
