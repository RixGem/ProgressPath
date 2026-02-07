'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  syncing: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, metadata?: any) => Promise<any>
  signOut: () => Promise<void>
  refreshSession: () => Promise<Session | null>
  updateUserMetadata: (metadata: any) => Promise<any>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const syncAttempts = useRef(0)
  const MAX_SYNC_ATTEMPTS = 3

  // Update pathname ref when it changes
  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  // Sync user profile data from database
  const syncUserProfile = useCallback(async (userId: string) => {
    if (!userId || syncAttempts.current >= MAX_SYNC_ATTEMPTS) return null

    try {
      setSyncing(true)
      syncAttempts.current += 1

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine for new users
        throw profileError
      }

      // If no profile exists, create one
      if (!profile) {
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([{
            id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (createError) {
          console.warn('Profile creation skipped:', createError.message)
          return null
        }

        return newProfile
      }

      syncAttempts.current = 0 // Reset on success
      return profile
    } catch (err: any) {
      console.error('Error syncing user profile:', err)
      setError(err.message)
      return null
    } finally {
      setSyncing(false)
    }
  }, [])

  // Force refresh session
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()
      if (error) throw error

      if (session?.user) {
        setUser(session.user)
        await syncUserProfile(session.user.id)
      }

      return session
    } catch (err: any) {
      console.error('Error refreshing session:', err)
      setError(err.message)
      return null
    }
  }, [syncUserProfile])

  // Initialize session and set up listeners
  useEffect(() => {
    let mounted = true

    console.log('[Auth] Setting up listener...')

    // 1. Set up listener - this usually fires immediately with current session from localStorage
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Event:', event)

        if (!mounted) return

        const currentUser = session?.user ?? null
        setUser(currentUser)
        setLoading(false)
        setError(null) // Clear any previous errors

        // Sync profile on relevant events
        if (currentUser && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION')) {
          syncUserProfile(currentUser.id).catch(err => console.error('[Auth] Profile sync failed:', err))
        }

        // Handle sign out
        if (event === 'SIGNED_OUT') {
          setUser(null)
          syncAttempts.current = 0
          if (pathnameRef.current && !pathnameRef.current.startsWith('/embed')) {
            router.push('/login')
          }
        }

        if (event === 'PASSWORD_RECOVERY') {
          router.push('/reset-password')
        }
      }
    )

    // 2. Safety timeout: If Supabase doesn't fire ANY event within 2 seconds, assume no user
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[Auth] No auth event received, forcing loading: false')
        setLoading(false)
      }
    }, 2000)

    // Set up periodic session check (every 5 minutes)
    sessionCheckInterval.current = setInterval(async () => {
      if (mounted) {
        // We can keep getSession here as it's background and won't block UI
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && session.user.id !== user?.id) {
          setUser(session.user)
          await syncUserProfile(session.user.id)
        }
      }
    }, 5 * 60 * 1000)

    // Listen for storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'supabase.auth.token' && mounted) {
        refreshSession()
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      mounted = false
      clearTimeout(safetyTimeout)
      subscription?.unsubscribe()
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current)
      }
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [router, syncUserProfile, refreshSession, user?.id, loading])

  // Sign in with error handling and retry logic
  const signIn = useCallback(async (email: string, password: string, retries = 2) => {
    setError(null)

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        // Sync profile after successful sign in
        if (data.user) {
          await syncUserProfile(data.user.id)
        }

        return data
      } catch (err: any) {
        if (attempt === retries) {
          setError(err.message)
          throw err
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }
  }, [syncUserProfile])

  // Sign up with profile initialization
  const signUp = useCallback(async (email: string, password: string, metadata = {}) => {
    setError(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })

      if (error) throw error

      // Initialize profile for new user
      if (data.user) {
        await syncUserProfile(data.user.id)
      }

      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [syncUserProfile])

  // Sign out with cleanup
  const signOut = useCallback(async () => {
    setError(null)

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Clear local state
      setUser(null)
      syncAttempts.current = 0

    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [])

  // Update user metadata
  const updateUserMetadata = useCallback(async (metadata: any) => {
    setError(null)

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: metadata
      })

      if (error) throw error

      if (data.user) {
        setUser(data.user)
        await syncUserProfile(data.user.id)
      }

      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [syncUserProfile])

  const value: AuthContextType = {
    user,
    loading,
    syncing,
    error,
    signIn,
    signUp,
    signOut,
    refreshSession,
    updateUserMetadata,
    clearError: () => setError(null)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
