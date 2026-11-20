import { Link } from 'react-router-dom'
import { useUser } from '../hooks/useUser'

interface ActionCard {
  title: string
  description: string
  href: string
  icon: string
  accent: string
  bg: string
}

const ACTION_CARDS: ActionCard[] = [
  {
    title: 'Reservar turno',
    description: 'Elegí el servicio, el día y el horario que más te convenga.',
    href: '/booking',
    icon: '✦',
    accent: 'from-teal-500 to-emerald-400',
    bg: 'bg-teal-50 hover:bg-teal-100/70',
  },
  {
    title: 'Mis turnos',
    description: 'Revisá tus reservas próximas e historial de citas.',
    href: '/appointments',
    icon: '◈',
    accent: 'from-violet-500 to-fuchsia-400',
    bg: 'bg-violet-50 hover:bg-violet-100/70',
  },
  {
    title: 'Mi perfil',
    description: 'Actualizá tus datos personales y preferencias.',
    href: '/profile',
    icon: '◎',
    accent: 'from-amber-500 to-orange-400',
    bg: 'bg-amber-50 hover:bg-amber-100/70',
  },
]

export function DashboardPage() {
  const { profile } = useUser()

  const firstName = profile?.name?.split(' ')[0] ?? null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Back to landing */}
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-shell-subtleText hover:text-brand-primary transition-colors group"
        >
          <span className="inline-block transition-transform group-hover:-translate-x-0.5">←</span>
          Ver la página principal
        </Link>
      </div>

      {/* Welcome header */}
      <header className="mb-10">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-shell-text tracking-tight">
          {firstName ? `Hola, ${firstName} 👋` : 'Bienvenida 👋'}
        </h1>
        <p className="mt-2 text-shell-subtleText text-base">
          ¿Qué querés hacer hoy?
        </p>
      </header>

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ACTION_CARDS.map((card) => (
          <Link
            key={card.href}
            to={card.href}
            className={`group relative flex flex-col rounded-2xl border border-shell-border p-6 transition-all duration-200 hover:shadow-shell hover:-translate-y-0.5 ${card.bg}`}
          >
            {/* Icon badge */}
            <span
              className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.accent} text-white text-xl shadow-sm`}
              aria-hidden
            >
              {card.icon}
            </span>

            <h2 className="font-heading text-lg font-semibold text-shell-text group-hover:text-brand-primary transition-colors leading-snug">
              {card.title}
            </h2>
            <p className="mt-1.5 text-sm text-shell-subtleText leading-relaxed flex-1">
              {card.description}
            </p>

            {/* Arrow indicator */}
            <span
              className="mt-4 text-xs font-medium text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity"
              aria-hidden
            >
              Ir →
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
