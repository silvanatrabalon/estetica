interface ErrorShellProps {
  message?: string
}

export function ErrorShell({ message = 'Ocurrió un error' }: ErrorShellProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
        <p className="text-gray-700">{message}</p>
      </div>
    </div>
  )
}
