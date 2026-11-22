import { Link } from "react-router-dom";
import { describeDiscount, shortDiscount } from "../../lib/coupons";
import { bookingHref } from "../../lib/bookingLinks";
import type { PublicCoupon } from "../../services/coupons";
import type { PublicPromo } from "../../services/promos";

function formatEnd(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
  });
}

/** Promos and coupons the admin chose to show. Renders nothing when there are none. */
export function PromotionsSection({
  coupons,
  promos = [],
  isAuthenticated = false,
}: {
  coupons: PublicCoupon[];
  promos?: PublicPromo[];
  isAuthenticated?: boolean;
}) {
  if (coupons.length === 0 && promos.length === 0) return null;

  return (
    <section
      className="mx-auto max-w-5xl px-6 py-16"
      id="promociones"
      aria-labelledby="promociones-title"
    >
      <div className="mb-8 text-center">
        <h2
          id="promociones-title"
          className="lp-display mb-2 text-4xl font-semibold text-[#2b2420] sm:text-5xl"
        >
          Promociones
        </h2>
        <p className="text-gray-500">Tocá una para ir a reservar con ella.</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {promos.map((promo) => (
          <li key={promo.promoId}>
            <Link
              to={bookingHref(isAuthenticated, { promo: promo.promoId })}
              aria-label={`Reservar con la promo ${promo.name}`}
              className="block h-full rounded-3xl border lp-glass ring-1 ring-[var(--color-peach-ink)]/25 p-5 text-center transition-all hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-primary)]"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-peach-ink)]">
                Promo · {promo.name}
              </p>
              <p className="mt-1 text-2xl font-extrabold text-gray-900">
                {shortDiscount({
                  type: promo.discountType,
                  value: promo.discountValue,
                })}
              </p>
              {promo.description && (
                <p className="mt-1 text-sm text-gray-600">
                  {promo.description}
                </p>
              )}
              {promo.serviceNames.length > 0 && (
                <p className="mt-3 text-sm font-medium text-gray-800">
                  {promo.serviceNames.join(", ")}
                </p>
              )}
              <p className="mt-3 text-xs text-gray-500">
                Hasta el {formatEnd(promo.endsOn)}
              </p>
            </Link>
          </li>
        ))}
        {coupons.map((coupon) => (
          <li key={coupon.code}>
            <Link
              to={bookingHref(isAuthenticated, {
                cupon: coupon.code,
                categoria: coupon.categoryName,
              })}
              aria-label={`Reservar con el cupón ${coupon.code}`}
              className="block h-full lp-glass rounded-3xl border-dashed p-5 text-center transition-all hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-primary)]"
            >
              <p className="text-2xl font-extrabold text-gray-900">
                {shortDiscount({
                  type: coupon.discountType,
                  value: coupon.discountValue,
                })}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {coupon.description ??
                  describeDiscount({
                    type: coupon.discountType,
                    value: coupon.discountValue,
                  })}
              </p>
              <p className="mt-3 inline-block rounded-full bg-gray-100 px-4 py-1.5 font-mono text-sm font-bold tracking-wider text-gray-900">
                {coupon.code}
              </p>
              <p className="mt-3 text-xs text-gray-400">
                {coupon.categoryName
                  ? `En ${coupon.categoryName}`
                  : "En todos los servicios"}
                {coupon.endsOn ? ` · Hasta el ${formatEnd(coupon.endsOn)}` : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
