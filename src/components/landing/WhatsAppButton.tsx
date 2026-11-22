import { buildSocialHref, type SocialLink } from '../../lib/socialLinks'
import { NetworkIcon } from './SocialLinksList'

/** Floating WhatsApp button. Only when the admin has WhatsApp turned on with a valid number. */
export function WhatsAppButton({ links }: { links: SocialLink[] }) {
  const link = links.find((l) => l.network === 'whatsapp')
  if (!link || !link.enabled) return null
  const href = buildSocialHref('whatsapp', link.value)
  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg ring-4 ring-[#25d366]/25 transition-transform hover:scale-105 [&_svg]:h-7 [&_svg]:w-7"
    >
      <NetworkIcon network="whatsapp" />
    </a>
  )
}
