import { useState } from 'react'
import { BrandSettingsForm } from '../components/appearance/BrandSettingsForm'
import { SocialLinksEditor } from '../components/landing/SocialLinksEditor'
import { LandingConfigPage } from './LandingConfigPage'

type TabKey = 'brand' | 'landing'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'brand', label: 'Marca y reservas' },
  { key: 'landing', label: 'Página pública' },
]

/** Everything the customer sees: logo and booking texts, and the public page (content and social links). */
export function AppearancePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('brand')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Apariencia</h1>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-pink-600 hover:underline font-medium"
        >
          Ir al sitio web →
        </a>
      </div>

      <div role="tablist" aria-label="Secciones de apariencia" className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div hidden={activeTab !== 'brand'}>
        <BrandSettingsForm />
      </div>
      <div hidden={activeTab !== 'landing'} className="space-y-8">
        <LandingConfigPage />
        <SocialLinksEditor />
      </div>
    </div>
  )
}
