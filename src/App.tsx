import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  getAuthCallbackError,
  getCurrentUser,
  isAuthCallbackUrl,
  signInWithGoogle,
  subscribeToAuthChanges,
} from './services/auth'

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Unexpected authentication error'
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [signInError, setSignInError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const bootstrapAuth = async () => {
      try {
        const initialUser = await getCurrentUser()
        if (!isMounted) {
          return
        }
        setUser(initialUser)
      } catch (error) {
        if (!isMounted) {
          return
        }
        setSignInError(formatError(error))
      } finally {
        if (isMounted) {
          setIsLoadingAuth(false)
        }
      }
    }

    void bootstrapAuth()

    const unsubscribe = subscribeToAuthChanges((nextUser) => {
      if (!isMounted) {
        return
      }
      setUser(nextUser)
      setIsLoadingAuth(false)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const handleGoogleSignIn = async () => {
    setSignInError(null)

    try {
      await signInWithGoogle()
    } catch (error) {
      setSignInError(formatError(error))
    }
  }

  const callbackError = getAuthCallbackError()
  const isCallbackFlow = isAuthCallbackUrl()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Estetica
        </h1>
        <p className="text-xl text-gray-600">
          Google sign-in is configured through Supabase Auth.
        </p>

        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {isLoadingAuth ? (
            <p className="text-sm text-gray-600">
              {isCallbackFlow
                ? 'Completing Google sign-in callback...'
                : 'Checking authentication session...'}
            </p>
          ) : user ? (
            <div>
              <p className="text-sm font-medium text-gray-900">
                Signed in successfully with Google.
              </p>
              <p className="mt-2 text-sm text-gray-700">
                User: {user.email ?? user.id}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-700">
                Sign in to continue using the app.
              </p>
              <button
                type="button"
                className="mt-4 inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                onClick={handleGoogleSignIn}
              >
                Continue with Google
              </button>
            </div>
          )}

          {(callbackError || signInError) && (
            <p className="mt-4 text-sm text-red-600">
              Authentication error: {callbackError ?? signInError}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
