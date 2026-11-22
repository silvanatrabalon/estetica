import { BrandSettingsForm } from '../components/appearance/BrandSettingsForm'
import { SocialLinksEditor } from '../components/landing/SocialLinksEditor'
import { LandingConfigPage } from './LandingConfigPage'

/** Everything the customer sees: the logo and the public page (content, design, carousel and social links). */
export function AppearancePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <h1 className="font-heading text-2xl font-semibold text-shell-text">Apariencia</h1>
      <BrandSettingsForm />
      <LandingConfigPage />
      <SocialLinksEditor />
    </div>
  )
}
