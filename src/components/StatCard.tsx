interface StatCardProps {
  label: string
  value: string | number
  loading?: boolean
}

export function StatCard({ label, value, loading = false }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-2 shadow-sm">
      <span className="text-sm font-medium text-gray-500 truncate">{label}</span>
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
