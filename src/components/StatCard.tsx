import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

interface StatCardProps {
  label: string
  value: string | number
  loading?: boolean
  variant?: 'light' | 'dark'
  icon?: ReactNode
  accent?: string
}

export function StatCard({ label, value, loading = false, variant = 'light', icon, accent }: StatCardProps) {
  if (variant === 'dark') {
    return (
      <div
        className="rounded-xl p-4 transition-all duration-200 hover:brightness-110"
        style={{ background: '#14211f', border: '1px solid #1e3532' }}
      >
        {icon && (
          <div className={cn('inline-flex p-1.5 rounded-lg mb-3', accent ?? 'bg-teal-900/50 text-teal-400')}>
            {icon}
          </div>
        )}
        {loading ? (
          <div
            data-testid="stat-card-skeleton"
            className="h-7 w-14 rounded bg-[#1e3532] animate-pulse mb-1"
          />
        ) : (
          <div
            className="text-3xl font-heading font-bold tabular-nums leading-none"
            style={{ color: '#e2f5f1' }}
          >
            {value}
          </div>
        )}
        <div className="text-xs mt-1.5 leading-snug" style={{ color: '#9ec6bf' }}>
          {label}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-shell-border p-4 flex flex-col gap-3">
      {icon && (
        <div className={cn('inline-flex p-1.5 rounded-lg w-fit', accent ?? 'bg-shell-muted text-brand-primary')}>
          {icon}
        </div>
      )}
      <span className="text-sm font-medium text-gray-500 leading-snug">{label}</span>
      {loading ? (
        <div
          data-testid="stat-card-skeleton"
          className="h-8 w-24 rounded bg-gray-200 animate-pulse"
        />
      ) : (
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      )}
    </div>
  )
}
