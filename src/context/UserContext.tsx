import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { initSupabase } from '../lib/supabase'
import {
  restoreSessionOnBootstrap,
  subscribeToSessionLifecycle,
  evaluateSessionHealth,
  clearAuthDependentState,
} from '../services/session'

export type AppRole = 'customer' | 'staff' | 'admin'

interface UserContextValue {
  user: User | null
  role: AppRole | null
  isLoading: boolean
  signOut: () => Promise<void>
}

export const UserContext = createContext<UserContextValue | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<AppRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user role from database
  const fetchUserRole = async (userId: string) => {
    try {
      const supabase = initSupabase()
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.warn('Error querying user role:', error)
        setRole('customer') // Safe default
        return
      }

      // If no role record exists, insert default role
      if (!data) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role: 'customer' }])
        
        if (insertError) {
          console.warn('Failed to insert default role:', insertError)
          setRole('customer') // Still use default even if insert fails
          return
        }

        setRole('customer')
        return
      }

      setRole(data.role as AppRole)
    } catch (err) {
      console.error('Error managing user role:', err)
      setRole('customer') // Safe default
    }
  }

  const resetAuthState = () => {
    clearAuthDependentState([
      () => setUser(null),
      () => setRole(null),
    ])
  }

  const handleExpiredSession = async () => {
    resetAuthState()
    setIsLoading(false)
  }

  // Bootstrap session on app load (runs once)
  useEffect(() => {
    let isMounted = true

    const initSession = async () => {
      try {
        const snapshot = await restoreSessionOnBootstrap()
        if (!isMounted) return

        if (snapshot.status === 'expired') {
          await handleExpiredSession()
          return
        }

        // Set user only (fetch role separately to avoid infinite loop)
        // Keep isLoading = true until role is fetched
        setUser(snapshot.user)
        // Don't set isLoading=false here - let the role effect do it
      } catch (err) {
        console.error('Error initializing session:', err)
        resetAuthState()
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void initSession()

    // Subscribe to session lifecycle changes
    const unsubscribe = subscribeToSessionLifecycle((snapshot) => {
      if (!isMounted) return

      if (snapshot.status === 'expired') {
        void handleExpiredSession()
        return
      }

      // Update user when session changes
      setUser(snapshot.user)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  // Fetch user role when user changes (separate effect to avoid infinite loop)
  useEffect(() => {
    // If user is undefined, this might be temporary navigation
    // Don't reset role here - let it persist until we know for sure it's a logout
    if (!user) {
      return
    }

    const load = async () => {
      await fetchUserRole(user.id)
      setIsLoading(false) // Done loading after role is fetched
    }

    void load()
  }, [user?.id])

  // Health check timer
  useEffect(() => {
    let isMounted = true

    const healthCheckTimer = window.setInterval(async () => {
      if (!isMounted || !user) return

      try {
        const snapshot = await evaluateSessionHealth()
        if (snapshot.status === 'expired') {
          await handleExpiredSession()
        }
      } catch (err) {
        console.error('Session health check error:', err)
      }
    }, 60_000)

    return () => {
      isMounted = false
      window.clearInterval(healthCheckTimer)
    }
  }, [user])

  const signOut = async () => {
    try {
      const supabase = initSupabase()
      await supabase.auth.signOut()
      resetAuthState()
      localStorage.removeItem('supabase.auth.token')
    } catch (err) {
      console.error('Error signing out:', err)
      throw err
    }
  }

  const value: UserContextValue = {
    user,
    role,
    isLoading,
    signOut,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within UserProvider')
  }
  return context
}

export function useUserRole() {
  const { role } = useUser()
  return role
}
