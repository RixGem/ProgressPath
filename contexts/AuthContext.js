'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  const sessionCheckInterval = useRef(null)
  const syncAttempts = useRef(0)
  const MAX_SYNC_ATTEMPTS = 3

  // Update pathname ref when it changes
  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  // Sync user profile data from database
  const syncUserProfile = useCallback(async (userId) => {
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
    } catch (err) {
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
    } catch (err) {
      console.error('Error refreshing session:', err)
      setError(err.message)
      return null
    }
  }, [syncUserProfile])

  // Initialize session and set up listeners
  useEffect(() => {
    let mounted = true
    // Track if we've already handled the initial session via subscription
    let sessionHandled = false

    // Set up auth state change listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State change:', event)
        
        if (!mounted) return

        // Mark as handled so getSession doesn't overwrite/race
        sessionHandled = true

        const currentUser = session?.user ?? null
        setUser(currentUser)
        setLoading(false)
        setError(null)

        // Sync profile on sign in or token refresh
        if (currentUser && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
          await syncUserProfile(currentUser.id).catch(err => console.error('[Auth] Profile sync failed:', err))
        }

        // Handle sign out
        if (event === 'SIGNED_OUT') {
          setUser(null)
          syncAttempts.current = 0
          
          // Only redirect if NOT on an embed page
          if (!pathnameRef.current?.startsWith('/embed')) {
            router.push('/login')
          }
        }

        // Handle password recovery
        if (event === 'PASSWORD_RECOVERY') {
          router.push('/reset-password')
        }
      }
    )

    // Fallback initialization: check session manually if subscription didn't fire immediately
    const initializeAuth = async () => {
      console.log('[Auth] Initializing fallback check...')
      try {
        // Short delay to let subscription fire first if it's going to
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (sessionHandled) {
          console.log('[Auth] Session already handled by subscription, skipping fallback')
          return
        }

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session initialization timed out')), 5000)
        )

        // Race between getting session and timeout
        const { data: { session }, error: sessionError } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ])
        
        if (sessionError) {
          throw sessionError
        }

        console.log('[Auth] Fallback session retrieved:', session ? 'User present' : 'No session')

        if (mounted && !sessionHandled) {
          const currentUser = session?.user ?? null
          setUser(currentUser)
          
          if (currentUser) {
            syncUserProfile(currentUser.id).catch(err => console.error('[Auth] Profile sync failed:', err))
          }
          
          setLoading(false)
          console.log('[Auth] Fallback initialization complete')
        }
      } catch (err) {
        console.error('[Auth] Error in fallback initialization:', err)
        if (mounted && !sessionHandled) {
          setError(err.message)
          setLoading(false)
          console.log('[Auth] Fallback initialization failed, loading: false (forced)')
        }
      }
    }

    initializeAuth()

    // Set up periodic session check (every 5 minutes)
    sessionCheckInterval.current = setInterval(async () => {
      if (mounted) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && session.user.id !== user?.id) {
          setUser(session.user)
          await syncUserProfile(session.user.id)
        }
      }
    }, 5 * 60 * 1000)

    // Listen for storage events (cross-tab synchronization)
    const handleStorageChange = (e) => {
      if (e.key === 'supabase.auth.token' && mounted) {
        refreshSession()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Cleanup
    return () => {
      mounted = false
      subscription?.unsubscribe()
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current)
      }
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [router, syncUserProfile, refreshSession, user?.id])

  // Sign in with error handling and retry logic
  const signIn = useCallback(async (email, password, retries = 2) => {
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
      } catch (err) {
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
  const signUp = useCallback(async (email, password, metadata = {}) => {
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
    } catch (err) {
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
      
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  // Update user metadata
  const updateUserMetadata = useCallback(async (metadata) => {
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
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [syncUserProfile])

  const value = {
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
