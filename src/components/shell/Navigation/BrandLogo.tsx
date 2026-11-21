import { useEffect, useState } from 'react'
import { getBrandSettings } from '../../../services/brand'

/** Business logo for the top bar. Renders nothing when there is no logo or it fails to load. */
export function BrandLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    getBrandSettings()
      .then((brand) => {
        if (!cancelled) setLogoUrl(brand.logoUrl)
      })
      .catch(() => {
        // Non-critical: the bar still shows the business name
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!logoUrl || failed) return null

  return (
    <img
      src={logoUrl}
      alt=""
      aria-hidden="true"
      onError={() => setFailed(true)}
      className="mr-3 h-9 w-9 flex-shrink-0 rounded-lg object-contain"
    />
  )
}
