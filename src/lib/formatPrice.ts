/**
 * Formats a price stored as integer cents into ARS currency string.
 * E.g. 150000 → "$1.500,00"
 */
export function formatPriceARS(priceCents: number): string {
  return (priceCents / 100).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
  })
}
