import { describeDiscount, shortDiscount } from '../../lib/coupons'
import type { PublicCoupon } from '../../services/coupons'
import type { PublicPromo } from '../../services/promos'

function formatEnd(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
}

/** Promos and coupons the admin chose to show. Renders nothing when there are none. */
export function PromotionsSection({ coupons, promos = [] }: { coupons: PublicCoupon[]; promos?: PublicPromo[] }) {
  if (coupons.length === 0 && promos.length === 0) return null

  return (
    <section className="mx-auto max-w-5xl px-6 py-16" id="promociones" aria-labelledby="promociones-title">
      <div className="mb-8 text-center">
        <h2 id="promociones-title" className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">
          Promociones
        </h2>
        <p className="text-gray-500">{coupons.length > 0 ? 'Usá el código al reservar tu turno.' : 'Se aplican solas al reservar tu turno.'}</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {promos.map((promo) => (
          <li
            key={promo.promoId}
            className="rounded-3xl border border-[var(--color-peach-ink)]/30 bg-[var(--color-peach)]/40 p-5 text-center"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-peach-ink)]">Promo · {promo.name}</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">
              {shortDiscount({ type: promo.discountType, value: promo.discountValue })}
            </p>
            {promo.description && <p className="mt-1 text-sm text-gray-600">{promo.description}</p>}
            {promo.serviceNames.length > 0 && (
              <p className="mt-3 text-sm font-medium text-gray-800">{promo.serviceNames.join(', ')}</p>
            )}
            <p className="mt-3 text-xs text-gray-500">Hasta el {formatEnd(promo.endsOn)}</p>
          </li>
        ))}
        {coupons.map((coupon) => (
          <li key={coupon.code} className="rounded-3xl border border-dashed border-gray-300 bg-white p-5 text-center">
            <p className="text-2xl font-extrabold text-gray-900">
              {shortDiscount({ type: coupon.discountType, value: coupon.discountValue })}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {coupon.description ?? describeDiscount({ type: coupon.discountType, value: coupon.discountValue })}
            </p>
            <p className="mt-3 inline-block rounded-full bg-gray-100 px-4 py-1.5 font-mono text-sm font-bold tracking-wider text-gray-900">
              {coupon.code}
            </p>
            <p className="mt-3 text-xs text-gray-400">
              {coupon.categoryName ? `En ${coupon.categoryName}` : 'En todos los servicios'}
              {coupon.endsOn ? ` · Hasta el ${formatEnd(coupon.endsOn)}` : ''}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
