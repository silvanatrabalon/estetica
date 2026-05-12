import { useState } from 'react'
import { signInWithGoogle } from '../services/auth'
import { getAuthCallbackError, isAuthCallbackUrl } from '../services/auth'

export function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callbackError = getAuthCallbackError()
  const isCallbackFlow = isAuthCallbackUrl()

  const handleGoogleSignIn = async () => {
    setError(null)
    setIsLoading(true)

    try {
      await signInWithGoogle()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo iniciar sesión.'
      setError(message)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Estetica</h1>
        <p className="text-xl text-gray-600">Sistema de reserva de turnos</p>

        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {isCallbackFlow ? (
            <p className="text-sm text-gray-600">
              Completando el acceso con Google...
            </p>
          ) : isLoading ? (
            <p className="text-sm text-gray-600">Iniciando sesión...</p>
          ) : (
            <>
              <p className="text-sm text-gray-700 mb-4">
                Ingresá con Google para continuar.
              </p>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Continuar con Google
              </button>
            </>
          )}

          {(callbackError || error) && (
            <p className="mt-4 text-sm text-red-600">
              Error: {callbackError ?? error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
