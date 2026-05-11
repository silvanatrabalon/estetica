import { UserProvider, useUser } from './context'
import { ShellProvider } from './features/shell'
import { AppShell } from './components/shell'
import { SignInPage } from './pages/SignInPage'

/**
 * Inner app component that uses context
 * Separated from outer App() for context access
 */
function AppContent() {
  const { user, isLoading } = useUser()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-700 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <SignInPage />
  }

  return (
    <ShellProvider>
      <AppShell>
        {/* Routes will go here */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to Estetica
          </h2>
          <p className="text-gray-600">
            Shell and navigation system is ready.
          </p>
        </div>
      </AppShell>
    </ShellProvider>
  )
}

/**
 * Main App component
 * Wraps with UserProvider to provide session context
 */
export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  )
}
