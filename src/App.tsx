import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  getAuthCallbackError,
  isAuthCallbackUrl,
  signInWithGoogle,
} from './services/auth'
import {
  clearAuthDependentState,
  evaluateSessionHealth,
  recoverExpiredSession,
  restoreSessionOnBootstrap,
  signOutWithCleanup,
  subscribeToSessionLifecycle,
  type SessionLifecycleSnapshot,
} from './services/session'

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
  const [sessionNotice, setSessionNotice] = useState<string | null>(null)

  const resetAuthDependentState = () => {
    clearAuthDependentState([
      () => setUser(null),
      () => setSignInError(null),
    ])
  }

  const applySessionSnapshot = (snapshot: SessionLifecycleSnapshot) => {
    setUser(snapshot.user)
    setSignInError(null)

    if (snapshot.reason === 'signed-out') {
      setSessionNotice('You have signed out successfully.')
    } else if (snapshot.reason === 'token-refreshed') {
      setSessionNotice(null)
    }
  }

  const handleExpiredSession = (notice?: string | null) => {
    setSessionNotice(notice ?? 'Your session expired. Please sign in again.')
    recoverExpiredSession([resetAuthDependentState])
  }

  useEffect(() => {
    let isMounted = true

    const bootstrapAuth = async () => {
      try {
        const snapshot = await restoreSessionOnBootstrap()
        if (!isMounted) {
          return
        }

        if (snapshot.status === 'expired') {
          handleExpiredSession(snapshot.notice)
          return
        }

        applySessionSnapshot(snapshot)
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

    const unsubscribe = subscribeToSessionLifecycle((snapshot) => {
      if (!isMounted) {
        return
      }

      if (snapshot.status === 'expired') {
        handleExpiredSession(snapshot.notice)
        return
      }

      applySessionSnapshot(snapshot)
      setIsLoadingAuth(false)
    })

    const healthCheckTimer = window.setInterval(async () => {
      if (!isMounted || !user) {
        return
      }

      const snapshot = await evaluateSessionHealth()
      if (snapshot.status === 'expired') {
        handleExpiredSession(snapshot.notice)
      }
    }, 60_000)

    return () => {
      isMounted = false
      window.clearInterval(healthCheckTimer)
      unsubscribe()
    }
  }, [user])

  const handleGoogleSignIn = async () => {
    setSignInError(null)
    setSessionNotice(null)

    try {
      await signInWithGoogle()
    } catch (error) {
      setSignInError(formatError(error))
    }
  }

  const handleSignOut = async () => {
    setSignInError(null)

    try {
      await signOutWithCleanup([
        resetAuthDependentState,
      ])
      setSessionNotice('You have signed out successfully.')
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
              <button
                type="button"
                className="mt-4 inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                onClick={handleSignOut}
              >
                Sign out
              </button>
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

          {sessionNotice && (
            <p className="mt-4 text-sm text-amber-700">
              {sessionNotice}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
