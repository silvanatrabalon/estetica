import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-gray-600">The page you are looking for does not exist.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
