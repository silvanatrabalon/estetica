import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { getLandingConfig, getUpcomingClosures } from '../services/landing'
import { getPublicSocialLinks } from '../services/socialLinks'
import { SocialLinksList } from '../components/landing/SocialLinksList'
import { PromotionsSection } from '../components/landing/PromotionsSection'
import { listPublicPromos, type PublicPromo } from '../services/promos'
import { listPublicCoupons, type PublicCoupon } from '../services/coupons'
import type { SocialLink } from '../lib/socialLinks'
import { formatPriceARS } from '../lib/formatPrice'
import { applyPromo } from '../lib/promos'
import { shortDiscount } from '../lib/coupons'
import { bookingHref } from '../lib/bookingLinks'
import { readableTextOn, splitAccentTitle, todayHoursText } from '../lib/landingStyle'
import { getPublicIdentity, type PublicIdentity } from '../services/brand'
import { LandingNav } from '../components/landing/LandingNav'
import { WhatsAppButton } from '../components/landing/WhatsAppButton'
import { initSupabase } from '../lib/supabase'
import { resolveRoleHomePath } from '../lib/routing'
import type { LandingConfig, CarouselImage, UpcomingClosure } from '../services/landing'
import type { Service } from '../services/adminServices'
import { RouteLoadingState } from '../components/routing'

// ─────────────────────────────────────────────────────────────────────────────
// Carousel
// ─────────────────────────────────────────────────────────────────────────────

interface CarouselProps {
  images: CarouselImage[]
  primaryColor: string
}

function Carousel({ images, primaryColor }: CarouselProps) {
  const supabase = initSupabase()
  const [current, setCurrent] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const resolveUrl = (path: string) =>
    supabase.storage.from('media').getPublicUrl(path).data.publicUrl

  function startAutoplay() {
    if (images.length <= 1) return
    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % images.length)
    }, 4000)
  }

  function stopAutoplay() {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  useEffect(() => {
    startAutoplay()
    return stopAutoplay
  }, [images.length]) // eslint-disable-line react-hooks/exhaustive-deps

  if (images.length === 0) {
    return (
      <div
        className="absolute inset-0"
        style={{ backgroundColor: primaryColor, opacity: 0.4 }}
        aria-hidden
      />
    )
  }

  if (images.length === 1) {
    return (
      <div className="absolute inset-0">
        <img
          src={resolveUrl(images[0].storagePath)}
          alt={images[0].altText ?? ''}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={stopAutoplay}
      onMouseLeave={startAutoplay}
    >
      {images.map((img, i) => (
        <img
          key={img.id}
          src={resolveUrl(img.storagePath)}
          alt={img.altText ?? ''}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrent(i); stopAutoplay() }}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i === current ? 'bg-white' : 'bg-white/50'
            }`}
            aria-label={`Imagen ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero Section
// ─────────────────────────────────────────────────────────────────────────────

interface HeroSectionProps {
  config: LandingConfig
  /** Where the main button goes; null hides it (admin and staff looking at the site). */
  ctaHref: string | null
  /** "Hoy de 09:00 a 19:00": the glass card over the photo. Hidden when there is nothing to say. */
  todayText: string | null
}

function HeroSection({ config, ctaHref, todayText }: HeroSectionProps) {
  const titleParts = splitAccentTitle(config.heroTitle ?? 'Bienvenida a nuestro espacio')

  return (
    <section id="inicio" className="relative overflow-hidden">
      {/* Soft color behind the glass, so the blur has something to show */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full opacity-30 blur-3xl"
        style={{ backgroundColor: 'var(--lp-primary)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full opacity-40 blur-3xl"
        style={{ backgroundColor: 'var(--lp-secondary)' }}
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-28 lg:pt-16">
        <div>
          <p className="mb-5 text-xs uppercase tracking-[0.35em]" style={{ color: 'var(--lp-accent-text)' }}>
            Bienvenida
          </p>
          <h1 className="lp-display text-5xl font-medium leading-[1.05] text-[#2b2420] sm:text-6xl lg:text-7xl">
            {titleParts.map((part, i) =>
              part.accent ? (
                <em key={i} className="italic" style={{ color: 'var(--lp-accent-text)' }}>
                  {part.text}
                </em>
              ) : (
                <span key={i}>{part.text}</span>
              ),
            )}
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-[#5b4f43] sm:text-lg">
            {config.heroSubtitle ?? 'Tu lugar de bienestar y belleza'}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            {ctaHref && (
              <Link
                to={ctaHref}
                className="rounded-full px-8 py-3.5 text-sm font-medium shadow-md transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--lp-primary)', color: 'var(--lp-on-primary)' }}
              >
                Reservar turno
              </Link>
            )}
            <a
              href="#servicios"
              className="lp-glass rounded-full px-8 py-3.5 text-sm font-medium text-[#2b2420] transition-colors hover:bg-white/80"
            >
              Ver servicios
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div
            className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-xl"
            style={{ border: '1px solid color-mix(in srgb, var(--lp-primary) 55%, transparent)' }}
          >
            <Carousel images={config.carouselImages} primaryColor={config.primaryColor} />
            <div aria-hidden className="pointer-events-none absolute inset-3 rounded-[1.5rem] border border-white/60" />
          </div>
          {todayText && (
            <div className="lp-glass absolute -bottom-5 left-4 rounded-2xl px-5 py-3 text-[#2b2420] sm:-left-6">
              <p className="text-[11px] uppercase tracking-widest text-[#8a7a68]">Horario</p>
              <p className="lp-display text-xl font-semibold">{todayText}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Services Section
// ─────────────────────────────────────────────────────────────────────────────

interface ServiceCardProps {
  service: Service
  primaryColor: string
  /** Best promo running on this service (only those the admin chose to show on the website). */
  promo?: PublicPromo
  isAuthenticated: boolean
  /** The repeated half of the loop: hidden from screen readers and the keyboard. */
  duplicate?: boolean
}

function ServiceCard({ service, primaryColor, promo, isAuthenticated, duplicate = false }: ServiceCardProps) {
  const promoPrice = promo
    ? applyPromo(service.priceCents, { type: promo.discountType, value: promo.discountValue }).finalCents
    : null

  return (
    <Link
      to={bookingHref(isAuthenticated, { servicio: service.id })}
      aria-hidden={duplicate || undefined}
      tabIndex={duplicate ? -1 : undefined}
      aria-label={duplicate ? undefined : `Reservar ${service.name}`}
      className={`lp-glass rounded-3xl overflow-hidden flex flex-col w-56 shrink-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-primary)] ${
        promo ? 'ring-1 ring-[var(--color-peach-ink)]/40' : ''
      }`}
    >
      <div className="overflow-hidden relative">
        {service.imageUrl ? (
          <img
            src={service.imageUrl}
            alt={duplicate ? '' : service.name}
            className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-40 flex items-center justify-center text-white text-4xl font-light"
            style={{ backgroundColor: primaryColor }}
            aria-hidden
          >
            {service.name.charAt(0).toUpperCase()}
          </div>
        )}
        {promo && (
          <span className="absolute left-2 top-2 rounded-full bg-[var(--color-peach)] px-2.5 py-1 text-xs font-bold text-[var(--color-peach-ink)] shadow-sm">
            PROMO {shortDiscount({ type: promo.discountType, value: promo.discountValue })}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className="font-semibold text-gray-800 leading-snug">{service.name}</h3>
        <p className="text-xs text-gray-400 uppercase tracking-wider">{service.durationMinutes} min</p>
        {promo && promoPrice !== null ? (
          <p className="mt-auto pt-2 text-sm">
            <s className="text-gray-400">{formatPriceARS(service.priceCents)}</s>{' '}
            <strong className="text-[var(--color-peach-ink)]">{formatPriceARS(promoPrice)}</strong>
          </p>
        ) : (
          <p className="font-bold text-sm mt-auto pt-2" style={{ color: primaryColor }}>
            {formatPriceARS(service.priceCents)}
          </p>
        )}
      </div>
    </Link>
  )
}

/** The promo with the biggest discount on each service. */
function bestPromoByService(services: Service[], promos: PublicPromo[]): Record<string, PublicPromo> {
  const best: Record<string, PublicPromo> = {}
  for (const service of services) {
    let top: PublicPromo | undefined
    let topDiscount = -1
    for (const promo of promos) {
      if (!promo.serviceIds.includes(service.id)) continue
      const { discountCents } = applyPromo(service.priceCents, { type: promo.discountType, value: promo.discountValue })
      if (discountCents > topDiscount) {
        top = promo
        topDiscount = discountCents
      }
    }
    if (top) best[service.id] = top
  }
  return best
}

interface ServicesSectionProps {
  services: Service[]
  promos: PublicPromo[]
  loading: boolean
  primaryColor: string
  isAuthenticated: boolean
}

/** Seconds a service takes to cross the screen: the more services, the longer the loop. */
const SECONDS_PER_SERVICE = 6
/** A half of the loop has at least this many cards, so it is wider than the screen. */
const MIN_CARDS_PER_HALF = 8

function ServicesSection({ services, promos, loading, primaryColor, isAuthenticated }: ServicesSectionProps) {
  const promoOf = bestPromoByService(services, promos)

  // The loop is the list repeated until it is wide enough, rendered twice
  const repeats = services.length > 0 ? Math.max(1, Math.ceil(MIN_CARDS_PER_HALF / services.length)) : 1
  const half = Array.from({ length: repeats }, () => services).flat()

  return (
    <section className="py-20 max-w-5xl mx-auto" id="servicios">
      <div className="text-center mb-10 px-6">
        <h2 className="lp-display text-4xl sm:text-5xl font-semibold text-[#2b2420] mb-3">Nuestros servicios</h2>
        <div className="w-10 h-0.5 mx-auto rounded-full" style={{ backgroundColor: 'var(--lp-primary)' }} />
        {!loading && services.length > 0 && (
          <p className="mt-3 text-gray-500">Tocá un servicio para reservarlo.</p>
        )}
      </div>
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 px-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm h-52 animate-pulse" />
          ))}
        </div>
      )}
      {!loading && services.length === 0 && (
        <p className="text-center text-gray-500 px-6">No hay servicios disponibles por el momento.</p>
      )}
      {!loading && services.length > 0 && (
        <div className="landing-marquee overflow-hidden" data-testid="services-carousel">
          <div
            className="landing-marquee-track flex gap-5 px-3"
            style={{ ['--marquee-duration' as string]: `${half.length * SECONDS_PER_SERVICE}s` }}
          >
            {[0, 1].map((copy) =>
              half.map((service, i) => (
                <ServiceCard
                  key={`${copy}-${i}-${service.id}`}
                  service={service}
                  primaryColor={primaryColor}
                  promo={promoOf[service.id]}
                  isAuthenticated={isAuthenticated}
                  duplicate={copy === 1 || i >= services.length}
                />
              )),
            )}
          </div>
        </div>
      )}
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// About Section
// ─────────────────────────────────────────────────────────────────────────────

interface AboutSectionProps {
  aboutText: string | null
}

function AboutSection({ aboutText }: AboutSectionProps) {
  if (!aboutText) return null

  return (
    <section className="py-20 px-6" id="nosotros">
      <div className="lp-glass mx-auto max-w-3xl rounded-[2rem] p-8 text-center sm:p-12">
        <h2 className="lp-display text-4xl sm:text-5xl font-semibold mb-3 text-[#2b2420]">Sobre nosotros</h2>
        <div className="w-10 h-0.5 mx-auto rounded-full mb-8" style={{ backgroundColor: 'var(--lp-primary)' }} />
        <p className="lp-display text-7xl leading-none select-none opacity-30 -mb-2" style={{ color: 'var(--lp-primary)' }}>&ldquo;</p>
        <p className="text-[#4a3f35] leading-relaxed whitespace-pre-line text-lg">{aboutText}</p>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Hours Section
// ─────────────────────────────────────────────────────────────────────────────

interface BusinessHourRow {
  id: string
  day_of_week: number
  is_closed: boolean
  opens_at: string | null
  closes_at: string | null
}

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function formatTime(t: string | null): string {
  if (!t) return ''
  const [h, m] = t.split(':')
  return `${h}:${m}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Today Closure Banner
// ─────────────────────────────────────────────────────────────────────────────

interface TodayClosureBannerProps {
  closure: UpcomingClosure
}

function TodayClosureBanner({ closure }: TodayClosureBannerProps) {
  const message =
    closure.closureType === 'full_day'
      ? 'Hoy estamos cerrados.'
      : `Hoy cerrado de ${formatTime(closure.startsAt)} a ${formatTime(closure.endsAt)}.`

  return (
    <div
      className="w-full py-3 px-6 text-center text-sm font-semibold"
      style={{ backgroundColor: 'var(--lp-primary)', color: '#fff' }}
      role="alert"
    >
      {message}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Upcoming Closures Section
// ─────────────────────────────────────────────────────────────────────────────

function formatDateLong(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface UpcomingClosuresSectionProps {
  closures: UpcomingClosure[]
}

function UpcomingClosuresSection({ closures }: UpcomingClosuresSectionProps) {
  if (closures.length === 0) return null

  return (
    <section className="py-12 px-6" aria-label="Próximos cierres">
      <div className="lp-glass mx-auto max-w-xl rounded-3xl p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Próximos cierres</h2>
        <ul className="space-y-2">
          {closures.map((c) => {
            const timeWindow =
              c.closureType === 'half_day' && c.startsAt && c.endsAt
                ? ` (de ${formatTime(c.startsAt)} a ${formatTime(c.endsAt)})`
                : ''
            return (
              <li key={c.closureDate} className="text-sm text-gray-700">
                El {formatDateLong(c.closureDate)} estaremos cerrados
                {c.reason ? ` — ${c.reason}.` : '.'}
                {timeWindow && <span className="text-gray-500">{timeWindow}</span>}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

interface HoursSectionProps {
  showHours: boolean
  hours: BusinessHourRow[]
}

function HoursSection({ showHours, hours }: HoursSectionProps) {
  if (!showHours) return null

  const todayDow = new Date().getDay()
  const sorted = [...hours].sort((a, b) => a.day_of_week - b.day_of_week)

  return (
    <section className="py-20 px-6 max-w-xl mx-auto" id="horarios">
      <div className="text-center mb-8">
        <h2 className="lp-display text-4xl sm:text-5xl font-semibold text-[#2b2420] mb-3">Horarios</h2>
        <div className="w-10 h-0.5 mx-auto rounded-full" style={{ backgroundColor: 'var(--lp-primary)' }} />
      </div>
      <div className="lp-glass rounded-3xl overflow-hidden">
        {sorted.map((h) => {
          const isToday = h.day_of_week === todayDow
          return (
            <div
              key={h.id}
              className={`flex justify-between items-center px-6 py-4 border-b border-white/70 last:border-b-0 ${
                h.is_closed ? 'opacity-50' : ''
              }`}
            >
              <span className={`font-medium flex items-center gap-2 ${h.is_closed ? 'text-gray-400' : 'text-gray-700'}`}>
                {DAY_LABELS[h.day_of_week]}
                {isToday && (
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded text-white"
                    style={{ backgroundColor: 'var(--lp-primary)' }}
                  >
                    hoy
                  </span>
                )}
              </span>
              <span
                className={`text-sm font-medium ${h.is_closed ? 'text-gray-400 italic' : ''}`}
                style={h.is_closed ? {} : { color: 'var(--lp-primary)' }}
              >
                {h.is_closed ? 'Cerrado' : `${formatTime(h.opens_at)} – ${formatTime(h.closes_at)}`}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Contact Footer
// ─────────────────────────────────────────────────────────────────────────────

interface ContactFooterProps {
  socialLinks: SocialLink[]
}

function ContactFooter({ socialLinks }: ContactFooterProps) {
  return (
    <footer
      className="py-16 px-6"
      style={{ backgroundColor: 'var(--lp-primary)' }}
      id="contacto"
    >
      <div className="max-w-sm mx-auto text-center">
        <div className="w-10 h-px bg-white/40 mx-auto mb-8" />
        <h2 className="lp-display text-3xl font-semibold text-white mb-1">Contacto</h2>
        <p className="text-white/65 text-sm mb-8">Estamos para vos</p>
        <SocialLinksList links={socialLinks} />
        <div className="w-10 h-px bg-white/25 mx-auto mb-6" />
        <p className="text-xs text-white/50">
          © 2026{' '}
          <a
            href="mailto:silvana.trabalon@gmail.com"
            className="underline underline-offset-2 hover:text-white/80 transition-colors"
          >
            Software Queen
          </a>
        </p>
      </div>
    </footer>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LandingPage (main)
// ─────────────────────────────────────────────────────────────────────────────

export function LandingPage() {
  const { user, activeRole, isLoading: authLoading } = useUser()
  // "Ir al sitio" in the menu opens the site with ?sitio so admin and staff can see it
  const [searchParams] = useSearchParams()
  const viewingSite = searchParams.has('sitio')
  const [config, setConfig] = useState<LandingConfig | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [hours, setHours] = useState<BusinessHourRow[]>([])
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [loadingServices, setLoadingServices] = useState(true)
  const [upcomingClosures, setUpcomingClosures] = useState<UpcomingClosure[]>([])
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [promotions, setPromotions] = useState<PublicCoupon[]>([])
  const [publicPromos, setPublicPromos] = useState<PublicPromo[]>([])
  const [identity, setIdentity] = useState<PublicIdentity>({ name: null, logoUrl: null })

  const isAuthenticated = !!user
  const isCustomer = activeRole === 'customer'

  // Name and logo for the top bar (without them the bar just has no logo)
  useEffect(() => {
    let cancelled = false
    void getPublicIdentity().then((value) => {
      if (!cancelled) setIdentity(value)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // The serif of the titles
  useEffect(() => {
    const id = 'lp-display-font'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&display=swap'
    document.head.appendChild(link)
  }, [])

  // Load the social links the admin chose to show (failures just hide the section)
  useEffect(() => {
    let cancelled = false
    getPublicSocialLinks()
      .then((links) => {
        if (!cancelled) setSocialLinks(links)
      })
      .catch(() => {
        if (!cancelled) setSocialLinks([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Coupons the admin chose to show (failures just hide the section)
  useEffect(() => {
    let cancelled = false
    listPublicCoupons()
      .then((list) => {
        if (!cancelled) setPromotions(list)
      })
      .catch(() => {
        if (!cancelled) setPromotions([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Promos the admin chose to show (failures just hide them)
  useEffect(() => {
    let cancelled = false
    listPublicPromos()
      .then((list) => {
        if (!cancelled) setPublicPromos(list)
      })
      .catch(() => {
        if (!cancelled) setPublicPromos([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Load config + services + hours
  useEffect(() => {
    let cancelled = false
    const supabase = initSupabase()

    setLoadingConfig(true)
    setLoadingServices(true)

    getLandingConfig()
      .then((cfg) => {
        if (!cancelled) setConfig(cfg)
      })
      .catch(() => {
        if (!cancelled) setConfig(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingConfig(false)
      })

    // Fetch services (anon-safe direct SELECT)
    void Promise.resolve(
      supabase
        .from('services')
        .select('id, organization_id, name, duration_minutes, price_cents, image_url, is_active, max_concurrent_bookings, created_at, description, category_id')
        .eq('is_active', true)
        .order('name'),
    ).then(({ data }) => {
      if (!cancelled) {
        setServices(
          (data ?? []).map((row) => ({
            id: row.id,
            organizationId: row.organization_id,
            name: row.name,
            durationMinutes: row.duration_minutes,
            priceCents: row.price_cents,
            imageUrl: row.image_url,
            isActive: row.is_active,
            maxConcurrentBookings: row.max_concurrent_bookings ?? null,
            createdAt: row.created_at,
            description: row.description ?? null,
            categoryId: row.category_id ?? null,
            categoryName: null,
          })),
        )
        setLoadingServices(false)
      }
    }).catch(() => {
      if (!cancelled) {
        setServices([])
        setLoadingServices(false)
      }
    })

    // Fetch business hours
    supabase
      .from('business_hours')
      .select('id, day_of_week, is_closed, opens_at, closes_at')
      .order('day_of_week')
      .then(({ data }) => {
        if (!cancelled) setHours((data ?? []) as BusinessHourRow[])
      })

    // Fetch upcoming closures via RPC (anon-safe)
    getUpcomingClosures()
      .then((rows) => { if (!cancelled) setUpcomingClosures(rows) })
      .catch(() => { if (!cancelled) setUpcomingClosures([]) })

    return () => { cancelled = true }
  }, [])

  // Apply CSS custom properties and Google Fonts
  useEffect(() => {
    if (!config) return

    document.documentElement.style.setProperty('--lp-primary', config.primaryColor)
    document.documentElement.style.setProperty('--lp-secondary', config.secondaryColor)
    document.documentElement.style.fontFamily = config.fontFamily || 'Inter'

    const fontFamily = config.fontFamily
    if (fontFamily && fontFamily !== 'Inter') {
      const linkId = 'lp-google-font'
      let link = document.getElementById(linkId) as HTMLLinkElement | null
      if (!link) {
        link = document.createElement('link')
        link.id = linkId
        link.rel = 'stylesheet'
        document.head.appendChild(link)
      }
      const encoded = encodeURIComponent(fontFamily)
      link.href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;600;700&display=swap`
    }

    return () => {
      document.documentElement.style.removeProperty('--lp-primary')
      document.documentElement.style.removeProperty('--lp-secondary')
      document.documentElement.style.removeProperty('font-family')
    }
  }, [config])

  const effectiveConfig = config ?? {
    id: null,
    organizationId: null,
    heroTitle: null,
    heroSubtitle: null,
    aboutText: null,
    instagramUrl: null,
    whatsappNumber: null,
    primaryColor: '#f9a8d4',
    secondaryColor: '#fbcfe8',
    fontFamily: 'Inter',
    showHours: true,
    carouselImages: [],
  }

  const todayStr = new Date().toLocaleDateString('en-CA')
  const todayClosure = upcomingClosures.find((c) => c.closureDate === todayStr) ?? null
  const futureClosures = upcomingClosures.filter((c) => c.closureDate > todayStr)

  // Redirect admin/staff to their home. This must come after every hook: the role can change
  // while the page is mounted, and returning earlier would change the number of hooks.
  if (!authLoading && !viewingSite && (activeRole === 'admin' || activeRole === 'staff')) {
    return <Navigate to={resolveRoleHomePath(activeRole)} replace />
  }

  if (authLoading || loadingConfig) {
    return <RouteLoadingState />
  }

  // Visitors and customers can book; admin and staff are only looking at the site
  const canBook = !isAuthenticated || isCustomer || activeRole === null
  const bookHref = canBook ? bookingHref(isAuthenticated) : null
  const todayText = todayHoursText(hours, { closedAllDay: todayClosure?.closureType === 'full_day' })

  const navLinks = [
    { label: 'Servicios', href: '#servicios' },
    ...(promotions.length > 0 || publicPromos.length > 0 ? [{ label: 'Promociones', href: '#promociones' }] : []),
    ...(effectiveConfig.aboutText ? [{ label: 'Sobre nosotros', href: '#nosotros' }] : []),
    ...(effectiveConfig.showHours ? [{ label: 'Horarios', href: '#horarios' }] : []),
    { label: 'Contacto', href: '#contacto' },
  ]

  return (
    <div
      style={{
        '--lp-primary': effectiveConfig.primaryColor,
        '--lp-secondary': effectiveConfig.secondaryColor,
        '--lp-on-primary': readableTextOn(effectiveConfig.primaryColor),
        // The main color for text on the cream page: a bit deeper so a light color still reads
        '--lp-accent-text': 'color-mix(in srgb, var(--lp-primary) 70%, #2b2420)',
        fontFamily: effectiveConfig.fontFamily,
        // A very light wash of the secondary color: the page stays warm whatever color is chosen
        backgroundColor: 'color-mix(in srgb, var(--lp-secondary) 18%, #fffaf2)',
      } as React.CSSProperties}
      className="min-h-screen scroll-smooth text-[#2b2420]"
    >
      {viewingSite && (activeRole === 'admin' || activeRole === 'staff') && (
        <Link
          to={resolveRoleHomePath(activeRole)}
          className="fixed bottom-4 left-3 z-50 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-slate-800 shadow-lg ring-1 ring-black/10 hover:bg-white"
        >
          ← Volver al panel
        </Link>
      )}
      {todayClosure && <TodayClosureBanner closure={todayClosure} />}
      <LandingNav name={identity.name} logoUrl={identity.logoUrl} links={navLinks} bookHref={bookHref} />
      <HeroSection config={effectiveConfig} ctaHref={bookHref} todayText={todayText} />
      <ServicesSection
        services={services}
        promos={publicPromos}
        loading={loadingServices}
        primaryColor={effectiveConfig.primaryColor}
        isAuthenticated={isAuthenticated}
      />
      <PromotionsSection coupons={promotions} promos={publicPromos} isAuthenticated={isAuthenticated} />
      <AboutSection aboutText={effectiveConfig.aboutText} />
      <HoursSection showHours={effectiveConfig.showHours} hours={hours} />
      <UpcomingClosuresSection closures={futureClosures} />
      <ContactFooter socialLinks={socialLinks} />
      <WhatsAppButton links={socialLinks} />
    </div>
  )
}
