import { Link } from 'react-router-dom'

export function UnauthorizedPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Sin autorización</h2>
      <p className="text-gray-600 mb-6">
        No tenés permisos para acceder a esta ruta.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
