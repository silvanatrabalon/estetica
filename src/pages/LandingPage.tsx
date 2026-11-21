import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { getLandingConfig, getUpcomingClosures } from '../services/landing'
import { getPublicSocialLinks } from '../services/socialLinks'
import { SocialLinksList } from '../components/landing/SocialLinksList'
import { PromotionsSection } from '../components/landing/PromotionsSection'
import { listPublicCoupons, type PublicCoupon } from '../services/coupons'
import type { SocialLink } from '../lib/socialLinks'
import { formatPriceARS } from '../lib/formatPrice'
import { initSupabase } from '../lib/supabase'
import { resolveRoleHomePath } from '../lib/routing'
import type { LandingConfig, CarouselImage, UpcomingClosure } from '../services/landing'
import type { Service } from '../services/adminServices'
import type { ServiceCategory } from '../services/adminCategories'
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
      {/* Prev/next arrows */}
      <button
        onClick={() => { setCurrent((c) => (c - 1 + images.length) % images.length); stopAutoplay() }}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors"
        aria-label="Imagen anterior"
      >
        ‹
      </button>
      <button
        onClick={() => { setCurrent((c) => (c + 1) % images.length); stopAutoplay() }}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors"
        aria-label="Imagen siguiente"
      >
        ›
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero Section
// ─────────────────────────────────────────────────────────────────────────────

interface HeroSectionProps {
  config: LandingConfig
  isCustomer: boolean
  isAuthenticated: boolean
  activeRole: string | null
}

function HeroSection({ config, isCustomer, isAuthenticated, activeRole }: HeroSectionProps) {
  const ctaHref = !isAuthenticated ? '/signin?redirect=/booking' : '/booking'
  // Show CTA for visitors, customers, and users whose role hasn't resolved yet.
  // Admin/staff are always redirected before reaching this component.
  const showCTA = !isAuthenticated || isCustomer || activeRole === null

  return (
    <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
      <Carousel images={config.carouselImages} primaryColor={config.primaryColor} />
      {/* Cinematic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/45 to-black/65" aria-hidden />
      {/* Content */}
      <div className="relative z-10 text-center text-white px-6 max-w-2xl mx-auto">
        {/* Decorative eyebrow */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="block w-8 h-px bg-white/50" />
          <span className="text-[10px] sm:text-xs tracking-[0.35em] uppercase text-white/75 font-light">Bienvenida</span>
          <span className="block w-8 h-px bg-white/50" />
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold mb-5 leading-tight drop-shadow-lg tracking-tight">
          {config.heroTitle ?? 'Bienvenida a nuestro espacio'}
        </h1>
        <p className="text-base sm:text-lg mb-10 drop-shadow-md text-white/85 font-light tracking-wide max-w-md mx-auto">
          {config.heroSubtitle ?? 'Tu lugar de bienestar y belleza'}
        </p>
        {showCTA && (
          <Link
            to={ctaHref}
            className="inline-block px-10 py-3.5 rounded-full text-sm font-semibold tracking-wider uppercase border-2 border-white text-white hover:bg-white hover:text-gray-900 transition-all duration-300"
          >
            Reservar turno
          </Link>
        )}
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
}

function ServiceCard({ service, primaryColor }: ServiceCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
      <div className="overflow-hidden">
        {service.imageUrl ? (
          <img
            src={service.imageUrl}
            alt={service.name}
            className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-44 flex items-center justify-center text-white text-4xl font-light"
            style={{ backgroundColor: primaryColor }}
            aria-hidden
          >
            {service.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col gap-1.5 flex-1">
        <h3 className="font-semibold text-gray-800 leading-snug">{service.name}</h3>
        <p className="text-xs text-gray-400 uppercase tracking-wider">{service.durationMinutes} min</p>
        <p className="font-bold text-sm mt-auto pt-2" style={{ color: primaryColor }}>
          {formatPriceARS(service.priceCents)}
        </p>
      </div>
    </div>
  )
}

interface ServicesSectionProps {
  services: Service[]
  categories: ServiceCategory[]
  loading: boolean
  primaryColor: string
}

function ServicesSection({ services, categories, loading, primaryColor }: ServicesSectionProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)

  const categoriesWithServices = categories.filter((cat) =>
    services.some((s) => s.categoryId === cat.id),
  )
  const hasUncategorized = services.some((s) => s.categoryId == null)
  const showTabs = categoriesWithServices.length > 0 || hasUncategorized

  const filteredServices =
    activeCategoryId === null
      ? services
      : activeCategoryId === '__uncategorized__'
        ? services.filter((s) => s.categoryId == null)
        : services.filter((s) => s.categoryId === activeCategoryId)

  const activeTabStyle = {
    backgroundColor: primaryColor || '#374151',
    color: '#fff',
  }

  return (
    <section className="py-20 px-6 max-w-5xl mx-auto" id="servicios">
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Nuestros servicios</h2>
        <div className="w-10 h-0.5 mx-auto rounded-full" style={{ backgroundColor: 'var(--lp-primary)' }} />
      </div>
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm h-52 animate-pulse" />
          ))}
        </div>
      )}
      {!loading && services.length === 0 && (
        <p className="text-center text-gray-500">No hay servicios disponibles por el momento.</p>
      )}
      {!loading && services.length > 0 && (
        <>
          {showTabs && (
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              <button
                type="button"
                onClick={() => setActiveCategoryId(null)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors border"
                style={activeCategoryId === null ? activeTabStyle : {}}
              >
                Todos
              </button>
              {categoriesWithServices.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategoryId(cat.id)}
                  className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors border"
                  style={activeCategoryId === cat.id ? activeTabStyle : {}}
                >
                  {cat.name}
                </button>
              ))}
              {hasUncategorized && (categoriesWithServices.length > 0) && (
                <button
                  type="button"
                  onClick={() => setActiveCategoryId('__uncategorized__')}
                  className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors border"
                  style={activeCategoryId === '__uncategorized__' ? activeTabStyle : {}}
                >
                  Otros
                </button>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} primaryColor={primaryColor} />
            ))}
          </div>
        </>
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
    <section
      className="py-20 px-6"
      style={{ backgroundColor: 'var(--lp-secondary)' }}
      id="nosotros"
    >
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-gray-800">Sobre nosotros</h2>
        <div className="w-10 h-0.5 mx-auto rounded-full bg-gray-400/50 mb-8" />
        <p className="text-6xl leading-none font-serif select-none opacity-20 text-gray-600 -mb-2">&ldquo;</p>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">{aboutText}</p>
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
    <section
      className="py-12 px-6"
      style={{ backgroundColor: 'var(--lp-secondary)' }}
      aria-label="Próximos cierres"
    >
      <div className="max-w-xl mx-auto">
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
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Horarios</h2>
        <div className="w-10 h-0.5 mx-auto rounded-full" style={{ backgroundColor: 'var(--lp-primary)' }} />
      </div>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        {sorted.map((h) => {
          const isToday = h.day_of_week === todayDow
          return (
            <div
              key={h.id}
              className={`flex justify-between items-center px-6 py-4 border-b border-gray-100 last:border-b-0 ${
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
        <h2 className="text-2xl font-bold text-white mb-1">Contacto</h2>
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
  const [config, setConfig] = useState<LandingConfig | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [hours, setHours] = useState<BusinessHourRow[]>([])
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [loadingServices, setLoadingServices] = useState(true)
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [upcomingClosures, setUpcomingClosures] = useState<UpcomingClosure[]>([])
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [promotions, setPromotions] = useState<PublicCoupon[]>([])

  const isAuthenticated = !!user
  const isCustomer = activeRole === 'customer'

  // Redirect admin/staff to their home
  if (!authLoading && (activeRole === 'admin' || activeRole === 'staff')) {
    return <Navigate to={resolveRoleHomePath(activeRole)} replace />
  }

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

    // Fetch categories (anon-safe)
    supabase
      .from('service_categories')
      .select('id, name, display_order')
      .order('display_order')
      .order('name')
      .then(({ data }) => {
        if (!cancelled) {
          setCategories(
            (data ?? []).map((row) => ({
              id: row.id,
              name: row.name,
              displayOrder: row.display_order,
            })),
          )
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

  if (authLoading || loadingConfig) {
    return <RouteLoadingState />
  }

  return (
    <div
      style={{
        '--lp-primary': effectiveConfig.primaryColor,
        '--lp-secondary': effectiveConfig.secondaryColor,
        fontFamily: effectiveConfig.fontFamily,
      } as React.CSSProperties}
      className="min-h-screen"
    >
      {todayClosure && <TodayClosureBanner closure={todayClosure} />}
      <HeroSection
        config={effectiveConfig}
        isCustomer={isCustomer}
        isAuthenticated={isAuthenticated}
        activeRole={activeRole}
      />
      <ServicesSection
        services={services}
        categories={categories}
        loading={loadingServices}
        primaryColor={effectiveConfig.primaryColor}
      />
      <PromotionsSection coupons={promotions} />
      <AboutSection aboutText={effectiveConfig.aboutText} />
      <HoursSection showHours={effectiveConfig.showHours} hours={hours} />
      <UpcomingClosuresSection closures={futureClosures} />
      <ContactFooter socialLinks={socialLinks} />
    </div>
  )
}
