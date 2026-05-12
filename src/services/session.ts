import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { initSupabase } from '../lib/supabase'

export type SessionStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'expired'

export type SessionTransitionReason =
  | 'bootstrap'
  | 'signed-in'
  | 'signed-out'
  | 'token-refreshed'
  | 'refresh-failed'
  | 'recovered'
  | 'unknown'

export interface SessionLifecycleSnapshot {
  status: SessionStatus
  user: User | null
  reason: SessionTransitionReason
  notice: string | null
}

type StateResetter = () => void

function toSnapshot(
  status: SessionStatus,
  user: User | null,
  reason: SessionTransitionReason,
  notice: string | null = null,
): SessionLifecycleSnapshot {
  return {
    status,
    user,
    reason,
    notice,
  }
}

function sessionToSnapshot(
  session: Session | null,
  reason: SessionTransitionReason,
): SessionLifecycleSnapshot {
  if (session?.user) {
    return toSnapshot('authenticated', session.user, reason)
  }

  return toSnapshot('unauthenticated', null, reason)
}

export function clearAuthDependentState(resetters: StateResetter[]): void {
  for (const reset of resetters) {
    reset()
  }
}

export async function restoreSessionOnBootstrap(): Promise<SessionLifecycleSnapshot> {
  const supabase = initSupabase()
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    return toSnapshot(
      'expired',
      null,
      'refresh-failed',
      'No se pudo restaurar tu sesión. Iniciá sesión nuevamente.',
    )
  }

  return sessionToSnapshot(data.session, 'bootstrap')
}

export async function evaluateSessionHealth(): Promise<SessionLifecycleSnapshot> {
  const supabase = initSupabase()
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    return toSnapshot(
      'expired',
      null,
      'refresh-failed',
      'Tu sesión expiró y necesitás volver a iniciar sesión para renovarla.',
    )
  }

  return sessionToSnapshot(data.session, 'token-refreshed')
}

export function mapAuthChangeToSnapshot(
  event: AuthChangeEvent,
  session: Session | null,
): SessionLifecycleSnapshot {
  if (event === 'SIGNED_OUT') {
    return toSnapshot('unauthenticated', null, 'signed-out')
  }

  if (event === 'TOKEN_REFRESHED') {
    if (session?.user) {
      return toSnapshot('authenticated', session.user, 'token-refreshed')
    }

    return toSnapshot(
      'expired',
      null,
      'refresh-failed',
      'No se pudo renovar tu sesión. Iniciá sesión nuevamente.',
    )
  }

  if (event === 'SIGNED_IN') {
    return sessionToSnapshot(session, 'signed-in')
  }

  return sessionToSnapshot(session, 'unknown')
}

export function subscribeToSessionLifecycle(
  onTransition: (snapshot: SessionLifecycleSnapshot) => void,
): () => void {
  const supabase = initSupabase()
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    onTransition(mapAuthChangeToSnapshot(event, session))
  })

  return () => {
    subscription.unsubscribe()
  }
}

export async function signOutWithCleanup(resetters: StateResetter[]): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }

  clearAuthDependentState(resetters)
}

export function redirectToSignInEntryPoint(): void {
  const signInUrl = `${window.location.origin}${window.location.pathname}`
  window.location.assign(signInUrl)
}

export function recoverExpiredSession(resetters: StateResetter[]): void {
  clearAuthDependentState(resetters)
  redirectToSignInEntryPoint()
}
