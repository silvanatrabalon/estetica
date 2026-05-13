import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { initSupabase } from '../lib/supabase'
import {
  restoreSessionOnBootstrap,
  subscribeToSessionLifecycle,
  evaluateSessionHealth,
  clearAuthDependentState,
} from '../services/session'
import {
  ensureProfileOnBootstrap,
  getMyProfile,
  type ProfileBootstrapResult,
} from '../services/profile'
import { getCurrentUserActivationStatus } from '../services/adminUsers'
import { isProfileComplete, type ProfileBootstrapStatus, type ProfileRecord } from '../lib/profile'
import { profileCopy } from '../lib/uiCopy'

export type AppRole = 'customer' | 'staff' | 'admin'

const appRoles: AppRole[] = ['customer', 'staff', 'admin']

const DEV_ROLE_KEY = '__dev_role_override__'

/**
 * Dev-only role override. Persists in localStorage so it survives SPA navigation.
 *
 * Activate:  ?devRole=admin | staff | customer
 * Deactivate: ?devRole=off
 *
 * Returns null in production or when no override is active.
 */
function getDevRoleOverride(): AppRole | null {
  if (!import.meta.env.DEV) return null

  const param = new URLSearchParams(window.location.search).get('devRole')

  if (param === 'off') {
    localStorage.removeItem(DEV_ROLE_KEY)
    return null
  }

  if (param && appRoles.includes(param as AppRole)) {
    localStorage.setItem(DEV_ROLE_KEY, param)
  }

  const stored = localStorage.getItem(DEV_ROLE_KEY)
  return stored && appRoles.includes(stored as AppRole) ? (stored as AppRole) : null
}

interface UserContextValue {
  user: User | null
  roles: AppRole[]
  activeRole: AppRole | null
  setActiveRole: (role: AppRole) => void
  profile: ProfileRecord | null
  profileStatus: ProfileBootstrapStatus
  profileWarning: string | null
  isLoading: boolean
  signOut: () => Promise<void>
  retryRoleResolution: () => Promise<void>
  retryProfileBootstrap: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const UserContext = createContext<UserContextValue | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [roles, setRoles] = useState<AppRole[]>([])
  const [activeRole, setActiveRoleState] = useState<AppRole | null>(null)
  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [profileStatus, setProfileStatus] = useState<ProfileBootstrapStatus>('incomplete')
  const [profileWarning, setProfileWarning] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const setActiveRole = (role: AppRole) => {
    setActiveRoleState(role)
  }

  // Fetch all roles for a user via get_user_roles() RPC
  const fetchUserRoles = async () => {
    try {
      const supabase = initSupabase()
      const { data, error } = await supabase.rpc('get_user_roles')

      if (error) {
        console.warn('Error fetching user roles:', error)
        setRoles(['customer'])
        setActiveRoleState('customer')
        return
      }

      const fetchedRoles = (data ?? ['customer']) as AppRole[]

      const devOverride = getDevRoleOverride()
      if (devOverride) {
        console.warn(`[DEV] Role override active: "${devOverride}"`)
        setRoles([devOverride])
        setActiveRoleState(devOverride)
        return
      }

      setRoles(fetchedRoles)
      // Single role → set immediately; multi-role → leave null so selector shows
      if (fetchedRoles.length === 1) {
        setActiveRoleState(fetchedRoles[0])
      } else {
        setActiveRoleState(null)
      }
    } catch (err) {
      console.error('Error fetching user roles:', err)
      setRoles(['customer'])
      setActiveRoleState('customer')
    }
  }

  const applyProfileBootstrapResult = (result: ProfileBootstrapResult) => {
    setProfile(result.profile)
    setProfileStatus(result.status)
    setProfileWarning(result.warning)
  }

  const bootstrapProfile = async (authenticatedUser: User) => {
    const result = await ensureProfileOnBootstrap(authenticatedUser)
    applyProfileBootstrapResult(result)
  }

  const refreshProfile = async () => {
    if (!user) {
      return
    }

    try {
      const resolvedProfile = await getMyProfile()

      if (!resolvedProfile) {
        setProfile(null)
        setProfileStatus('incomplete')
        setProfileWarning(profileCopy.incompleteWarning)
        return
      }

      const complete = isProfileComplete(resolvedProfile)
      setProfile(resolvedProfile)
      setProfileStatus(complete ? 'complete' : 'incomplete')
      setProfileWarning(
        complete
          ? null
          : profileCopy.incompleteWarning,
      )
    } catch {
      setProfileStatus('load-error')
      setProfileWarning(profileCopy.syncUnavailableWarning)
    }
  }

  const resetAuthState = () => {
    clearAuthDependentState([
      () => setUser(null),
      () => setRoles([]),
      () => setActiveRoleState(null),
      () => setProfile(null),
      () => setProfileStatus('incomplete'),
      () => setProfileWarning(null),
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

        // Set user and resolve loading lifecycle based on session presence.
        setUser(snapshot.user)

        if (!snapshot.user) {
          setRoles([])
          setActiveRoleState(null)
          setProfile(null)
          setProfileStatus('incomplete')
          setProfileWarning(null)
          setIsLoading(false)
        }
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

      // Update user when session changes and clear loading for signed-out state.
      setUser(snapshot.user)
      if (!snapshot.user) {
        setRoles([])
        setActiveRoleState(null)
        setProfile(null)
        setProfileStatus('incomplete')
        setProfileWarning(null)
        setIsLoading(false)
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  // Fetch user role when user changes (separate effect to avoid infinite loop)
  useEffect(() => {
    if (!user) {
      return
    }

    const load = async () => {
      const isActive = await getCurrentUserActivationStatus()

      if (!isActive) {
        const supabase = initSupabase()
        await supabase.auth.signOut()
        resetAuthState()
        setIsLoading(false)
        return
      }

      await Promise.all([
        fetchUserRoles(),
        bootstrapProfile(user),
      ])
      setIsLoading(false)
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
      setIsLoading(false)
      localStorage.removeItem('supabase.auth.token')
    } catch (err) {
      console.error('Error signing out:', err)
      throw err
    }
  }

  const retryRoleResolution = async () => {
    if (!user) {
      return
    }

    setIsLoading(true)
    await fetchUserRoles()
    setIsLoading(false)
  }

  const retryProfileBootstrap = async () => {
    if (!user) {
      return
    }

    await bootstrapProfile(user)
  }

  const value: UserContextValue = {
    user,
    roles,
    activeRole,
    setActiveRole,
    profile,
    profileStatus,
    profileWarning,
    isLoading,
    signOut,
    retryRoleResolution,
    retryProfileBootstrap,
    refreshProfile,
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
  const { activeRole } = useUser()
  return activeRole
}
