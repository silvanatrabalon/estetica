import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { getLandingConfig } from '../services/landing'
import { formatPriceARS } from '../lib/formatPrice'
import { initSupabase } from '../lib/supabase'
import { resolveRoleHomePath } from '../lib/routing'
import type { LandingConfig, CarouselImage } from '../services/landing'
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

interface TodayClosureRow {
  closureType: 'full_day' | 'half_day'
  startsAt: string | null
  endsAt: string | null
  reason: string | null
}

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function formatTime(t: string | null): string {
  if (!t) return ''
  const [h, m] = t.split(':')
  return `${h}:${m}`
}

interface HoursSectionProps {
  showHours: boolean
  hours: BusinessHourRow[]
  todayClosure: TodayClosureRow | null
}

function HoursSection({ showHours, hours, todayClosure }: HoursSectionProps) {
  if (!showHours) return null

  const todayDow = new Date().getDay()
  const sorted = [...hours].sort((a, b) => a.day_of_week - b.day_of_week)

  return (
    <section className="py-20 px-6 max-w-xl mx-auto" id="horarios">
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Horarios</h2>
        <div className="w-10 h-0.5 mx-auto rounded-full" style={{ backgroundColor: 'var(--lp-primary)' }} />
      </div>
      {todayClosure && (
        <div
          className="mb-4 rounded-xl px-5 py-4 border text-sm"
          style={{ backgroundColor: 'var(--lp-secondary)', borderColor: 'var(--lp-primary)' }}
        >
          <p className="font-semibold text-gray-800">
            {todayClosure.closureType === 'full_day'
              ? 'Hoy el negocio está cerrado'
              : `Hoy hay cierre parcial: ${formatTime(todayClosure.startsAt)} – ${formatTime(todayClosure.endsAt)}`}
          </p>
          {todayClosure.reason && (
            <p className="mt-0.5 text-gray-600">{todayClosure.reason}</p>
          )}
        </div>
      )}
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

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      width="20"
      height="20"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      width="20"
      height="20"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

interface ContactFooterProps {
  instagramUrl: string | null
}

function ContactFooter({ instagramUrl }: ContactFooterProps) {
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
        <div className="flex flex-row items-center justify-center gap-8 mb-10">
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="group inline-flex flex-col items-center gap-2"
            >
              <span className="inline-flex items-center justify-center bg-white/20 border border-white/30 text-white w-12 h-12 rounded-full group-hover:bg-white group-hover:text-gray-800 transition-all duration-300">
                <InstagramIcon />
              </span>
              <span className="text-[11px] text-white/65 group-hover:text-white/90 transition-colors tracking-wide">Instagram</span>
            </a>
          )}
          <a
            href="https://w.app/bfs0ip"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="group inline-flex flex-col items-center gap-2"
          >
            <span className="inline-flex items-center justify-center bg-white/20 border border-white/30 text-white w-12 h-12 rounded-full group-hover:bg-white group-hover:text-gray-800 transition-all duration-300">
              <WhatsAppIcon />
            </span>
            <span className="text-[11px] text-white/65 group-hover:text-white/90 transition-colors tracking-wide">WhatsApp</span>
          </a>
        </div>
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
  const [todayClosure, setTodayClosure] = useState<TodayClosureRow | null>(null)

  const isAuthenticated = !!user
  const isCustomer = activeRole === 'customer'

  // Redirect admin/staff to their home
  if (!authLoading && (activeRole === 'admin' || activeRole === 'staff')) {
    return <Navigate to={resolveRoleHomePath(activeRole)} replace />
  }

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

    // Fetch today's closure exception (anon-safe)
    const todayDate = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local timezone
    supabase
      .from('business_closure_exceptions')
      .select('closure_type, starts_at, ends_at, reason')
      .eq('closure_date', todayDate)
      .limit(1)
      .then(({ data }) => {
        if (!cancelled && data && data.length > 0) {
          const row = data[0]
          setTodayClosure({
            closureType: row.closure_type as 'full_day' | 'half_day',
            startsAt: row.starts_at,
            endsAt: row.ends_at,
            reason: row.reason,
          })
        }
      })

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
      <AboutSection aboutText={effectiveConfig.aboutText} />
      <HoursSection showHours={effectiveConfig.showHours} hours={hours} todayClosure={todayClosure} />
      <ContactFooter
        instagramUrl={effectiveConfig.instagramUrl}
      />
    </div>
  )
}
