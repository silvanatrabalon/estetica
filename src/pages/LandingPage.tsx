import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { getLandingConfig } from '../services/landing'
import { formatPriceARS } from '../lib/formatPrice'
import { initSupabase } from '../lib/supabase'
import { resolveRoleHomePath } from '../lib/routing'
import type { LandingConfig, CarouselImage } from '../services/landing'
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
}

function HeroSection({ config, isCustomer, isAuthenticated }: HeroSectionProps) {
  const ctaHref = !isAuthenticated ? '/signin?redirect=/booking' : '/booking'
  const showCTA = !isAuthenticated || isCustomer

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      <Carousel images={config.carouselImages} primaryColor={config.primaryColor} />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" aria-hidden />
      {/* Content */}
      <div className="relative z-10 text-center text-white px-6 max-w-2xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 drop-shadow-lg">
          {config.heroTitle ?? 'Bienvenida a nuestro espacio'}
        </h1>
        <p className="text-lg sm:text-xl mb-8 drop-shadow-md opacity-90">
          {config.heroSubtitle ?? 'Tu lugar de bienestar y belleza'}
        </p>
        {showCTA && (
          <Link
            to={ctaHref}
            className="inline-block px-8 py-3 rounded-full text-white font-semibold shadow-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--lp-primary)' }}
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
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-pink-100 flex flex-col">
      {service.imageUrl ? (
        <img
          src={service.imageUrl}
          alt={service.name}
          className="w-full h-40 object-cover"
        />
      ) : (
        <div
          className="w-full h-40 flex items-center justify-center text-white text-4xl font-bold"
          style={{ backgroundColor: primaryColor }}
          aria-hidden
        >
          {service.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className="font-semibold text-gray-800">{service.name}</h3>
        <p className="text-sm text-gray-500">{service.durationMinutes} min</p>
        <p className="font-bold mt-auto" style={{ color: 'var(--lp-primary)' }}>
          {formatPriceARS(service.priceCents)}
        </p>
      </div>
    </div>
  )
}

interface ServicesSectionProps {
  services: Service[]
  loading: boolean
  primaryColor: string
}

function ServicesSection({ services, loading, primaryColor }: ServicesSectionProps) {
  return (
    <section className="py-16 px-6 max-w-5xl mx-auto" id="servicios">
      <h2 className="text-3xl font-bold text-center mb-10 text-gray-800">Nuestros servicios</h2>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} primaryColor={primaryColor} />
          ))}
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
    <section
      className="py-16 px-6"
      style={{ backgroundColor: 'var(--lp-secondary)' }}
      id="nosotros"
    >
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Sobre nosotros</h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">{aboutText}</p>
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

interface HoursSectionProps {
  showHours: boolean
  hours: BusinessHourRow[]
}

function HoursSection({ showHours, hours }: HoursSectionProps) {
  if (!showHours) return null

  const sorted = [...hours].sort((a, b) => a.day_of_week - b.day_of_week)

  return (
    <section className="py-16 px-6 max-w-xl mx-auto" id="horarios">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Horarios</h2>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-pink-100">
        {sorted.map((h) => (
          <div
            key={h.id}
            className="flex justify-between items-center px-6 py-3 border-b border-gray-100 last:border-b-0"
          >
            <span className="font-medium text-gray-700">{DAY_LABELS[h.day_of_week]}</span>
            <span className="text-gray-500 text-sm">
              {h.is_closed ? 'Cerrado' : `${formatTime(h.opens_at)} – ${formatTime(h.closes_at)}`}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Contact Footer
// ─────────────────────────────────────────────────────────────────────────────

interface ContactFooterProps {
  instagramUrl: string | null
  whatsappNumber: string | null
}

function ContactFooter({ instagramUrl, whatsappNumber }: ContactFooterProps) {
  const waLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}`
    : null

  return (
    <footer
      className="py-12 px-6 text-center"
      style={{ backgroundColor: 'var(--lp-primary)' }}
      id="contacto"
    >
      <h2 className="text-2xl font-bold text-white mb-6">Contacto</h2>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-gray-800 px-5 py-2 rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            <span aria-hidden>📷</span> Instagram
          </a>
        )}
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-gray-800 px-5 py-2 rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            <span aria-hidden>💬</span> WhatsApp
          </a>
        )}
      </div>
      <p className="mt-8 text-sm text-white/70">
        © {new Date().getFullYear()} — Todos los derechos reservados
      </p>
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
    supabase
      .from('services')
      .select('id, organization_id, name, duration_minutes, price_cents, image_url, is_active, max_concurrent_bookings, created_at')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
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
            })),
          )
          setLoadingServices(false)
        }
      })
      .catch(() => {
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

    return () => { cancelled = true }
  }, [])

  // Apply CSS custom properties and Google Fonts
  useEffect(() => {
    if (!config) return

    document.documentElement.style.setProperty('--lp-primary', config.primaryColor)
    document.documentElement.style.setProperty('--lp-secondary', config.secondaryColor)

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
      />
      <ServicesSection
        services={services}
        loading={loadingServices}
        primaryColor={effectiveConfig.primaryColor}
      />
      <AboutSection aboutText={effectiveConfig.aboutText} />
      <HoursSection showHours={effectiveConfig.showHours} hours={hours} />
      <ContactFooter
        instagramUrl={effectiveConfig.instagramUrl}
        whatsappNumber={effectiveConfig.whatsappNumber}
      />
    </div>
  )
}
