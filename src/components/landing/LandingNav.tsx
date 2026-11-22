import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export interface NavLinkItem {
  label: string
  href: string
}

interface LandingNavProps {
  name: string | null
  /** Transparent logos (PNG or SVG) sit straight on the glass bar, with no box around them. */
  logoUrl: string | null
  links: NavLinkItem[]
  /** Where "Reservar" goes. Null hides the button (admin and staff just looking at the site). */
  bookHref: string | null
}

/** Top bar of the public page: logo and name, section links, and the Reservar button. Glass on top of the page. */
export function LandingNav({ name, logoUrl, links, bookHref }: LandingNavProps) {
  const [open, setOpen] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
      <nav
        aria-label="Principal"
        className="lp-glass relative mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full px-4 py-2 sm:px-6"
      >
        <a href="#inicio" className="flex min-w-0 items-center gap-2.5" onClick={() => setOpen(false)}>
          {logoUrl && !logoFailed && (
            <img
              src={logoUrl}
              alt=""
              aria-hidden="true"
              onError={() => setLogoFailed(true)}
              className="h-9 w-auto max-w-[3rem] shrink-0 object-contain sm:h-10"
            />
          )}
          {name && <span className="lp-display truncate text-lg font-semibold text-[#2b2420] sm:text-xl">{name}</span>}
        </a>

        <ul className="hidden items-center gap-6 text-sm text-[#5b4f43] lg:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="transition-colors hover:text-[var(--lp-primary)]">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-2">
          {bookHref && (
            <Link
              to={bookHref}
              className="rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--lp-primary)', color: 'var(--lp-on-primary)' }}
            >
              Reservar
            </Link>
          )}
          <button
            type="button"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            aria-controls="landing-menu"
            onClick={() => setOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-[#2b2420] hover:bg-black/5 lg:hidden"
          >
            {open ? '✕' : '☰'}
          </button>
        </div>

        {open && (
          <ul
            id="landing-menu"
            className="absolute left-0 right-0 top-full mt-2 flex flex-col rounded-3xl border border-white/70 bg-white/95 p-2 text-[#2b2420] shadow-xl lg:hidden"
          >
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-base hover:bg-black/5"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </header>
  )
}
